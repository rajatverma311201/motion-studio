import type {Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, all} from '@motion-canvas/core';
import {chip, colors, countTo, type AccountCard} from '@motion-studio/video-kit';

/** Balance text with a rupee sign and Indian digit grouping. */
export const fmt = (n: number): string => '₹' + Math.round(n).toLocaleString('en-IN');

/** Set the text and colour of an account card's status tag. */
export function* setTag(a: AccountCard, text: string, fill: string): ThreadGenerator {
  (a.tag.children()[0] as Txt).text(text);
  a.tag.fill(fill);
  if (a.tag.opacity() < 0.5) yield* a.tag.opacity(1, 0.2);
}

/** Animate an account card's balance to a new value. */
export function* moveBal(a: AccountCard, to: number, dur = 0.7, color: string = colors.ink): ThreadGenerator {
  yield* all(countTo(a.bal, a.value, to, dur, fmt), a.bal.fill(color, dur));
  a.value = to;
}

/** Lesson-specific total row. */
export function totalChip(x: number, y: number): Rect {
  return chip('TOTAL IN BANK  ₹1,500', colors.cyan, {x, y, fs: 26, sh: 7, shadow: colors.ink}) as Rect;
}

/** The flying rupee coin. */
export function coin(): Rect {
  return chip('₹300', colors.yellow, {fs: 24, sh: 4}) as Rect;
}
