import {describe, expect, it} from 'vitest';
import {
  SHORT_CAPTION,
  SHORT_PROGRESS,
  SHORT_SIZE,
  SHORT_ZONES,
  boxInside,
  boxIntersects,
  progressSegments,
  shortSafeBox,
  type Box,
} from './short-layout';

const canvas: Box = {
  x0: -SHORT_SIZE.w / 2,
  x1: SHORT_SIZE.w / 2,
  y0: -SHORT_SIZE.h / 2,
  y1: SHORT_SIZE.h / 2,
};

describe('SHORT_SIZE', () => {
  it('is a 9:16 portrait canvas', () => {
    expect(SHORT_SIZE).toEqual({w: 1080, h: 1920});
    expect(SHORT_SIZE.w / SHORT_SIZE.h).toBeCloseTo(9 / 16);
  });
});

describe('SHORT_ZONES', () => {
  it('keeps every declared zone inside the canvas', () => {
    for (const zone of Object.values(SHORT_ZONES)) {
      expect(boxInside(zone, canvas), JSON.stringify(zone)).toBe(true);
    }
  });

  it('keeps the caption above the reserved Shorts UI', () => {
    expect(boxIntersects(SHORT_ZONES.caption, SHORT_ZONES.reservedBottom)).toBe(false);
    expect(boxIntersects(SHORT_ZONES.main, SHORT_ZONES.reservedBottom)).toBe(false);
  });

  it('leaves the right-hand action rail free below y = 0', () => {
    expect(SHORT_ZONES.reservedCorner.x0).toBe(360);
    expect(SHORT_ZONES.reservedCorner.y0).toBe(0);
    expect(SHORT_ZONES.main.y1).toBeLessThan(SHORT_ZONES.reservedBottom.y0);
  });

  it('puts the caption centre in the caption zone', () => {
    const centre = {x: SHORT_CAPTION.x, y: SHORT_CAPTION.y} as const;
    expect(centre.x).toBe(0);
    expect(centre.y).toBeGreaterThanOrEqual(SHORT_ZONES.caption.y0);
    expect(centre.y).toBeLessThanOrEqual(SHORT_ZONES.caption.y1);
    expect(SHORT_CAPTION.width).toBe(920);
    expect(SHORT_CAPTION.fontSize).toBe(52);
    expect(SHORT_CAPTION.maxLines).toBe(2);
  });
});

describe('shortSafeBox', () => {
  it('contains the top bar, main zone and caption zone', () => {
    expect(boxInside(SHORT_ZONES.topBar, shortSafeBox)).toBe(true);
    expect(boxInside(SHORT_ZONES.main, shortSafeBox)).toBe(true);
    expect(boxInside(SHORT_ZONES.caption, shortSafeBox)).toBe(true);
  });
});

describe('progressSegments', () => {
  for (const count of [6, 12]) {
    it(`keeps ${count} segments inside the bar, active or not`, () => {
      const layout = progressSegments(count, SHORT_PROGRESS.width, SHORT_PROGRESS.gap);
      const left = -SHORT_PROGRESS.width / 2;
      const right = SHORT_PROGRESS.width / 2;

      for (let i = 0; i < count; i++) {
        const centre = layout.startX + i * layout.step;
        expect(centre - layout.width / 2).toBeGreaterThanOrEqual(left - 0.001);
        expect(centre + layout.width / 2).toBeLessThanOrEqual(right + 0.001);
        expect(centre - layout.activeWidth / 2).toBeGreaterThanOrEqual(left - 0.001);
        expect(centre + layout.activeWidth / 2).toBeLessThanOrEqual(right + 0.001);
      }
    });
  }

  it('makes the active segment wider without overlapping a neighbour', () => {
    const layout = progressSegments(6, 920, 10);
    expect(layout.activeWidth).toBeGreaterThan(layout.width);
    expect(layout.activeWidth).toBeLessThanOrEqual(layout.step);
  });

  it('rejects a chapter count that does not fit', () => {
    expect(() => progressSegments(0, 920, 10)).toThrow(/positive chapter count/);
    expect(() => progressSegments(200, 920, 10)).toThrow(/do not fit/);
  });
});
