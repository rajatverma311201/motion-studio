import {describe, expect, it} from 'vitest';
import {sequenceLayout} from './sequence-layout';

describe('sequenceLayout', () => {
  it('spreads two lifelines evenly and stacks five rows downwards', () => {
    const layout = sequenceLayout(900, 600, 2, 5);

    expect(layout.lifelineX).toEqual([-225, 225]);
    expect(layout.rowY).toHaveLength(5);
    for (let i = 1; i < layout.rowY.length; i++) {
      expect(layout.rowY[i] - layout.rowY[i - 1]).toBeGreaterThanOrEqual(44);
    }
    expect(layout.rowY[0]).toBeGreaterThan(layout.lifelineTop + 30);
    expect(layout.rowY[layout.rowY.length - 1]).toBeLessThan(layout.lifelineBottom);
  });

  it('keeps every actor box inside the diagram and apart from its neighbour', () => {
    const layout = sequenceLayout(1400, 620, 3, 4);
    const half = layout.actorWidth / 2;

    for (let i = 0; i < layout.lifelineX.length; i++) {
      expect(layout.lifelineX[i] - half).toBeGreaterThanOrEqual(-700);
      expect(layout.lifelineX[i] + half).toBeLessThanOrEqual(700);
      if (i > 0) {
        expect(layout.lifelineX[i] - layout.lifelineX[i - 1]).toBeGreaterThan(layout.actorWidth);
      }
    }

    expect(layout.actorY - layout.actorHeight / 2).toBeGreaterThanOrEqual(-310);
    expect(layout.lifelineBottom).toBeLessThanOrEqual(310);
  });

  it('handles one message without a zero gap', () => {
    const layout = sequenceLayout(600, 400, 2, 1);
    expect(layout.rowY).toHaveLength(1);
    expect(layout.rowY[0]).toBeLessThan(layout.lifelineBottom);
  });

  it('rejects an empty actor list', () => {
    expect(() => sequenceLayout(400, 300, 0, 2)).toThrow(/at least one actor/);
  });
});
