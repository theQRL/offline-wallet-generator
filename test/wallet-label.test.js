import assert from 'node:assert/strict';
import test from 'node:test';
import { jsPDF } from 'jspdf';
import { addOtsGridPages } from '../src/ots-grid.js';
import {
  MAX_WALLET_LABEL_LENGTH,
  WALLET_LABEL_ALLOWED_PUNCTUATION,
  validateWalletLabel,
} from '../src/wallet-label.js';

test('empty or missing label is valid and prints nothing', () => {
  for (const input of [undefined, null, '', '   ']) {
    assert.deepEqual(validateWalletLabel(input), { valid: true, value: '' });
  }
});

test('ordinary labels pass, trimmed and with space runs collapsed', () => {
  assert.deepEqual(validateWalletLabel('Cold storage 1'), { valid: true, value: 'Cold storage 1' });
  assert.deepEqual(validateWalletLabel('  Savings   #2  '), { valid: true, value: 'Savings #2' });
  assert.equal(validateWalletLabel(`All of ${WALLET_LABEL_ALLOWED_PUNCTUATION}`).valid, true);
  assert.equal(validateWalletLabel("JP's wallet: 2026/11 - A&B + C!? @home; x_y.").valid, true);
});

test('length limit applies after trimming', () => {
  assert.equal(validateWalletLabel('a'.repeat(MAX_WALLET_LABEL_LENGTH)).valid, true);
  assert.equal(validateWalletLabel(` ${'a'.repeat(MAX_WALLET_LABEL_LENGTH)} `).valid, true);
  assert.equal(validateWalletLabel('a'.repeat(MAX_WALLET_LABEL_LENGTH + 1)).valid, false);
});

test('hostile and unrenderable input is rejected, not stripped', () => {
  const hostile = [
    // PDF string syntax: closing the string and injecting operators.
    'x) Tj ET BT (y',
    'back\\slash',
    '%PDF comment',
    // HTML / script.
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    'say "hi"',
    'tick`',
    '{{ constructor }}', // braces: not in the allowlist
    '[]',
    'a=b',
    'a$b', 'a*b', 'a~b', 'a|b', 'a^b',
    // Control characters and line breaks.
    'line\nbreak', 'cr\rlf', 'tab\there', 'nul\u0000byte', 'esc\u001b[31m', 'del\u007f',
    // Bidi overrides / isolates: could visually reorder an address.
    'abc‮dcba', 'x⁦y⁩', 'x‏y',
    // Zero-width and invisible characters.
    'zero​width', 'joiner‍', 'bom﻿', 'soft­hyphen',
    // Homoglyphs and non-ASCII.
    'Сold storage', // Cyrillic С
    'ｆｕｌｌ', // full-width
    'café', 'é', // precomposed and combining accents
    '💰 wallet',
    ' nbsp',
  ];
  for (const input of hostile) {
    const result = validateWalletLabel(input);
    assert.equal(result.valid, false, `accepted ${JSON.stringify(input)}`);
    assert.equal(result.value, undefined);
    assert.match(result.error, /not allowed|must be text/);
  }
});

test('non-string input is rejected', () => {
  for (const input of [42, {}, ['a'], true]) {
    assert.equal(validateWalletLabel(input).valid, false);
  }
});

test('a label is printed on every tracker page', () => {
  const doc = new jsPDF();
  addOtsGridPages(doc, { height: 10, address: 'Q0105', label: 'Cold storage 1' });
  const matches = doc.output().match(/\(Cold storage 1\) Tj/g) || [];
  assert.equal(matches.length, 2);
});
