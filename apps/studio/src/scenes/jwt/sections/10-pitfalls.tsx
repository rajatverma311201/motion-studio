import {Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {chip, colors, fonts, leave, pop, radius, readSeconds, say, titledPanel} from '@motion-studio/video-kit';
import {PITFALLS, type Box} from '../layout';

interface Pitfall {
  box: Box;
  title: string;
  visual: string;
  attack: string;
  fix: string;
}

const PITFALLS_DATA: Pitfall[] = [
  {
    box: PITFALLS.card1,
    title: 'ALG: NONE',
    visual: '"alg": "none"   signature: ""',
    attack: 'ATTACK · no signature',
    fix: 'FIX · pin algorithms',
  },
  {
    box: PITFALLS.card2,
    title: 'ALGORITHM CONFUSION',
    visual: 'RS256 → HS256   public key as secret',
    attack: 'ATTACK · swap alg',
    fix: 'FIX · pin per key',
  },
  {
    box: PITFALLS.card3,
    title: 'WEAK SECRET',
    visual: '"secret123"   cracked offline',
    attack: 'ATTACK · guessable',
    fix: 'FIX · long random keys',
  },
  {
    box: PITFALLS.card4,
    title: 'SECRETS IN PAYLOAD',
    visual: '"password": "hunter2"   anyone can read',
    attack: 'ATTACK · readable',
    fix: 'FIX · keep secrets out',
  },
  {
    box: PITFALLS.card5,
    title: 'NO REVOCATION',
    visual: 'logout   →   token still valid',
    attack: 'ATTACK · still valid',
    fix: 'FIX · short life + denylist',
  },
  {
    box: PITFALLS.card6,
    title: 'UNCHECKED CLAIMS',
    visual: 'exp · nbf · iss · aud   never compared',
    attack: 'ATTACK · stale token',
    fix: 'FIX · validate claims',
  },
];

// 09 PITFALLS — planned 60 s: six cards, attack and fix side by side.
export function* pitfallsSection(view: View2D): ThreadGenerator {
  const captions = [
    'Pitfall one: alg none. The attacker drops the signature and sets alg to none.',
    'The fix: the server decides which algorithms it accepts, never the token.',
    'Pitfall two: algorithm confusion. RS256 swapped for HS256, using the public key.',
    'Pin one algorithm per key and this attack dies.',
    'Weak secrets can be guessed offline. Use long random keys.',
    'The payload is readable: no passwords, no private data.',
    'A token cannot be un-issued. Keep it short-lived and plan for revocation.',
  ];
  const root = createRef<Node>();
  const cards = PITFALLS_DATA.map(data => {
    const card = titledPanel({
      x: data.box.x,
      y: data.box.y,
      width: data.box.w,
      height: data.box.h,
      title: data.title,
      color: colors.pink,
    });
    card.add(
      <Node>
        <Rect y={-10} width={600} height={46} radius={radius(10)} fill={colors.code} stroke={colors.pink} lineWidth={3}>
          <Txt text={data.visual} fontFamily={fonts.mono} fontWeight={700} fontSize={18} fill={colors.ink} />
        </Rect>
        {chip(data.attack, colors.red, {x: -155, y: 55, fs: 18, sh: 4})}
        {chip(data.fix, colors.lime, {x: 165, y: 55, fs: 18, sh: 4})}
      </Node>,
    );
    card.opacity(0);
    return card;
  });

  view.add(<Node ref={root}>{cards}</Node>);

  yield* all(say(captions[0], readSeconds(captions[0])), pop(cards[0], 0.35));
  yield* waitFor(3.0);

  yield* say(captions[1], readSeconds(captions[1]));
  yield* waitFor(2.0);

  yield* all(say(captions[2], readSeconds(captions[2])), pop(cards[1], 0.35));
  yield* waitFor(3.0);

  yield* say(captions[3], readSeconds(captions[3]));
  yield* waitFor(2.0);

  yield* all(say(captions[4], readSeconds(captions[4])), pop(cards[2], 0.35));
  yield* waitFor(3.0);

  yield* all(say(captions[5], readSeconds(captions[5])), pop(cards[3], 0.35));
  yield* waitFor(3.0);

  yield* all(say(captions[6], readSeconds(captions[6])), pop(cards[4], 0.35), pop(cards[5], 0.35));
  yield* waitFor(4.0);
  yield* leave(root());
}
