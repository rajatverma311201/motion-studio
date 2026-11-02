import {describe, expect, it} from 'vitest';
import {tableLayout, wrapGrid, type CompareColumn, type CompareRow} from './table-layout';

const columns: CompareColumn[] = [
  {title: 'ENCODING', color: '#fff'},
  {title: 'SIGNING', color: '#fff'},
  {title: 'ENCRYPTION', color: '#fff'},
];

const rows: CompareRow[] = [
  {label: 'Goal', cells: ['carry data', 'prove it is unchanged and who made it', 'hide the content']},
  {label: 'Needs a key?', cells: ['no', 'yes', 'yes']},
  {label: 'Others can read it?', cells: ['yes', 'yes', 'no']},
  {label: 'Others can change it unnoticed?', cells: ['yes', 'no', 'depends']},
  {label: 'Used in a JWT as', cells: ['header and payload text', 'the signature', 'only in the rare JWE']},
];

describe('wrapGrid', () => {
  it('wraps on word boundaries', () => {
    expect(wrapGrid('carry data safely', 10)).toEqual(['carry data', 'safely']);
  });

  it('splits a word that is longer than the column', () => {
    expect(wrapGrid('abcdefghij', 4)).toEqual(['abcd', 'efgh', 'ij']);
  });

  it('never returns a line wider than the limit', () => {
    for (const row of rows) {
      for (const cell of row.cells) {
        for (const line of wrapGrid(cell, 18)) {
          expect(line.length).toBeLessThanOrEqual(18);
        }
      }
    }
  });
});

describe('tableLayout', () => {
  const layout = tableLayout({w: 1400, columns, rows});

  it('splits the width between the label column and the cells', () => {
    expect(layout.labelWidth + layout.cellWidth * columns.length).toBeCloseTo(1400, 6);
  });

  it('places every column centre inside its own column', () => {
    for (let i = 0; i < columns.length; i++) {
      const left = -700 + layout.labelWidth + layout.cellWidth * i;
      const right = left + layout.cellWidth;
      expect(layout.columnX[i]).toBeGreaterThan(left);
      expect(layout.columnX[i]).toBeLessThan(right);
    }
  });

  it('stacks the header and rows without overlapping', () => {
    expect(layout.headerY).toBeLessThan(layout.rowY[0]);
    for (let i = 1; i < layout.rowY.length; i++) {
      expect(layout.rowY[i] - layout.rowY[i - 1]).toBeCloseTo(layout.rowHeight, 6);
    }
    const top = -layout.height / 2;
    const bottom = layout.height / 2;
    expect(layout.headerY - layout.headerHeight / 2).toBeCloseTo(top, 6);
    expect(layout.rowY[layout.rowY.length - 1] + layout.rowHeight / 2).toBeCloseTo(bottom, 6);
  });

  it('fits the widest cell text into its fixed grid', () => {
    for (const row of rows) {
      for (const cell of row.cells) {
        const lines = wrapGrid(cell, layout.charsPerCell);
        expect(lines.length).toBeGreaterThan(0);
        for (const line of lines) expect(line.length).toBeLessThanOrEqual(layout.charsPerCell);
      }
    }
  });
});
