import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { decryptEnvelope } from '../src/wallet-envelope.js';

// The static gate (scripts/check-offline-artifact.sh) bounds what the artefact
// *contains*. These tests bound what it *does*: loaded from file:// with every
// outbound request denied, it must still generate a wallet and must never
// attempt to contact anything. That is the claim the whole tool rests on, and
// it is not provable by grepping.

const ARTEFACT = resolve('dist-offline/index.html');
const ARTEFACT_URL = pathToFileURL(ARTEFACT).href;

test.beforeAll(() => {
  if (!existsSync(ARTEFACT)) {
    throw new Error('dist-offline/index.html missing. Run `npm run build:offline` first.');
  }
});

/** Records every request the page attempts and aborts anything non-local. */
async function denyNetwork(page) {
  const attempted = [];
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('file://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return route.continue();
    }
    attempted.push(url);
    return route.abort();
  });
  return attempted;
}

test('loads from file:// with no server and mounts', async ({ page }) => {
  await denyNetwork(page);
  await page.goto(ARTEFACT_URL);

  await expect(page.locator('h1.card-title')).toHaveText('QRL Offline Wallet Generator');
  const appText = await page.locator('#app').innerText();
  expect(appText.length).toBeGreaterThan(100);
});

test('reports the QRL library as loaded only after probing it', async ({ page }) => {
  await denyNetwork(page);
  await page.goto(ARTEFACT_URL);

  // The footer indicator used to be set unconditionally, so it asserted
  // success even when nothing had been checked. It now probes a real entry
  // point, and the docs tell users to rely on it.
  await expect(page.getByText('QRL Library loaded')).toBeVisible();
  await expect(page.getByText('Failed to load QRL Library')).toHaveCount(0);
});

test('generates a wallet and attempts zero network requests', async ({ page }) => {
  const attempted = await denyNetwork(page);
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto(ARTEFACT_URL);
  await page.getByRole('button', { name: 'Generate', exact: true }).click();

  await expect(page.locator('#mnemonic')).not.toBeEmpty({ timeout: 90_000 });

  const address = await page.locator('#address').innerText();
  const mnemonic = await page.locator('#mnemonic').innerText();
  const hexseed = await page.locator('#hexseed').innerText();

  expect(address).toMatch(/^Q[0-9a-f]+$/);
  expect(mnemonic.trim().split(/\s+/)).toHaveLength(34);
  expect(hexseed).toMatch(/^[0-9a-f]{102}$/);

  // The address descriptor encodes the hash function and tree height. Byte 0
  // is 0x02 for SHAKE_256, the default; the low nibble of byte 1 is height/2.
  // Asserting it here catches the failure mode where the dropdown and the
  // store disagree and a wallet is generated under a different function than
  // the interface showed.
  expect(address.slice(1, 5)).toBe('0205');
  await expect(page.getByTestId('hash-function')).toHaveValue('SHAKE_256');

  // The point of the whole exercise.
  expect(attempted, `artefact attempted network requests: ${attempted.join(', ')}`).toEqual([]);

  const resources = await page.evaluate(() => performance.getEntriesByType('resource')
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('data:') && !name.startsWith('blob:')));
  expect(resources).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('refuses a weak password and enables saving only for a strong one', async ({ page }) => {
  await denyNetwork(page);
  await page.goto(ARTEFACT_URL);
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.locator('#mnemonic')).not.toBeEmpty({ timeout: 90_000 });

  const password = page.getByPlaceholder('Enter password');
  const confirm = page.getByPlaceholder('Confirm password');
  const save = page.getByRole('button', { name: /Save encrypted/ });

  // This is the finding: the estimator flagged it, the UI showed red, and the
  // button was enabled anyway.
  await password.fill('password');
  await confirm.fill('password');
  // Appears twice: once under the strength meter, once as the validation
  // error. The second only renders because the password is now refused.
  await expect(page.getByText('This is a commonly used password').first()).toBeVisible();
  await expect(page.getByText('This is a commonly used password')).toHaveCount(2);
  await expect(save).toBeDisabled();

  await password.fill('Xk7#mQp2Lv9w');
  await confirm.fill('Xk7#mQp2Lv9w');
  await expect(save).toBeEnabled();
});

test('secret-bearing inputs are not stored, transmitted or mangled by the browser', async ({ page }) => {
  await denyNetwork(page);
  await page.goto(ARTEFACT_URL);

  // The seed field is the sensitive one. spellcheck matters most: Chromium's
  // enhanced spellcheck sends field contents to a remote service, which on the
  // hosted deployment would exfiltrate a mnemonic through a browser feature
  // rather than an application bug.
  const seed = page.getByPlaceholder('Enter your hexseed or mnemonic phrase...');
  await expect(seed).toHaveAttribute('spellcheck', 'false');
  await expect(seed).toHaveAttribute('autocomplete', 'off');
  await expect(seed).toHaveAttribute('autocorrect', 'off');
  await expect(seed).toHaveAttribute('autocapitalize', 'off');
  // Password managers must not offer to persist seed material to disk.
  await expect(seed).toHaveAttribute('data-lpignore', 'true');

  // It is deliberately readable — a 34-word phrase has to be checkable, and a
  // mistyped seed derives a different valid wallet rather than erroring.
  await expect(seed).not.toHaveAttribute('type', 'password');

  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.locator('#mnemonic')).not.toBeEmpty({ timeout: 90_000 });

  for (const placeholder of ['Enter password', 'Confirm password']) {
    const field = page.getByPlaceholder(placeholder);
    await expect(field).toHaveAttribute('type', 'password');
    await expect(field).toHaveAttribute('spellcheck', 'false');
    // Stops a manager autofilling an unrelated stored credential over it.
    await expect(field).toHaveAttribute('autocomplete', 'new-password');
  }

  // Nothing may persist secrets outside the tab. Reading storage from a
  // file:// origin can throw SecurityError depending on browser flags, so a
  // throw is recorded as a result rather than failing the test for the wrong
  // reason — an inaccessible store is still an empty one.
  const stored = await page.evaluate(() => {
    const read = (fn) => { try { return fn(); } catch (e) { return `unavailable (${e.name})`; } };
    return {
      local: read(() => window.localStorage.length),
      session: read(() => window.sessionStorage.length),
      cookie: read(() => document.cookie),
    };
  });
  for (const [store, value] of Object.entries(stored)) {
    const empty = value === 0 || value === '' || String(value).startsWith('unavailable');
    expect(empty, `${store} was not empty: ${value}`).toBe(true);
  }
});

test('closing the tab with an unsaved wallet is guarded', async ({ page }) => {
  await denyNetwork(page);
  await page.goto(ARTEFACT_URL);

  // No wallet yet, so leaving is harmless.
  let guarded = await page.evaluate(
    () => !window.dispatchEvent(new Event('beforeunload', { cancelable: true })),
  );
  expect(guarded).toBe(false);

  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.locator('#mnemonic')).not.toBeEmpty({ timeout: 90_000 });

  // Now the wallet exists only in this tab; at height 18 the user has waited
  // up to half an hour for it.
  guarded = await page.evaluate(
    () => !window.dispatchEvent(new Event('beforeunload', { cancelable: true })),
  );
  expect(guarded).toBe(true);
});

test('a wallet saved through the real UI decrypts back to what was shown', async ({ page }) => {
  // Closes the loop the unit tests can only close in isolation: the file the
  // browser actually downloads, produced by the real component with the real
  // WebCrypto, must decrypt with the password the user typed and match the
  // secrets displayed on screen. A wallet that cannot be reopened is
  // indistinguishable from a successful save until the funds are needed.
  await denyNetwork(page);
  await page.goto(ARTEFACT_URL);
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.locator('#mnemonic')).not.toBeEmpty({ timeout: 90_000 });

  const shown = {
    address: await page.locator('#address').innerText(),
    hexseed: await page.locator('#hexseed').innerText(),
    mnemonic: await page.locator('#mnemonic').innerText(),
  };

  const PASSWORD = 'Xk7#mQp2Lv9w';
  await page.getByPlaceholder('Enter password').fill(PASSWORD);
  await page.getByPlaceholder('Confirm password').fill(PASSWORD);

  const downloadPromise = page.waitForEvent('download', { timeout: 90_000 });
  await page.getByRole('button', { name: /Save encrypted/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('wallet.json');

  const envelope = JSON.parse(readFileSync(await download.path(), 'utf8'));
  expect(envelope.version).toBe(3);
  expect(envelope.encrypted).toBe(true);

  const recovered = await decryptEnvelope(envelope, PASSWORD);
  expect(recovered.address).toBe(shown.address);
  expect(recovered.hexseed).toBe(shown.hexseed);
  expect(recovered.mnemonic).toBe(shown.mnemonic);

  // And the password is cleared only because the save succeeded.
  await expect(page.getByPlaceholder('Enter password')).toHaveValue('');
});

test('the PDF carries OTS tracker pages only when the toggle is on', async ({ page }) => {
  await denyNetwork(page);
  await page.goto(ARTEFACT_URL);
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.locator('#mnemonic')).not.toBeEmpty({ timeout: 90_000 });

  // Default tree height 10: 1,024 keys over two tracker pages.
  const toggle = page.getByTestId('ots-tracker');
  await expect(toggle).toBeVisible();
  await expect(toggle).toBeChecked();
  await expect(page.getByText('Include OTS tracker (+2 pages)')).toBeVisible();

  const pdfPageCount = async () => {
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#pdfSave').click();
    const download = await downloadPromise;
    const pdf = readFileSync(await download.path(), 'latin1');
    return (pdf.match(/\/Type \/Page\b(?!s)/g) || []).length;
  };

  expect(await pdfPageCount()).toBe(3);
  await toggle.uncheck();
  expect(await pdfPageCount()).toBe(1);
});

test('a PDF label is validated in the UI and printed on every page', async ({ page }) => {
  await denyNetwork(page);
  await page.goto(ARTEFACT_URL);
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.locator('#mnemonic')).not.toBeEmpty({ timeout: 90_000 });

  const label = page.getByTestId('wallet-label');
  const save = page.locator('#pdfSave');

  // Rejected, not stripped: the save is blocked until the text is fixed.
  await label.fill('x) Tj <b>');
  await expect(save).toBeDisabled();
  await expect(page.getByText('Label contains characters that are not allowed')).toBeVisible();

  await label.fill('  Cold   storage #1  ');
  await expect(save).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await save.click();
  const pdf = readFileSync(await (await downloadPromise).path(), 'latin1');
  // Page 1 plus two tracker pages at the default height of 10.
  expect(pdf.match(/\(Cold storage #1\) Tj/g) || []).toHaveLength(3);
});

test('an encryption failure is reported instead of failing silently', async ({ page }) => {
  await denyNetwork(page);
  await page.goto(ARTEFACT_URL);
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.locator('#mnemonic')).not.toBeEmpty({ timeout: 90_000 });

  // Stand in for the realistic trigger — a failed 128 MiB allocation on a
  // low-memory machine, which is exactly the hardware the docs recommend.
  await page.evaluate(() => {
    window.crypto.subtle.importKey = () => Promise.reject(new Error('simulated failure'));
  });

  await page.getByPlaceholder('Enter password').fill('Xk7#mQp2Lv9w');
  await page.getByPlaceholder('Confirm password').fill('Xk7#mQp2Lv9w');
  await page.getByRole('button', { name: /Save encrypted/ }).click();

  // Previously: no file, no error, and the text "A password is required".
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Could not encrypt the wallet', { timeout: 60_000 });
  await expect(alert).toContainText('has NOT been saved');

  // The password must survive a failure so the user can retry.
  await expect(page.getByPlaceholder('Enter password')).toHaveValue('Xk7#mQp2Lv9w');
});

test('a library load failure renders a visible message, not a blank page', async ({ page }) => {
  await denyNetwork(page);

  // Stands in for a truncated download or a browser without WebAssembly.
  // Claiming the property non-writable before the inline bootstrap runs means
  // its `window.qrllibReady = ...` assignment silently fails (the bootstrap is
  // a classic script, so sloppy mode), and startup awaits this rejection
  // instead. That reproduces the real symptom — the readiness promise never
  // resolving — without needing to corrupt the artefact on disk.
  await page.addInitScript(() => {
    const failed = Promise.reject(new Error('The QRL cryptography library did not finish loading.'));
    failed.catch(() => {});
    Object.defineProperty(window, 'qrllibReady', {
      configurable: false, writable: false, value: failed,
    });
  });
  await page.goto(ARTEFACT_URL);

  // Before this fix the page stayed blank forever with no message at all.
  await expect(page.locator('#app')).toContainText('could not start', { timeout: 60_000 });
  await expect(page.locator('#app')).toContainText('verify its checksum');
  await expect(page.locator('h1.card-title')).toHaveCount(0);
});
