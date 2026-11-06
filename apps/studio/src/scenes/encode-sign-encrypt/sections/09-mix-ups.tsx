import {Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {CAPTIONS, MYTHS, boxStyle, colors, fonts, leave, pop, radius, readSeconds, say} from '@motion-studio/video-kit';
import {MIX_UPS} from '../layout';

interface MythCardOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  myth: string;
  truth: string;
}

interface MythCard {
  node: Rect;
  showTruth(): ThreadGenerator;
}

function mythCard(options: MythCardOptions): MythCard {
  const {x, y, w, h, myth, truth} = options;
  const tagText = (
    <Txt text="MYTH" fontFamily={fonts.mono} fontWeight={700} fontSize={22} letterSpacing={1} fill={colors.onAccent} />
  ) as Txt;
  const tag = (
    <Rect x={-w / 2 + 76} width={104} height={56} radius={radius(12)} fill={colors.red}>
      {tagText}
    </Rect>
  ) as Rect;
  const body = (
    <Txt x={-w / 2 + 150} y={0} offsetX={-1} text={myth} fontFamily={fonts.mono} fontSize={22} fill={colors.ink} />
  ) as Txt;
  const node = (
    <Rect x={x} y={y} width={w} height={h} radius={radius(20)} fill={colors.surf} {...boxStyle(colors.dim, 5, 3)}>
      {tag}
      {body}
    </Rect>
  ) as Rect;

  function* showTruth(): ThreadGenerator {
    yield* body.opacity(0, 0.1);
    tagText.text('TRUTH');
    body.text(truth);
    node.rotation(-1);
    yield* all(tag.fill(colors.lime, 0.2), body.opacity(1, 0.2), node.rotation(0, 0.2));
  }

  return {node, showTruth};
}

// 08 MIX-UPS — planned 60 s: five myths, each replaced by the truth.
export function* mixUpsSection(view: View2D): ThreadGenerator {
  const captions = CAPTIONS['mix-ups'];
  const root = createRef<Node>();
  const positions = [MIX_UPS.card1, MIX_UPS.card2, MIX_UPS.card3, MIX_UPS.card4, MIX_UPS.card5];
  const cards = MYTHS.map((myth, index) =>
    mythCard({
      x: positions[index].x,
      y: positions[index].y,
      w: positions[index].w,
      h: positions[index].h,
      myth: myth.myth,
      truth: myth.truth,
    }),
  );
  for (const card of cards) card.node.opacity(0);

  view.add(<Node ref={root}>{cards.map(card => card.node)}</Node>);

  for (let index = 0; index < cards.length; index++) {
    yield* all(say(captions[index], readSeconds(captions[index])), pop(cards[index].node, 0.3));
    yield* waitFor(0.6);
    yield* cards[index].showTruth();
    yield* waitFor(4.0);
  }

  yield* waitFor(8.0);
  yield* leave(root());
}
