import {Node, Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, all, chain, delay, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import {countTo, pop} from '../../animation';
import {bitDiff} from '../../crypto-demo/bits';
import {borderWidth, colors, fonts, radius} from '../../theme';
import {gridLayout} from './avalanche-grid-layout';

/** Options for {@link avalancheGrid}. */
export interface AvalancheGridOptions {
  x: number;
  y: number;
  /** Width and height of the square grid. */
  size: number;
  /** Bit string for the first input, e.g. the bits of a SHA-256 digest. */
  bitsA: string;
  /** Bit string for the second input; differing cells stay red. */
  bitsB: string;
}

/** Handles returned by {@link avalancheGrid}. */
export interface AvalancheGrid {
  node: Node;
  /** Reset the cells to A and pop them in. */
  showA(): ThreadGenerator;
  /** Flip every differing cell to red, with a short left-to-right stagger. */
  morphToB(): ThreadGenerator;
  /** The `0 / 256` counter under the grid. */
  counter: Txt;
}

/**
 * A 16 by 16 grid of rounded bit cells: filled means 1, outline means 0.
 * Differing bits pulse in the danger colour and a counter shows how many of
 * the 256 bits changed. The component only draws; the caller supplies the bits.
 *
 * @example
 * const grid = avalancheGrid({x: 0, y: 0, size: 320, bitsA: hexToBits(DEMO_SHA256), bitsB: hexToBits(DEMO_SHA256_TAMPERED)});
 * view.add(grid.node);
 * yield* grid.showA();
 * yield* grid.morphToB();
 */
export function avalancheGrid(options: AvalancheGridOptions): AvalancheGrid {
  const {x, y, size, bitsA, bitsB} = options;
  if (bitsA.length !== bitsB.length) {
    throw new Error(`avalancheGrid: bit strings differ in length (${bitsA.length} and ${bitsB.length})`);
  }
  if (bitsA.length === 0) throw new Error('avalancheGrid: bit strings must not be empty');

  const layout = gridLayout(size, 16, bitsA.length);
  const diff = bitDiff(bitsA, bitsB);
  const cells: Rect[] = layout.positions.map((position, index) => {
    const filled = bitsA[index] === '1';
    return (
      <Rect
        x={position.x}
        y={position.y}
        width={layout.cell}
        height={layout.cell}
        radius={radius(3)}
        fill={filled ? colors.orange : colors.clear}
        stroke={filled ? colors.orange : colors.dim}
        lineWidth={borderWidth(1.5)}
      />
    ) as Rect;
  });
  const counter = (
    <Txt
      y={size / 2 + 34}
      text={`0 / ${bitsA.length}`}
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={24}
      letterSpacing={1}
      fill={colors.mute}
    />
  ) as Txt;
  const node = (
    <Node x={x} y={y}>
      {cells}
      {counter}
    </Node>
  ) as Node;

  function* showA(): ThreadGenerator {
    for (let index = 0; index < cells.length; index++) {
      const filled = bitsA[index] === '1';
      cells[index].fill(filled ? colors.orange : colors.clear);
      cells[index].stroke(filled ? colors.orange : colors.dim);
      cells[index].scale(1);
    }
    counter.text(`0 / ${bitsA.length}`);
    yield* all(...cells.map((cell, index) => delay(index * 0.0015, pop(cell, 0.25))));
  }

  function* morphToB(): ThreadGenerator {
    const flips = diff.positions.map((position, order) => {
      const cell = cells[position];
      const filled = bitsB[position] === '1';
      return delay(
        order * 0.003,
        all(
          cell.fill(filled ? colors.red : colors.clear, 0.18),
          cell.stroke(colors.red, 0.18),
          chain(cell.scale(1.5, 0.08, easeOutCubic), cell.scale(1, 0.18, easeInOutCubic)),
        ),
      );
    });
    yield* all(
      ...flips,
      countTo(counter, 0, diff.count, 0.7, value => `${Math.round(value)} / ${bitsA.length}`),
    );
  }

  return {node, showA, morphToB, counter};
}
