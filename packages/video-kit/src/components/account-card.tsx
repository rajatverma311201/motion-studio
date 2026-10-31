import {Rect, Txt} from '@motion-canvas/2d';
import {createRef} from '@motion-canvas/core';
import {colors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import {formatNumber, neubrutal} from '../theme/neubrutal';

/** Options for {@link accountCard}. */
export interface AccountCardOptions {
  name: string;
  letter: string;
  color: string;
  x: number;
  y: number;
  value: number;
  /** Text shown in the status tag. Defaults to 'UNCOMMITTED'. */
  tagText?: string;
  /** Formatter for the balance. Defaults to `formatNumber` (en-US, no currency). */
  format?: (value: number) => string;
}

/** Handles returned by {@link accountCard} so a scene can animate the balance and tag. */
export interface AccountCard {
  node: Rect;
  bal: Txt;
  tag: Rect;
  value: number;
}

/**
 * Neubrutalist bank-account card with a letter tile, a balance and a hidden status tag.
 *
 * @example
 * const alice = accountCard({name: 'ALICE', letter: 'A', color: colors.cyan, x: -560, y: -170, value: 1000});
 * view.add(alice.node);
 */
export function accountCard(options: AccountCardOptions): AccountCard {
  const {name, letter, color, x, y, value, tagText = 'UNCOMMITTED', format = formatNumber} = options;
  const bal = createRef<Txt>();
  const tag = createRef<Rect>();
  const node = (
    <Rect x={x} y={y} width={500} height={190} radius={22} fill={colors.surf} {...neubrutal(color, 9, 4)}>
      <Rect x={-170} width={100} height={100} radius={20} fill={color} stroke={colors.ink} lineWidth={4}>
        <Txt text={letter} fontFamily={fonts.sans} fontWeight={700} fontSize={66} fill={colors.dark} />
      </Rect>
      <Txt
        x={-100}
        y={-52}
        offsetX={-1}
        text={name}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={20}
        letterSpacing={3}
        fill={colors.mute}
      />
      <Txt
        ref={bal}
        x={-100}
        y={12}
        offsetX={-1}
        text={format(value)}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={66}
        fill={colors.ink}
      />
      <Rect
        ref={tag}
        x={158}
        y={-60}
        layout
        alignItems="center"
        padding={[3, 10]}
        radius={8}
        fill={colors.yellow}
        opacity={0}
      >
        <Txt text={tagText} fontFamily={fonts.mono} fontWeight={700} fontSize={14} letterSpacing={1} fill={colors.dark} />
      </Rect>
    </Rect>
  ) as Rect;
  return {node, bal: bal(), tag: tag(), value};
}
