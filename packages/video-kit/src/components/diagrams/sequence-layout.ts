/** Geometry for a sequence diagram, independent of Motion Canvas. */
export interface SequenceLayout {
  actorWidth: number;
  actorHeight: number;
  actorY: number;
  lifelineTop: number;
  lifelineBottom: number;
  lifelineX: number[];
  rowY: number[];
}

const ACTOR_HEIGHT = 64;
const MIN_ROW_GAP = 44;
const TARGET_ROW_GAP = 90;

/**
 * Place actor boxes, lifelines and message rows inside a `w` by `h` box.
 *
 * Actors are evenly spaced; message rows start below the actor boxes and run
 * downwards. Pure, so the tests can check bounds and spacing without a renderer.
 *
 * @example
 * sequenceLayout(900, 600, 2, 4).rowY; // four y values, 90 px apart
 */
export function sequenceLayout(w: number, h: number, actorCount: number, messageCount: number): SequenceLayout {
  if (actorCount < 1) {
    throw new Error('sequenceLayout needs at least one actor');
  }

  const spacing = w / actorCount;
  const actorWidth = Math.min(240, Math.max(120, spacing * 0.72));
  const actorY = -h / 2 + ACTOR_HEIGHT / 2 + 16;
  const lifelineTop = actorY + ACTOR_HEIGHT / 2 + 12;
  const lifelineBottom = h / 2 - 40;
  const rowTop = lifelineTop + 60;
  const rowBottom = h / 2 - 60;
  const gap =
    messageCount <= 1 ? 0 : Math.max(MIN_ROW_GAP, Math.min(TARGET_ROW_GAP, (rowBottom - rowTop) / (messageCount - 1)));

  return {
    actorWidth,
    actorHeight: ACTOR_HEIGHT,
    actorY,
    lifelineTop,
    lifelineBottom,
    lifelineX: Array.from({length: actorCount}, (_, index) => -w / 2 + spacing * (index + 0.5)),
    rowY: Array.from({length: messageCount}, (_, index) => rowTop + index * gap),
  };
}
