<template>
  <div>
    <div class="card bg-base-200 shadow-lg mx-auto my-8 max-w-4xl">
      <div class="card-body">
        <h1 class="card-title text-3xl justify-center mb-4">QRL Offline Wallet Generator</h1>

        <!-- Loading State -->
        <div id="loading" v-show="!qrllibLoaded">
          <div class="flex flex-col items-center gap-2">
            <p class="text-primary">Loading QRL Library...</p>
            <p class="text-base-content/60 text-sm">qrllib v{{ qrllibVersion }}</p>
            <span class="loading loading-spinner loading-lg text-primary"></span>
          </div>
        </div>

        <!-- Loaded State -->
        <div id="loaded" v-show="qrllibLoaded">
          <!-- Generate Options -->
          <div id="generateButton" v-show="showGenerateButton">
            <div class="flex flex-col sm:flex-row justify-center items-center gap-6 mt-4">
              <!-- Hash Function Select -->
              <div class="flex flex-col items-center gap-1">
                <span class="text-sm font-medium">Hash function</span>
                <select id="hashFunction" data-testid="hash-function" class="select select-bordered select-secondary w-48" v-model="selectedHash" @change="thisHash(selectedHash)">
                  <option value="SHAKE_128">SHAKE_128</option>
                  <option value="SHAKE_256">SHAKE_256</option>
                  <option value="SHA2_256">SHA2_256</option>
                </select>
              </div>

              <!-- Tree Height Select -->
              <div class="flex flex-col items-center gap-1">
                <span class="text-sm font-medium">Tree height</span>
                <select id="treeHeight" data-testid="tree-height" class="select select-bordered select-secondary w-64" v-model="selectedHeight" @change="thisHeight(selectedHeight)">
                  <option :value="8">Height: 8, Signatures: 256</option>
                  <option :value="10">Height: 10, Signatures: 1,024</option>
                  <option :value="12">Height: 12, Signatures: 4,096</option>
                  <option :value="14">Height: 14, Signatures: 16,384</option>
                  <option :value="16">Height: 16, Signatures: 65,536</option>
                  <option :value="18">Height: 18, Signatures: 262,144</option>
                </select>
              </div>
            </div>

            <div class="flex justify-center mt-4">
              <button class="btn btn-primary" @click="generateWallet(false)">Generate</button>
            </div>
          </div>

          <p v-if="errorM" role="alert" class="text-error text-center mt-4">{{ errorM }}</p>

          <!-- Generating Spinner -->
          <div id="generatingSpinner" v-show="showGeneratingSpinner" class="mt-8">
            <div class="flex flex-col items-center gap-4">
              <p>Generating new address...</p>
              <span class="loading loading-spinner loading-lg"></span>
              <p class="text-sm text-base-content/70">{{ estimatedTimeMessage }}</p>
              <p class="text-sm font-mono">Elapsed: {{ formattedElapsedTime }}</p>
            </div>
          </div>

          <!-- Generated Wallet -->
          <div id="generated" v-show="showGenerated" class="mt-8 space-y-4">
            <div class="flex justify-center">
              <img id="wasm" :src="logoSvg" class="h-16" alt="QRL Logo">
            </div>

            <!-- Address -->
            <div class="bg-base-300 p-4 rounded-lg">
              <p class="font-bold text-sm mb-1">Address</p>
              <p id="address" class="font-mono text-xs break-all"></p>
            </div>
            <div class="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>It's okay to share your address with others.</span>
            </div>

            <!-- Mnemonic -->
            <div class="bg-base-300 p-4 rounded-lg">
              <p class="font-bold text-sm mb-1">Mnemonic</p>
              <p id="mnemonic" class="font-mono text-xs break-words"></p>
            </div>
            <div class="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Do not share your mnemonic phrase with anyone!</span>
            </div>

            <!-- Hexseed -->
            <div class="bg-base-300 p-4 rounded-lg">
              <p class="font-bold text-sm mb-1">Hexseed</p>
              <p id="hexseed" class="font-mono text-xs break-all"></p>
            </div>
            <div class="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Do not share your hexseed with anyone!</span>
            </div>

            <!-- Public Key (hidden) -->
            <p id="pk" class="hidden"></p>

            <!-- Action Buttons -->
            <div class="flex flex-wrap justify-center items-center gap-2 mt-6">
              <button class="btn btn-primary btn-sm" @click="printWallet">Print</button>
              <!-- The OTS tracker is PDF-only, so its toggle sits with the PDF
                   button. Hidden for trees too tall for a paper grid. -->
              <div class="flex flex-col gap-2 rounded-lg border border-base-300 px-2 py-2">
                <div class="flex flex-wrap items-center gap-3">
                  <button id="pdfSave" class="btn btn-primary btn-sm" :disabled="!walletLabelCheck.valid" @click="pdfSave">Save PDF</button>
                  <label v-if="otsTrackerLayout" class="label cursor-pointer gap-2">
                    <input type="checkbox" data-testid="ots-tracker" class="toggle toggle-primary toggle-sm" v-model="includeOtsTracker" />
                    <span class="label-text text-sm">Include OTS tracker (+{{ otsTrackerLayout.pages }} {{ otsTrackerLayout.pages === 1 ? 'page' : 'pages' }})</span>
                  </label>
                </div>
                <!-- Printed on the PDF only. Validated by allowlist in
                     src/wallet-label.js; rendered here only through v-model
                     and text interpolation, never v-html. -->
                <label class="flex flex-col gap-1">
                  <span class="text-sm">PDF label (optional)</span>
                  <input
                    v-model="walletLabel"
                    type="text"
                    data-testid="wallet-label"
                    class="input input-bordered input-sm w-full"
                    :class="{ 'input-error': !walletLabelCheck.valid }"
                    :maxlength="maxWalletLabelLength"
                    placeholder="e.g. Cold storage 1"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    :aria-invalid="!walletLabelCheck.valid"
                    aria-describedby="wallet-label-help"
                  />
                  <span id="wallet-label-help" class="text-xs" :class="walletLabelCheck.valid ? 'text-base-content/60' : 'text-error'">
                    {{ walletLabelCheck.valid ? 'Printed on every page. Never put a password or seed words here.' : walletLabelCheck.error }}
                  </span>
                </label>
              </div>
            </div>

            <!-- Save Options -->
            <div class="divider">Save Wallet</div>

            <div class="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>Remember to move saved files to a secure location.</span>
            </div>

            <div class="flex justify-center">
              <label class="label cursor-pointer gap-2">
                <span class="label-text">Use encrypted format</span>
                <input type="checkbox" class="toggle toggle-primary" v-model="isSecure" />
              </label>
            </div>

            <!-- Encrypted Save -->
            <div v-if="isSecure" class="space-y-4">
              <div class="form-control w-full max-w-md mx-auto">
                <label class="label">
                  <span class="label-text">Password (min {{ minPasswordLength }} characters, weak passwords are rejected)</span>
                </label>
                <!-- "new-password" stops a manager autofilling an unrelated
                     stored credential over the wallet password. Managers are
                     deliberately NOT suppressed here: forgetting this password
                     loses the wallet, so saving it is a reasonable user
                     choice. That is the opposite of the seed field above. -->
                <input
                  type="password"
                  v-model="password"
                  v-on:input="check"
                  class="input input-bordered w-full focus:input-secondary focus:border-secondary"
                  placeholder="Enter password"
                  autocomplete="new-password"
                  spellcheck="false"
                />
                <!-- Password strength indicator -->
                <div v-if="password.length > 0" class="mt-2">
                  <div class="flex gap-1">
                    <div class="h-1 flex-1 rounded" :class="strengthBarClass(1)"></div>
                    <div class="h-1 flex-1 rounded" :class="strengthBarClass(2)"></div>
                    <div class="h-1 flex-1 rounded" :class="strengthBarClass(3)"></div>
                  </div>
                  <p class="text-xs mt-1 font-medium" :class="strengthTextClass">
                    {{ passwordStrength.feedback }}
                  </p>
                </div>
              </div>
              <div class="form-control w-full max-w-md mx-auto">
                <label class="label">
                  <span class="label-text">Confirm Password</span>
                </label>
                <input
                  type="password"
                  v-model="passwordConfirm"
                  v-on:input="check"
                  class="input input-bordered w-full focus:input-secondary focus:border-secondary"
                  placeholder="Confirm password"
                  autocomplete="new-password"
                  spellcheck="false"
                />
              </div>
              <p v-if="error" class="text-error text-center text-sm">{{ error }}</p>
              <!-- Encryption progress -->
              <div v-if="isEncrypting" class="w-full max-w-md mx-auto">
                <p class="text-sm text-center mb-2">Encrypting wallet (this may take a moment)...</p>
                <progress class="progress progress-primary w-full" :value="encryptionProgress" max="100"></progress>
                <p class="text-xs text-center mt-1">{{ encryptionProgress }}%</p>
              </div>
              <div v-else class="flex justify-center">
                <button
                  class="btn btn-primary"
                  :class="{ 'btn-disabled': !validated }"
                  :disabled="!validated"
                  v-on:click="saveJSON"
                >
                  Save encrypted (v3 format)
                </button>
              </div>
              <p class="text-xs text-center text-base-content/60">
                Uses scrypt key derivation + AES-256-GCM authenticated encryption
              </p>
            </div>

            <!-- Unencrypted Save -->
            <div v-else class="space-y-4">
              <div class="alert alert-warning">
                <span>Warning: Saving without encryption is not recommended for production use.</span>
              </div>
              <div class="flex justify-center">
                <button class="btn btn-warning" v-on:click="saveJSON">Save unencrypted (v3 format)</button>
              </div>
            </div>
          </div>

          <!-- Regenerate Section -->
          <div id="regenArea" v-show="showRegenArea" class="mt-8">
            <div class="divider">Or Regenerate from Existing</div>
            <div class="flex flex-col items-center gap-1 max-w-lg mx-auto">
              <span class="text-sm font-medium">Enter hexseed or mnemonic</span>
              <!-- Deliberately not masked: a 34-word mnemonic has to be
                   readable to be checked, and a mistyped seed silently derives
                   a *different valid wallet* rather than erroring. The real
                   risks here are the browser storing or transmitting the seed,
                   which the attributes below close.
                   spellcheck="false" is the important one — Chromium's
                   enhanced spellcheck sends field contents to a remote service.
                   autocorrect/autocapitalize would mangle wordlist words.
                   The data-* attributes stop password managers offering to
                   save seed material to disk. -->
              <textarea
                v-model="hexseedMnemonic"
                class="textarea textarea-bordered w-full h-24 focus:textarea-secondary focus:border-secondary"
                placeholder="Enter your hexseed or mnemonic phrase..."
                spellcheck="false"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                data-1p-ignore
                data-lpignore="true"
                data-bwignore
              ></textarea>
            </div>
            <div class="flex justify-center mt-4">
              <button class="btn btn-primary" @click="generateWallet(true)">Regenerate</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint new-cap:0 */
import { jsPDF } from 'jspdf';
import print from 'print-js';
import logoSvgRaw from '/logo.svg?raw';
import WalletWorker from '../wallet-worker.js?worker&inline';
import { getSecureRandomSeed, SECURE_RANDOM_ERROR } from '../secure-random.js';
import { validatePassword, MINIMUM_PASSWORD_LENGTH } from '../password-policy.js';
import { buildEncryptedEnvelope, buildUnencryptedEnvelope } from '../wallet-envelope.js';
import { addOtsGridPages, otsGridLayout, treeHeightFromHexseed } from '../ots-grid.js';
import { validateWalletLabel, MAX_WALLET_LABEL_LENGTH } from '../wallet-label.js';

const HTML_ESCAPES = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export default {
  name: 'LoadQRLLIB',
  data() {
    return {
      password: '',
      passwordConfirm: '',
      error: 'A password is required',
      validated: false,
      isSecure: true,
      hexseedMnemonic: '',
      errorM: '',
      qrllibLoaded: false,
      showGenerateButton: true,
      showGeneratingSpinner: false,
      showGenerated: false,
      showRegenArea: true,
      // Must match the store default (src/store.js) — the select only writes
      // to the store on change, so a mismatch would silently generate under a
      // different hash function than the one displayed.
      selectedHash: 'SHAKE_256',
      selectedHeight: 10,
      qrllibVersion: __QRLLIB_VERSION__,
      minPasswordLength: MINIMUM_PASSWORD_LENGTH,
      elapsedSeconds: 0,
      elapsedTimer: null,
      logoSvg: `data:image/svg+xml;base64,${btoa(logoSvgRaw)}`,
      // V-03: Password strength tracking
      passwordStrength: { score: 0, feedback: 'Password is required' },
      // Encryption progress tracking
      encryptionProgress: 0,
      isEncrypting: false,
      // Non-reactive in spirit; held so beforeUnmount can terminate it.
      activeWorker: null,
      // Height of the wallet on screen, read from its hexseed (not the
      // selector) once generation completes.
      walletHeight: null,
      includeOtsTracker: true,
      walletLabel: '',
      maxWalletLabelLength: MAX_WALLET_LABEL_LENGTH,
    };
  },
  computed: {
    // null when the wallet's tree is too tall for a paper grid.
    otsTrackerLayout() {
      return otsGridLayout(this.walletHeight);
    },
    walletLabelCheck() {
      return validateWalletLabel(this.walletLabel);
    },
    estimatedTimeMessage() {
      const height = this.$store.state.height;
      const estimates = {
        8: 'Estimated time: ~1 second',
        10: 'Estimated time: ~2-3 seconds',
        12: 'Estimated time: ~10-15 seconds',
        14: 'Estimated time: ~1-2 minutes',
        16: 'Estimated time: ~5-10 minutes',
        18: 'Estimated time: ~20-30 minutes',
      };
      return estimates[height] || 'Estimated time: calculating...';
    },
    formattedElapsedTime() {
      const mins = Math.floor(this.elapsedSeconds / 60);
      const secs = this.elapsedSeconds % 60;
      if (mins > 0) {
        return `${mins}m ${secs.toString().padStart(2, '0')}s`;
      }
      return `${secs}s`;
    },
    // Password strength text color - darker for readability
    strengthTextClass() {
      const { score } = this.passwordStrength;
      if (score === 0) return 'text-base-content/70';
      if (score === 1) return 'text-error';
      if (score === 2) return 'text-amber-600';
      return 'text-green-600';
    },
  },
  methods: {
    // Password strength bar color based on position and score
    // Score 0: all grey, Score 1: red (1/3), Score 2: amber (2/3), Score 3: green (3/3)
    strengthBarClass(position) {
      const { score } = this.passwordStrength;
      if (score === 0) return 'bg-base-300';
      if (score === 1) {
        return position <= 1 ? 'bg-error' : 'bg-base-300';
      }
      if (score === 2) {
        return position <= 2 ? 'bg-amber-500' : 'bg-base-300';
      }
      // score === 3
      return 'bg-success';
    },

    async saveJSON() {
      const thisAddress = document.getElementById('address').textContent;
      const thisPk = document.getElementById('pk').textContent;
      const thisHashFunction = QRLLIB.getHashFunction(thisAddress).value;
      const thisSignatureType = QRLLIB.getSignatureType(thisAddress).value;
      const thisHexSeed = document.getElementById('hexseed').textContent;
      // From the seed, not the height selector: the selector can change after
      // generation, and a regenerated wallet takes its height from the seed.
      const thisHeight = treeHeightFromHexseed(thisHexSeed);
      const thisMnemonic = document.getElementById('mnemonic').textContent;

      // V3 wallet data structure
      const walletData = {
        address: thisAddress,
        pk: thisPk,
        hexseed: thisHexSeed,
        mnemonic: thisMnemonic,
        height: thisHeight,
        hashFunction: thisHashFunction,
        signatureType: thisSignatureType,
        index: 0,
      };

      let walletEnvelope;
      if (this.isSecure) {
        // V3 encrypted format with scrypt + AES-256-GCM
        this.isEncrypting = true;
        this.encryptionProgress = 0;
        this.errorM = '';
        try {
          walletEnvelope = await buildEncryptedEnvelope(
            walletData,
            this.password,
            // Must not return a value: scrypt-js treats a truthy return from
            // the progress callback as a cancellation request and aborts the
            // derivation. Keep the braces.
            (progress) => { this.encryptionProgress = Math.round(progress * 100); },
          );
        } catch (error) {
          // Without this the rejection is unhandled, no file is written, and
          // the user is left looking at "A password is required".
          this.errorM = `Could not encrypt the wallet: ${error.message || error}. `
            + 'The wallet has NOT been saved. Your details are still shown above.';
          return;
        } finally {
          this.isEncrypting = false;
          this.encryptionProgress = 0;
        }

        // Only clear the password once the envelope exists. Clearing on
        // failure would force the user to retype with no idea why.
        // Note: this drops the reference and clears the input; JavaScript
        // strings are immutable, so it does not scrub the value from memory.
        this.password = '';
        this.passwordConfirm = '';
        this.validated = false;
        this.error = 'A password is required';
        this.passwordStrength = { score: 0, feedback: 'Password is required' };
      } else {
        // V3 unencrypted format
        walletEnvelope = buildUnencryptedEnvelope(walletData);
      }

      const walletJson = JSON.stringify(walletEnvelope, null, 2);
      const binBlob = new Blob([walletJson], { type: 'application/json' });
      const a = window.document.createElement('a');
      const blobUrl = window.URL.createObjectURL(binBlob);
      a.href = blobUrl;
      a.download = 'wallet.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Deferred: revoking synchronously after click() can race the download
      // in some browsers, which would produce no file and no error.
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 0);
    },

    // A displayed-but-unsaved wallet exists only in this tab. Closing it is
    // unrecoverable, and at the higher tree heights the user has just waited
    // up to half an hour for it.
    guardUnload(event) {
      if (!this.showGenerated && !this.showGeneratingSpinner) return undefined;
      event.preventDefault();
      // Browsers show their own wording; the returned string is legacy.
      event.returnValue = '';
      return '';
    },

    check() {
      const { validated, error, strength } = validatePassword(this.password, this.passwordConfirm);
      this.passwordStrength = strength;
      this.validated = validated;
      this.error = error;
    },

    height() {
      return this.$store.state.height;
    },

    hash() {
      return this.$store.state.hash;
    },

    thisHeight(height) {
      this.$store.state.height = height;
    },

    thisHash(hash) {
      this.$store.state.hash = hash;
    },

    printWallet() {
      // These are QRLLIB outputs — hex and wordlist words — not user input, so
      // they cannot carry markup today. Escaped anyway: this template is one
      // refactor away from echoing user input onto a page that holds the
      // hexseed, and the escaping costs nothing.
      const address = escapeHtml(document.getElementById('address').textContent);
      const mnemonic = escapeHtml(document.getElementById('mnemonic').textContent);
      const hexseed = escapeHtml(document.getElementById('hexseed').textContent);

      // Create print-friendly HTML
      const printContent = `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <div style="background: #f0f0f0; padding: 15px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #ddd;">
            <p style="font-weight: bold; margin: 0 0 8px 0; font-size: 14px;">Address</p>
            <p style="font-family: monospace; font-size: 10px; word-break: break-all; margin: 0; line-height: 1.4;">${address}</p>
          </div>
          <div style="background: #e8f5e9; border: 1px solid #4caf50; padding: 10px; margin-bottom: 15px; border-radius: 6px;">
            <p style="margin: 0; color: #2e7d32; font-size: 12px;">It's okay to share your address with others.</p>
          </div>

          <div style="background: #f0f0f0; padding: 15px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #ddd;">
            <p style="font-weight: bold; margin: 0 0 8px 0; font-size: 14px;">Mnemonic</p>
            <p style="font-family: monospace; font-size: 10px; word-break: break-word; margin: 0; line-height: 1.4;">${mnemonic}</p>
          </div>
          <div style="background: #ffebee; border: 1px solid #f44336; padding: 10px; margin-bottom: 15px; border-radius: 6px;">
            <p style="margin: 0; color: #c62828; font-size: 12px;">Do not share your mnemonic phrase with anyone!</p>
          </div>

          <div style="background: #f0f0f0; padding: 15px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #ddd;">
            <p style="font-weight: bold; margin: 0 0 8px 0; font-size: 14px;">Hexseed</p>
            <p style="font-family: monospace; font-size: 10px; word-break: break-all; margin: 0; line-height: 1.4;">${hexseed}</p>
          </div>
          <div style="background: #ffebee; border: 1px solid #f44336; padding: 10px; margin-bottom: 15px; border-radius: 6px;">
            <p style="margin: 0; color: #c62828; font-size: 12px;">Do not share your hexseed with anyone!</p>
          </div>

          <div style="background: #fff8e1; border: 1px solid #ff9800; padding: 10px; border-radius: 6px;">
            <p style="margin: 0; color: #e65100; font-size: 12px;">Remember to move saved files to a secure location.</p>
          </div>
        </div>
      `;

      print({
        printable: printContent,
        type: 'raw-html',
        header: 'The Quantum Resistant Ledger',
        headerStyle: 'font-weight: 500; font-size: 24px; text-align: center; margin-bottom: 20px;',
      });
    },

    pdfSave() {
      // Re-validated here rather than trusting the disabled button: this is
      // the last point before the text is written into the document.
      const labelCheck = validateWalletLabel(this.walletLabel);
      if (!labelCheck.valid) {
        this.errorM = labelCheck.error;
        return;
      }
      const label = labelCheck.value;

      // Get wallet data
      const address = document.getElementById('address').textContent;
      const mnemonic = document.getElementById('mnemonic').textContent;
      const hexseed = document.getElementById('hexseed').textContent;

      // Create PDF using jsPDF directly
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let y = 25;

      // Title
      doc.setFontSize(24);
      doc.setTextColor(11, 24, 30);
      doc.text('QRL Wallet', pageWidth / 2, y, { align: 'center' });
      y += 20;

      if (label) {
        doc.setFont('helvetica', 'bold');
        // Shrink to fit: 48 wide glyphs ("WWW...") overflow the page at 13pt.
        let labelSize = 13;
        doc.setFontSize(labelSize);
        while (labelSize > 6 && doc.getTextWidth(label) > contentWidth) {
          labelSize -= 0.5;
          doc.setFontSize(labelSize);
        }
        doc.setTextColor(30, 30, 30);
        doc.text(label, pageWidth / 2, y - 8, { align: 'center' });
        y += 4;
      }

      // Helper function to add a section
      const addSection = (label, content, warning, isShareable) => {
        const fontSize = 11;
        doc.setFontSize(fontSize);
        doc.setFont('courier', 'normal');
        const textLines = doc.splitTextToSize(content, contentWidth - 14);
        const lineHeight = 5;
        const boxHeight = 18 + textLines.length * lineHeight;

        // Section background
        doc.setFillColor(245, 245, 245);
        doc.setDrawColor(180, 180, 180);
        doc.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, 'FD');

        // Label
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(label, margin + 7, y + 10);

        // Content
        doc.setFontSize(fontSize);
        doc.setFont('courier', 'normal');
        doc.setTextColor(30, 30, 30);
        doc.text(textLines, margin + 7, y + 18);
        y += boxHeight + 4;

        // Warning box
        if (isShareable) {
          doc.setFillColor(220, 252, 231);
          doc.setDrawColor(22, 163, 74);
        } else {
          doc.setFillColor(254, 226, 226);
          doc.setDrawColor(220, 38, 38);
        }
        doc.roundedRect(margin, y, contentWidth, 10, 3, 3, 'FD');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(isShareable ? 22 : 153, isShareable ? 101 : 27, isShareable ? 52 : 27);
        doc.text(warning, margin + 7, y + 7);
        y += 18;
      };

      // Add sections
      addSection('Address', address, "It's okay to share your address with others.", true);
      addSection('Mnemonic', mnemonic, 'Do not share your mnemonic phrase with anyone!', false);
      addSection('Hexseed', hexseed, 'Do not share your hexseed with anyone!', false);

      // Final warning
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(217, 119, 6);
      doc.roundedRect(margin, y, contentWidth, 10, 3, 3, 'FD');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(146, 64, 14);
      doc.text('Remember to move saved files to a secure location.', margin + 7, y + 7);

      // OTS key tracker grid on pages 2 onwards, if chosen (and only offered
      // for tree heights where a paper grid is practical).
      if (this.includeOtsTracker && this.otsTrackerLayout) {
        addOtsGridPages(doc, { height: treeHeightFromHexseed(hexseed), address, label });
      }

      // Save
      doc.save('qrl-wallet.pdf');
    },

    async generateWallet(regen) {
      let randomSeed = [];
      if (!regen) {
        try {
          randomSeed = Array.from(getSecureRandomSeed());
        } catch (error) {
          this.errorM = error.message || SECURE_RANDOM_ERROR;
          return;
        }
      }

      this.showGenerateButton = false;
      this.showGeneratingSpinner = true;
      this.showRegenArea = false;
      this.errorM = '';

      // Start elapsed time counter
      this.elapsedSeconds = 0;
      this.elapsedTimer = setInterval(() => {
        this.elapsedSeconds += 1;
      }, 1000);

      const { hexseedMnemonic } = this;
      const hashFunction = this.$store.state.hash;
      const xmssHeight = this.$store.state.height;
      // Held on the instance so beforeUnmount can terminate it. terminate() is
      // the one cleanup here that reliably destroys the seed and the XMSS
      // object, so an orphaned worker keeps that material alive for the tab.
      const worker = new WalletWorker();
      this.activeWorker = worker;

      worker.onmessage = (e) => {
        worker.terminate();
        this.activeWorker = null;
        clearInterval(this.elapsedTimer);
        this.showGeneratingSpinner = false;

        if (e.data.error) {
          this.errorM = e.data.error;
          this.showGenerateButton = true;
          this.showRegenArea = true;
          return;
        }

        // The component may have been torn down and remounted while this ran.
        if (!document.getElementById('address')) return;

        document.getElementById('address').textContent = e.data.address;
        document.getElementById('pk').textContent = e.data.pk;
        document.getElementById('hexseed').textContent = e.data.hexseed;
        document.getElementById('mnemonic').textContent = e.data.mnemonic;
        this.walletHeight = treeHeightFromHexseed(e.data.hexseed);

        this.showGenerated = true;
        this.showRegenArea = false;
      };

      worker.onerror = (err) => {
        worker.terminate();
        this.activeWorker = null;
        clearInterval(this.elapsedTimer);
        this.showGeneratingSpinner = false;
        this.showGenerateButton = true;
        this.showRegenArea = true;
        this.errorM = `Wallet generation failed: ${err.message}`;
      };

      worker.postMessage({
        randomSeed,
        xmssHeight,
        hashFunction,
        regen,
        hexseedMnemonic,
      });
    },
  },
  mounted() {
    // Startup already gates mounting on the library being ready (src/main.js),
    // so reaching here means it loaded. Probe anyway rather than assume — this
    // flag is what reveals the whole interface.
    this.qrllibLoaded = typeof QRLLIB !== 'undefined' && typeof QRLLIB.str2bin === 'function';
    window.addEventListener('beforeunload', this.guardUnload);
  },
  beforeUnmount() {
    window.removeEventListener('beforeunload', this.guardUnload);
    // Navigating away mid-generation would otherwise leave the interval firing
    // against a destroyed instance and a worker holding seed material alive
    // with no owner for the lifetime of the tab.
    clearInterval(this.elapsedTimer);
    if (this.activeWorker) {
      this.activeWorker.terminate();
      this.activeWorker = null;
    }
  },
};
</script>

<style scoped>
#address,
#mnemonic,
#pk,
#hexseed {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
