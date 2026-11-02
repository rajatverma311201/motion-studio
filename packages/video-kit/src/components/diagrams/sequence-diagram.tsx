import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {ThreadGenerator, all, createRef, easeInOutCubic} from '@motion-canvas/core';
import {pop} from '../../animation';
import {borderWidth, colors, fonts, radius, tintedSurface} from '../../theme';
import {chip} from '../chip';
import {sequenceLayout} from './sequence-layout';

/** One participant in a sequence diagram. */
export interface SequenceActor {
  id: string;
  label: string;
  color: string;
}

/** Options for {@link sequenceDiagram}. */
export interface SequenceDiagramOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  actors: SequenceActor[];
}

/** Options for one arrow. */
export interface SequenceMessageOptions {
  dashed?: boolean;
  color?: string;
  /** Small text chip that rides along with the arrow. */
  chip?: string;
}

/** Options for one note card. */
export interface SequenceNoteOptions {
  color?: string;
  side?: 'left' | 'right';
}

/** Handles returned by {@link sequenceDiagram}. */
export interface SequenceDiagram {
  node: Node;
  /** Draw one arrow between two actors, then stack the next one below it. */
  message(from: string, to: string, label: string, options?: SequenceMessageOptions): ThreadGenerator;
  /** Attach a small card to an actor's lifeline. */
  note(actor: string, text: string, options?: SequenceNoteOptions): ThreadGenerator;
  /** Fade out every message and note and start again at the top row. */
  clear(): ThreadGenerator;
}

/**
 * A sequence diagram: actor boxes, dashed lifelines and messages that reveal in
 * order. The scene supplies every label and colour; the component only draws.
 *
 * @example
 * const sequence = sequenceDiagram({
 *   x: 0, y: -30, w: 1200, h: 620,
 *   actors: [
 *     {id: 'client', label: 'CLIENT', color: colors.cyan},
 *     {id: 'server', label: 'SERVER', color: colors.lime},
 *   ],
 * });
 * view.add(sequence.node);
 * yield* sequence.message('client', 'server', 'GET /orders');
 * yield* sequence.message('server', 'client', '401 who are you?', {dashed: true, color: colors.red});
 */
export function sequenceDiagram(options: SequenceDiagramOptions): SequenceDiagram {
  const {x, y, w, h, actors} = options;
  if (actors.length === 0) throw new Error('sequenceDiagram needs at least one actor');

  const actorAt = new Map(actors.map((actor, index) => [actor.id, index]));
  const layout = sequenceLayout(w, h, actors.length, 1);
  const lifelines = layout.lifelineX.map(
    lifelineX =>
      (
        <Line
          points={[
            [lifelineX, layout.lifelineTop],
            [lifelineX, layout.lifelineBottom],
          ]}
          stroke={colors.dim}
          lineWidth={3}
          lineDash={[9, 11]}
        />
      ) as Line,
  );
  const boxes = actors.map((actor, index) => {
    const box = (
      <Rect
        x={layout.lifelineX[index]}
        y={layout.actorY}
        width={layout.actorWidth}
        height={layout.actorHeight}
        radius={radius(16)}
        fill={tintedSurface(actor.color)}
        stroke={actor.color}
        lineWidth={borderWidth(3)}
      >
        <Txt
          text={actor.label}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={20}
          letterSpacing={1.5}
          fill={actor.color}
        />
      </Rect>
    ) as Rect;
    return box;
  });
  const layers = createRef<Node>();
  const node = (
    <Node x={x} y={y}>
      {lifelines}
      {boxes}
      <Node ref={layers} />
    </Node>
  ) as Node;

  const transients: Node[] = [];
  let rowIndex = 0;

  const nextRow = (): number =>
    rowIndex < layout.rowY.length ? layout.rowY[rowIndex++] : layout.rowY[layout.rowY.length - 1] + rowIndex * 8;

  function* message(
    from: string,
    to: string,
    label: string,
    messageOptions: SequenceMessageOptions = {},
  ): ThreadGenerator {
    const fromIndex = actorAt.get(from);
    const toIndex = actorAt.get(to);
    if (fromIndex === undefined || toIndex === undefined) {
      throw new Error(`sequenceDiagram: unknown actor in "${from}" -> "${to}"`);
    }

    const startX = layout.lifelineX[fromIndex];
    const endX = layout.lifelineX[toIndex];
    const middle = (startX + endX) / 2;
    const rowY = nextRow();
    const color = messageOptions.color ?? actors[toIndex].color;
    const line = (
      <Line
        x={middle}
        y={rowY}
        points={[
          [startX - middle, 0],
          [endX - middle, 0],
        ]}
        stroke={color}
        lineWidth={4}
        lineDash={messageOptions.dashed ? [12, 9] : undefined}
        endArrow
        arrowSize={14}
        end={0}
      />
    ) as Line;
    const text = (
      <Txt x={middle} y={rowY - 24} text={label} fontFamily={fonts.mono} fontSize={19} fill={colors.mute} opacity={0} />
    ) as Txt;

    layers().add(line);
    layers().add(text);
    transients.push(line, text);
    yield* all(line.end(1, 0.42, easeInOutCubic), text.opacity(1, 0.25));

    if (messageOptions.chip) {
      const riding = chip(messageOptions.chip, tintedSurface(color), {
        fs: 17,
        x: startX,
        y: rowY + 26,
        color,
        shadow: colors.dim,
        sh: 3,
      }) as Rect;
      riding.opacity(0);
      layers().add(riding);
      transients.push(riding);
      yield* all(riding.opacity(1, 0.16), riding.x(endX, 0.42, easeInOutCubic));
    }
  }

  function* note(actor: string, text: string, noteOptions: SequenceNoteOptions = {}): ThreadGenerator {
    const index = actorAt.get(actor);
    if (index === undefined) throw new Error(`sequenceDiagram: unknown actor "${actor}"`);

    const side = noteOptions.side ?? 'right';
    const color = noteOptions.color ?? colors.yellow;
    const rowY = nextRow();
    const cardWidth = Math.min(360, Math.max(160, 36 + text.length * 10));
    const cardX = layout.lifelineX[index] + (side === 'right' ? 1 : -1) * (cardWidth / 2 + 24);
    const card = (
      <Rect
        x={cardX}
        y={rowY}
        width={cardWidth}
        height={54}
        radius={radius(12)}
        fill={tintedSurface(color)}
        stroke={color}
        lineWidth={borderWidth(2.5)}
        opacity={0}
      >
        <Txt text={text} width={cardWidth - 24} textWrap fontFamily={fonts.mono} fontSize={17} fill={colors.ink} />
      </Rect>
    ) as Rect;
    layers().add(card);
    transients.push(card);
    yield* pop(card, 0.3);
  }

  function* clear(): ThreadGenerator {
    if (transients.length === 0) return;
    yield* all(...transients.map(item => item.opacity(0, 0.18)));
    for (const item of transients) item.remove();
    transients.length = 0;
    rowIndex = 0;
  }

  return {node, message, note, clear};
}
