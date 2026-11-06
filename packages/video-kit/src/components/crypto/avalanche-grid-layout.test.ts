import {describe, expect, it} from 'vitest';
import {gridLayout} from './avalanche-grid-layout';

describe('gridLayout', () => {
  it('places 256 cells in a 16 by 16 grid', () => {
    const layout = gridLayout(320, 16, 256);
    expect(layout.rows).toBe(16);
    expect(layout.positions).toHaveLength(256);
  });

  it('keeps every cell inside the box', () => {
    for (const layout of [gridLayout(320, 16, 256), gridLayout(300, 4, 7)]) {
      for (const {x, y} of layout.positions) {
        expect(Math.abs(x) + layout.cell / 2).toBeLessThanOrEqual(layout.size / 2 + 1e-9);
        expect(Math.abs(y) + layout.cell / 2).toBeLessThanOrEqual(layout.size / 2 + 1e-9);
      }
    }
  });

  it('never overlaps two cells', () => {
    const layout = gridLayout(320, 16, 256);
    for (let i = 0; i < layout.positions.length; i++) {
      for (let j = i + 1; j < layout.positions.length; j++) {
        const dx = Math.abs(layout.positions[i].x - layout.positions[j].x);
        const dy = Math.abs(layout.positions[i].y - layout.positions[j].y);
        expect(dx >= layout.step - 1e-9 || dy >= layout.step - 1e-9).toBe(true);
      }
    }
  });

  it('starts a partial last row at the left', () => {
    const layout = gridLayout(300, 4, 7);
    expect(layout.rows).toBe(2);
    expect(layout.positions[6]).toEqual({
      x: layout.positions[2].x,
      y: layout.positions[2].y + layout.step,
    });
  });

  it('rejects impossible geometry', () => {
    expect(() => gridLayout(0, 16, 256)).toThrow(/size/);
    expect(() => gridLayout(320, 0, 256)).toThrow(/columns/);
    expect(() => gridLayout(320, 16, 0)).toThrow(/count/);
    expect(() => gridLayout(10, 16, 256)).toThrow(/cell size/);
  });
});
