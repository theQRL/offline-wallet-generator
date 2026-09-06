#!/usr/bin/env bash
#
# Release gate for the single-file offline artefact.
#
# The previous version of this script searched for two fixed strings from
# index.html and then printed "self-contained". An artefact carrying a remote
# <script>, a remote stylesheet and a seed-exfiltrating fetch() passed it. This
# version checks the property the claim actually rests on: that nothing in the
# file can load a resource from, or send data to, the network.
#
# Static inspection cannot prove that on its own — the bundled Emscripten
# runtime and jsPDF contain network primitives in code paths this application
# never calls. So this gate bounds the *text*, and browser-tests/offline.spec.js
# bounds the *behaviour* by loading the artefact with the network denied. Both
# run in CI; neither is sufficient alone.

set -uo pipefail

FILE="${1:-dist-offline/index.html}"
fail=0
note() { printf '  %s\n' "$1"; }
bad() { printf 'FAIL: %s\n' "$1"; fail=1; }

if [ ! -f "$FILE" ]; then
  echo "FAIL: $FILE does not exist. Run 'npm run build:offline' first."
  exit 1
fi

DIR="$(dirname "$FILE")"
echo "Checking $FILE ($(wc -c < "$FILE" | tr -d ' ') bytes)"

# ---------------------------------------------------------------------------
# 1. Exactly one file. Catches a chunk, worker or asset Vite failed to inline.
# ---------------------------------------------------------------------------
file_count=$(find "$DIR" -type f | wc -l | tr -d ' ')
if [ "$file_count" = 1 ]; then
  note 'output files: 1'
else
  bad "expected one output file, found $file_count"
  find "$DIR" -type f | sed 's/^/    /'
fi

# ---------------------------------------------------------------------------
# 2. No relative resource references left un-inlined.
# ---------------------------------------------------------------------------
for reference in 'src="./qrllib.js"' 'href="./favicon.ico"' 'src="/src/main.js"'; do
  if grep -a -q -F -- "$reference" "$FILE"; then
    bad "external resource remains: $reference"
  else
    note "$reference: inlined"
  fi
done

# ---------------------------------------------------------------------------
# 3. No remote resource loads.
#
# Anchor hrefs are navigational — the user clicking a documentation link is not
# the artefact contacting the network — so only resource-loading attributes are
# considered. ALLOWED_REMOTE lists URLs that are present as inert string
# constants inside vendored libraries, in code paths this application does not
# call. Every entry needs a reason. Adding one is a decision, not a formality.
# ---------------------------------------------------------------------------
ALLOWED_REMOTE=(
  # jsPDF's output('pdfobjectnewwindow') branch builds a <script> tag from this
  # constant. We call save(); that branch is unreachable. Verified by grepping
  # the source for output( — no call site exists.
  'https://cdnjs.cloudflare.com/ajax/libs/pdfobject/'
)

remote_hits=$(grep -aoE '(src|href)[[:space:]]*=[[:space:]]*\\?"https?://[^"\\]{1,120}' "$FILE" \
  | sed -E 's/^(src|href)[[:space:]]*=[[:space:]]*\\?"//' | sort -u || true)

unexpected=''
while IFS= read -r url; do
  [ -z "$url" ] && continue
  allowed=0
  for prefix in "${ALLOWED_REMOTE[@]}"; do
    case "$url" in "$prefix"*) allowed=1 ;; esac
  done
  # Anchor hrefs to documentation and releases are navigation, not loading.
  # Each pattern must end at a path boundary: a bare `…theqrl.org*` also
  # matches `…theqrl.org.evil.com/steal`, which is the exact trick this gate
  # exists to catch. The bare-origin forms are listed explicitly.
  case "$url" in
    https://docs.theqrl.org/*|https://docs.theqrl.org) allowed=1 ;;
    https://github.com/theQRL/*) allowed=1 ;;
    https://offline-wallet-generator.theqrl.org/*|https://offline-wallet-generator.theqrl.org) allowed=1 ;;
  esac
  [ "$allowed" = 0 ] && unexpected="$unexpected$url"$'\n'
done <<< "$remote_hits"

if [ -n "$unexpected" ]; then
  bad 'unexpected remote resource reference(s):'
  printf '%s' "$unexpected" | sed 's/^/    /'
else
  note 'remote resource references: none outside the documented allowlist'
fi

# ---------------------------------------------------------------------------
# 4. Network-primitive budget.
#
# The Emscripten runtime and jsPDF ship fetch/XHR in paths we never enter.
# Pinning the counts means new ones show up as a diff instead of hiding in the
# noise. If a legitimate dependency change moves these, update the numbers in
# the same commit and say why.
# ---------------------------------------------------------------------------
EXPECTED_FETCH=3
EXPECTED_XHR=8
actual_fetch=$(grep -aoE 'fetch\(' "$FILE" | wc -l | tr -d ' ')
actual_xhr=$(grep -aoE 'XMLHttpRequest' "$FILE" | wc -l | tr -d ' ')

if [ "$actual_fetch" -le "$EXPECTED_FETCH" ] && [ "$actual_xhr" -le "$EXPECTED_XHR" ]; then
  note "network primitives: fetch=$actual_fetch/$EXPECTED_FETCH xhr=$actual_xhr/$EXPECTED_XHR (within budget)"
else
  bad "network primitives above budget: fetch=$actual_fetch (max $EXPECTED_FETCH), xhr=$actual_xhr (max $EXPECTED_XHR)"
  note 'If a dependency change caused this, confirm the new occurrences are unreachable and update the budget.'
fi

for primitive in 'WebSocket(' 'sendBeacon' 'EventSource(' 'importScripts('; do
  count=$(grep -acF -- "$primitive" "$FILE" || true)
  if [ "$count" -gt 0 ]; then
    bad "$primitive present ($count) — no code path in this application needs it"
  fi
done

# ---------------------------------------------------------------------------
# 5. Application content is really there.
#
# The qrllib version is rendered at runtime from a build-time constant now, so
# it is not a static string in the file. Assert on markup the build emits and
# on the constant itself.
# ---------------------------------------------------------------------------
if grep -a -q -F '<title>QRL Offline Wallet Generator</title>' "$FILE"; then
  note 'application content: present'
else
  bad 'application content is missing'
fi

# Resolve relative to this script, not the caller's cwd, and fail the gate if
# the version cannot be determined. Leaving it empty previously skipped the
# assertion silently — a check that quietly does nothing is worse than no
# check, because the PASS line still claims it ran.
#
# Which quote character wraps the constant is the minifier's choice, and it
# changes with the bundler: Vite 8 moved to Rolldown, whose minifier emits
# backticks where the previous one emitted double quotes. Matching one of them
# turned a green gate red on a dependency bump alone. Accept any of the three
# JS string delimiters, but still require a matched pair around the exact
# version — the point is to catch a stale or absent constant, not a quote.
# Three fixed-string patterns rather than one alternation, so the version is
# never interpreted as a regex.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
QRLLIB_PKG="$REPO_ROOT/node_modules/@theqrl/qrllib-browserify/package.json"

if [ ! -f "$QRLLIB_PKG" ]; then
  bad "cannot resolve $QRLLIB_PKG — run 'npm ci' before checking the artefact"
elif ! qrllib_version=$(node -p \
  "const p=require('$QRLLIB_PKG');p.dependencies?.qrllib ?? p.version" 2>/dev/null) \
  || [ -z "$qrllib_version" ]; then
  bad 'could not determine the installed qrllib version'
elif grep -a -q -F \
    -e "qrllibVersion:\"$qrllib_version\"" \
    -e "qrllibVersion:'$qrllib_version'" \
    -e "qrllibVersion:\`$qrllib_version\`" \
    "$FILE"; then
  note "qrllib version constant: $qrllib_version"
else
  bad "built artefact does not carry the installed qrllib version ($qrllib_version)"
fi

# The WASM must be embedded, not fetched.
if grep -a -q -F '.wasm' "$FILE"; then
  bad 'a .wasm reference is present — the WebAssembly module must be embedded'
else
  note 'WebAssembly: embedded, no .wasm reference'
fi

if [ "$fail" = 0 ]; then
  echo 'PASS: offline artefact is self-contained.'
else
  echo 'FAILED: do not publish this artefact.'
fi
exit "$fail"
