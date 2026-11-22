// OTS key tracker pages for the PDF wallet (theQRL/offline-wallet-generator#17).
//
// Every XMSS signature consumes one one-time-signature (OTS) key, and signing
// twice with the same index weakens the key. A paper wallet has no state, so
// these pages give the holder a grid of every index to cross out as each one
// is used.

// Above this the grid stops being a practical paper artefact: height 12 is
// 4,096 keys over 8 pages, height 14 would be 32 pages and height 18 512.
export const MAX_OTS_GRID_HEIGHT = 12;

export const OTS_GRID_COLUMNS = 16;
export const OTS_GRID_ROWS_PER_PAGE = 32;

// The tree height is read from the wallet itself rather than from the height
// selector: the selector can be changed after generation, and a wallet
// regenerated from a hexseed or mnemonic takes its height from the seed, not
// the selector. The first three bytes of the hexseed are the QRL address
// descriptor; the low nibble of the second byte is height / 2.
export function treeHeightFromHexseed(hexseed) {
  const clean = String(hexseed).trim();
  if (!/^[0-9a-fA-F]{102}$/.test(clean)) {
    throw new Error('Invalid hexseed');
  }
  return (parseInt(clean.slice(2, 4), 16) & 0x0f) * 2;
}

// Returns null when the tree is too tall for a grid to be useful on paper.
export function otsGridLayout(height) {
  if (!Number.isInteger(height) || height < 1 || height > MAX_OTS_GRID_HEIGHT) {
    return null;
  }
  const keys = 2 ** height;
  const perPage = OTS_GRID_COLUMNS * OTS_GRID_ROWS_PER_PAGE;
  return {
    keys,
    columns: OTS_GRID_COLUMNS,
    rowsPerPage: OTS_GRID_ROWS_PER_PAGE,
    pages: Math.ceil(keys / perPage),
  };
}

// Appends the tracker pages to a jsPDF document. Only the address and the
// optional label are printed on them: they identify which wallet the pages
// belong to if they become separated from page 1, and both are safe to share.
// `label` must already have passed validateWalletLabel (src/wallet-label.js).
export function addOtsGridPages(doc, { height, address, label = '' }) {
  const layout = otsGridLayout(height);
  if (!layout) return 0;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  // A label takes one extra header line; everything below shifts down by it.
  const shift = label ? 6 : 0;
  const gridTop = 46 + shift;
  const gridWidth = pageWidth - 2 * margin;
  const cellWidth = gridWidth / layout.columns;
  const cellHeight = (pageHeight - gridTop - 15) / layout.rowsPerPage;
  const perPage = layout.columns * layout.rowsPerPage;

  for (let page = 0; page < layout.pages; page += 1) {
    doc.addPage();
    const first = page * perPage;
    const last = Math.min(first + perPage, layout.keys) - 1;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(11, 24, 30);
    doc.text('OTS Key Tracker', margin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(
      `Sheet ${page + 1} of ${layout.pages}  |  indexes ${first} to ${last} (of ${layout.keys})`,
      pageWidth - margin,
      20,
      { align: 'right' },
    );

    if (label) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(label, margin, 27);
    }

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    doc.text(address, margin, 27 + shift);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(
      doc.splitTextToSize(
        'Cross out each OTS key index as soon as it has been used to sign a transaction. '
          + 'Never sign with the same index twice. Use the indexes in order and keep this '
          + 'sheet with your wallet.',
        gridWidth,
      ),
      margin,
      34 + shift,
    );

    const rows = Math.ceil((last - first + 1) / layout.columns);

    // Shade alternate bands of four rows so a line is easy to follow by eye.
    doc.setFillColor(236, 240, 243);
    for (let band = 0; band < rows; band += 8) {
      const bandRows = Math.min(4, rows - band);
      doc.rect(margin, gridTop + band * cellHeight, gridWidth, bandRows * cellHeight, 'F');
    }

    doc.setDrawColor(170, 170, 170);
    doc.setLineWidth(0.2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    for (let index = first; index <= last; index += 1) {
      const offset = index - first;
      const x = margin + (offset % layout.columns) * cellWidth;
      const y = gridTop + Math.floor(offset / layout.columns) * cellHeight;
      doc.rect(x, y, cellWidth, cellHeight, 'S');
      doc.text(String(index), x + cellWidth / 2, y + cellHeight / 2, {
        align: 'center',
        baseline: 'middle',
      });
    }
  }

  return layout.pages;
}
