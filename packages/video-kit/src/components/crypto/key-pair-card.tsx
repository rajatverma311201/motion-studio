import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, easeInOutCubic} from '@motion-canvas/core';
import {pop} from '../../animation';
import {borderWidth, boxStyle, colors, fonts, radius} from '../../theme';
import {keyIcon, lockIcon} from './icons';

/** Options for {@link keyPairCard}. */
export interface KeyPairCardOptions {
  x: number;
  y: number;
  /** Name shown in the header, e.g. BANK. */
  owner: string;
  /** Accent for the card border and shadow, e.g. colors.violet. */
  color: string;
}

/** Handles returned by {@link keyPairCard}. */
export interface KeyPairCard {
  node: Rect;
  publicKey: Node;
  privateKey: Node;
  /** Pop the public row in; it starts hidden. */
  showPublic(): ThreadGenerator;
  /** Duplicate the public key and fly it to a scene position. */
  handOut(toX: number, toY: number): ThreadGenerator;
  /** Close the padlock on the private key. */
  lockPrivate(): ThreadGenerator;
}

const CARD_W = 620;
const CARD_H = 340;
const KEY_X = -220;
const PUBLIC_Y = -30;
const PRIVATE_Y = 90;

/**
 * A card holding one owner's key pair: a public key that can be handed out and
 * a private key behind a padlock. The caller supplies the owner and accent; the
 * component only draws and animates.
 *
 * @example
 * const bank = keyPairCard({x: 0, y: 0, owner: 'BANK', color: colors.violet});
 * view.add(bank.node);
 * yield* bank.showPublic();
 * yield* bank.lockPrivate();
 * yield* bank.handOut(-700, -120);
 */
export function keyPairCard(options: KeyPairCardOptions): KeyPairCard {
  const {x, y, owner, color} = options;
  const lock = lockIcon({x: 210, y: -4, size: 76, color: colors.red, open: true});

  const publicKey = (
    <Node y={PUBLIC_Y} opacity={0}>
      {keyIcon({x: KEY_X, y: 0, size: 64, color})}
      <Txt
        x={KEY_X + 52}
        y={-12}
        offsetX={-1}
        text="PUBLIC"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={26}
        letterSpacing={2}
        fill={colors.lime}
      />
      <Txt
        x={KEY_X + 52}
        y={18}
        offsetX={-1}
        text="share with everyone"
        fontFamily={fonts.mono}
        fontSize={17}
        fill={colors.mute}
      />
    </Node>
  ) as Node;
  const privateKey = (
    <Node y={PRIVATE_Y}>
      {keyIcon({x: KEY_X, y: 0, size: 64, color})}
      <Txt
        x={KEY_X + 52}
        y={-12}
        offsetX={-1}
        text="PRIVATE"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={26}
        letterSpacing={2}
        fill={colors.red}
      />
      <Txt
        x={KEY_X + 52}
        y={18}
        offsetX={-1}
        text="never leaves the owner"
        fontFamily={fonts.mono}
        fontSize={17}
        fill={colors.mute}
      />
      {lock.node}
    </Node>
  ) as Node;

  const node = (
    <Rect x={x} y={y} width={CARD_W} height={CARD_H} radius={radius(26)} fill={colors.surf} {...boxStyle(color, 9, 4)}>
      <Txt
        y={-CARD_H / 2 + 38}
        text={`${owner} KEY PAIR`}
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={22}
        letterSpacing={2}
        fill={color}
      />
      <Line
        y={-CARD_H / 2 + 68}
        points={[
          [-CARD_W / 2 + 28, 0],
          [CARD_W / 2 - 28, 0],
        ]}
        stroke={colors.dim}
        lineWidth={borderWidth(2)}
        opacity={0.5}
      />
      {publicKey}
      {privateKey}
    </Rect>
  ) as Rect;

  function* showPublic(): ThreadGenerator {
    yield* pop(publicKey, 0.35);
  }

  function* lockPrivate(): ThreadGenerator {
    yield* lock.lock();
  }

  function* handOut(toX: number, toY: number): ThreadGenerator {
    const copy = (
      <Node x={KEY_X} y={PUBLIC_Y} opacity={0}>
        {keyIcon({x: 0, y: 0, size: 56, color})}
        <Txt
          y={40}
          text="PUBLIC"
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={18}
          letterSpacing={1}
          fill={colors.lime}
        />
      </Node>
    ) as Node;
    node.add(copy);
    yield* pop(copy, 0.22);
    yield* copy.position([toX - x, toY - y], 0.75, easeInOutCubic);
  }

  return {node, publicKey, privateKey, showPublic, handOut, lockPrivate};
}
