import {Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator} from '@motion-canvas/core';
import {scrambleText} from '../../animation';
import {boxStyle, colors, fonts, radius, withAlpha} from '../../theme';

/** Options for {@link textMorphCard}. */
export interface TextMorphCardOptions {
  x: number;
  y: number;
  w: number;
  text: string;
  /** Accent used for the hard shadow. */
  color: string;
  fontSize: number;
}

/** Handles returned by {@link textMorphCard}. */
export interface TextMorphCard {
  node: Rect;
  text: Txt;
  /** Scramble from the current string to `to` over `dur` seconds. */
  morphTo(to: string, dur: number, seed?: number): ThreadGenerator;
  /** Change the string immediately, with a short accent flash. */
  swap(to: string): ThreadGenerator;
}

/**
 * A rounded mono card holding one string, built for encoding, signing and
 * encryption transforms. `morphTo()` uses the deterministic scramble;
 * `swap()` changes the text with a flash.
 *
 * @example
 * const card = textMorphCard({x: 0, y: -300, w: 920, text: 'pay 500 to Bob', color: colors.cyan, fontSize: 64});
 * view.add(card.node);
 * yield* card.morphTo('cGF5IDUwMCB0byBCb2I=', 1.2);
 */
export function textMorphCard(options: TextMorphCardOptions): TextMorphCard {
  const {x, y, w, text, color, fontSize} = options;
  const h = Math.round(fontSize * 2);
  const txt = (
    <Txt text={text} fontFamily={fonts.mono} fontWeight={700} fontSize={fontSize} letterSpacing={1} fill={colors.ink} />
  ) as Txt;
  const node = (
    <Rect x={x} y={y} width={w} height={h} radius={radius(26)} fill={colors.surf} {...boxStyle(color, 10, 4)}>
      {txt}
    </Rect>
  ) as Rect;

  function* swap(to: string): ThreadGenerator {
    txt.text(to);
    const flash = (
      <Rect width={w - 12} height={h - 12} radius={radius(20)} fill={withAlpha(color, 0.35)} opacity={0} />
    ) as Rect;
    node.add(flash);
    yield* flash.opacity(1, 0.08);
    yield* flash.opacity(0, 0.3);
    flash.remove();
  }

  function* morphTo(to: string, dur: number, seed = 7): ThreadGenerator {
    yield* scrambleText(txt, to, dur, seed);
  }

  return {node, text: txt, morphTo, swap};
}
