import assert from 'node:assert/strict';
import test from 'node:test';
import { jsPDF } from 'jspdf';
import {
  addOtsGridPages,
  MAX_OTS_GRID_HEIGHT,
  otsGridLayout,
  treeHeightFromHexseed,
} from '../src/ots-grid.js';

// Descriptor byte 1 low nibble is height / 2 (e.g. 0x05 -> height 10).
const hexseedFor = (height) => `01${(0x00 | (height / 2)).toString(16).padStart(2, '0')}00${'ab'.repeat(48)}`;

test('tree height is read from the hexseed descriptor', () => {
  for (const height of [4, 8, 10, 12, 14, 16, 18]) {
    assert.equal(treeHeightFromHexseed(hexseedFor(height)), height);
  }
});

test('a malformed hexseed is rejected rather than guessed at', () => {
  assert.throws(() => treeHeightFromHexseed('0105'));
  assert.throws(() => treeHeightFromHexseed(`zz${'00'.repeat(50)}`));
});

test('grid page counts for the supported heights', () => {
  assert.equal(otsGridLayout(8).pages, 1);
  assert.equal(otsGridLayout(10).pages, 2);
  assert.equal(otsGridLayout(12).pages, 8);
});

test('no grid above the paper-practical height', () => {
  assert.equal(otsGridLayout(MAX_OTS_GRID_HEIGHT + 2), null);
  assert.equal(otsGridLayout(18), null);
});

test('tracker pages are appended after the wallet page and cover every index', () => {
  const address = 'Q010500e1f2c3d4b5a69788796a5b4c3d2e1f00112233445566778899aabbccddeeff0011';
  const doc = new jsPDF();
  const added = addOtsGridPages(doc, { height: 10, address });
  assert.equal(added, 2);
  assert.equal(doc.getNumberOfPages(), 3);

  const output = doc.output();
  assert.match(output, /\(0\) Tj/);
  assert.match(output, /\(1023\) Tj/);
  assert.doesNotMatch(output, /\(1024\) Tj/);
});

test('tall trees add no pages', () => {
  const doc = new jsPDF();
  assert.equal(addOtsGridPages(doc, { height: 14, address: 'Q00' }), 0);
  assert.equal(doc.getNumberOfPages(), 1);
});
