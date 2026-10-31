import {Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, waitFor} from '@motion-canvas/core';
import {boxStyle, radius} from '../../theme/box-style';
import {colors} from '../../theme/colors';
import {fonts} from '../../theme/fonts';

/** Options for {@link lamp}. */
export interface LampOptions {
  label: string;
  color: string;
  w?: number;
}

/** Handles returned by {@link lamp}. */
export interface Lamp {
  node: Rect;
  set(on: boolean): ThreadGenerator;
  setNow(on: boolean): void;
}

const registry = new WeakMap<Rect, Lamp>();

/**
 * A small signal pill that sits dim until switched on.
 *
 * @example
 * const read = lamp({label: 'READ', color: colors.red});
 * view.add(read.node);
 * yield* read.set(true);
 */
export function lamp(options: LampOptions): Lamp {
  const {label, color, w = 200} = options;
  const text = createRef<Txt>();
  const node = (
    <Rect width={w} height={34} radius={radius(8)} fill={colors.surf2} {...boxStyle(color, 3, 2.5)}>
      <Txt
        ref={text}
        text={label}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={16}
        letterSpacing={1}
        fill={colors.mute}
      />
    </Rect>
  ) as Rect;

  const setNow = (on: boolean): void => {
    node.fill(on ? color : colors.surf2);
    text().fill(on ? colors.onAccent : colors.mute);
  };

  const set = function* (on: boolean): ThreadGenerator {
    setNow(on);
    yield* all(node.scale(on ? 1.05 : 1, 0.15), node.opacity(1, 0.15));
  };

  const handle: Lamp = {node, set, setNow};
  registry.set(node, handle);
  return handle;
}

/**
 * Switch a lamp on or off when you only hold its node, used by the memory header.
 *
 * @example
 * yield* lampOn(memory.header.read, true);
 */
export function* lampOn(node: Rect, on: boolean): ThreadGenerator {
  const handle = registry.get(node);
  if (!handle) {
    node.opacity(on ? 1 : 0.55, 0.15);
    yield* waitFor(0);
    return;
  }
  yield* handle.set(on);
}
