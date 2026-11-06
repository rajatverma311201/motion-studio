import {Rect, Txt} from '@motion-canvas/2d';
import {borderWidth, colors, fonts, radius} from '../theme';

/** Options for {@link stamp}. */
export interface StampOptions {
  /** Rotation in degrees. Defaults to -4, like a rubber stamp. */
  rot?: number;
  /** Font size of the label. Defaults to 44. */
  fs?: number;
}

/**
 * A rotated, double-bordered label for NOT ENCRYPTED, INVALID and friends.
 * The outer and inner outlines both use the supplied colour. It deliberately
 * has no elevation shadow: Motion Canvas renders a shadowed node together with
 * its children, which would draw a second, offset copy of the whole label.
 *
 * @example
 * const mark = stamp('NOT ENCRYPTED', colors.red, {rot: -5, fs: 48});
 * view.add(mark);
 * yield* slam(mark, 0.4);
 */
export function stamp(text: string, color: string, options: StampOptions = {}): Rect {
  return (
    <Rect
      layout
      alignItems="center"
      padding={[10, 16]}
      radius={radius(14)}
      fill={colors.clear}
      rotation={options.rot ?? -4}
      stroke={color}
      lineWidth={borderWidth(6)}
    >
      <Rect
        layout
        alignItems="center"
        padding={[7, 18]}
        radius={radius(8)}
        fill={colors.clear}
        stroke={color}
        lineWidth={borderWidth(2)}
      >
        <Txt
          text={text}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={options.fs ?? 44}
          letterSpacing={2}
          fill={color}
        />
      </Rect>
    </Rect>
  ) as Rect;
}
