// Regenerates the README screenshots from the real offline artefact.
//
//   npm run build:offline && npm run docs:screenshots
//
// The previous set was deleted in d299a2c and the README kept linking to them,
// so six images 404'd for months. Keeping the capture scripted means the
// screenshots can be refreshed in the same commit as a UI change rather than
// rotting until someone notices.
//
// SEED MATERIAL IS NEVER CAPTURED. A real wallet is generated so the layout is
// honest, then the address, hexseed and mnemonic are overwritten with obvious
// placeholders before any screenshot is taken. A screenshot of a live seed
// would teach exactly the habit this tool exists to discourage, and a real
// address in a README invites people to send funds to it.

import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ARTEFACT = resolve('dist-offline/index.html');
const OUT = resolve('docs/images');

if (!existsSync(ARTEFACT)) {
  console.error('dist-offline/index.html missing. Run `npm run build:offline` first.');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const PLACEHOLDER = {
  address: 'Q020500EXAMPLEADDRESSNOTREAL0000000000000000000000000000000000000000000000000',
  hexseed: '020500'.padEnd(102, '0'),
  mnemonic: Array(34).fill('sample').join(' '),
};

const shot = async (page, name, locator) => {
  const target = locator ? page.locator(locator) : page;
  await target.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  docs/images/${name}.png`);
};

const browser = await chromium.launch();
// deviceScaleFactor 1, not 2: a README screenshot is read at a fraction of its
// natural size, so the retina capture cost ~4x the bytes for no visible gain.
const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1 });
// Nothing should reach the network; fail loudly if the artefact tries.
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (u.startsWith('file://') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  console.error(`  ! artefact attempted a network request: ${u}`);
  return route.abort();
});

console.log('Capturing:');
await page.goto(pathToFileURL(ARTEFACT).href);

const CARD = '.card.bg-base-200';
await shot(page, '01-generate-options', CARD);

await page.getByRole('button', { name: 'Generate', exact: true }).click();
await page.waitForSelector('#generatingSpinner:visible', { timeout: 5000 }).catch(() => {});
await shot(page, '02-generating', CARD);

await page.waitForFunction(
  () => document.getElementById('mnemonic')?.textContent.length > 0,
  null,
  { timeout: 120000 },
);

// Swap the real secrets for placeholders before anything is captured.
await page.evaluate((p) => {
  document.getElementById('address').textContent = p.address;
  document.getElementById('hexseed').textContent = p.hexseed;
  document.getElementById('mnemonic').textContent = p.mnemonic;
}, PLACEHOLDER);

await shot(page, '03-wallet-generated', CARD);

// PDF options: OTS tracker toggle and the optional label (PDF-only).
await page.getByTestId('wallet-label').fill('Cold storage 1');
await shot(page, '07-pdf-options', '[data-testid="print-pdf-actions"]');
await page.getByTestId('wallet-label').fill('');

// Weak password refused — the behaviour the 2026-08 review added.
await page.getByPlaceholder('Enter password').fill('password');
await page.getByPlaceholder('Confirm password').fill('password');
await shot(page, '04-weak-password-refused', CARD);

await page.getByPlaceholder('Enter password').fill('Xk7#mQp2Lv9w');
await page.getByPlaceholder('Confirm password').fill('Xk7#mQp2Lv9w');
await shot(page, '05-save-encrypted', CARD);

await page.getByText('Use encrypted format').click();
await shot(page, '06-save-unencrypted', CARD);

await browser.close();
console.log('\nDone. Seed material was replaced with placeholders before capture.');
