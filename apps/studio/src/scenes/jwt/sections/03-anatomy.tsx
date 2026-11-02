import {Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  boxStyle,
  chip,
  codePanel,
  colors,
  compareTable,
  fonts,
  JWT_HEADER_JSON,
  JWT_PAYLOAD_JSON,
  JWT_SIGNATURE,
  JWT_TOKEN,
  leave,
  pop,
  radius,
  readSeconds,
  REGISTERED_CLAIMS,
  revealLines,
  say,
  tintedSurface,
  tokenStrip,
} from '@motion-studio/video-kit';
import {ANATOMY} from '../layout';

function jsonLines(source: string): string[] {
  return JSON.stringify(JSON.parse(source), null, 2).split('\n');
}

// 02 ANATOMY — planned 80 s: full strip, header zoom, payload claims, signature.
export function* anatomySection(view: View2D): ThreadGenerator {
  const captions = [
    'A JWT is three parts joined by dots: header, payload, signature.',
    'The header says how the token is signed: here HS256, type JWT.',
    'The payload carries claims: facts about the user and the token.',
    'sub is who. iat is when it was issued. exp is when it expires.',
    'You can add your own claims too, like name and role.',
    'The signature is not JSON. It is raw bytes, written as text.',
    'It is computed from the header and the payload together.',
  ];
  const root = createRef<Node>();

  const fullStrip = tokenStrip({
    x: 0,
    y: ANATOMY.fullStrip.y,
    width: 1600,
    fontSize: 34,
    token: JWT_TOKEN,
  });
  const headerLabel = chip('HEADER', colors.pink, {
    x: ANATOMY.headerLabel.x,
    y: ANATOMY.headerLabel.y,
    fs: 26,
    sh: 5,
  }) as Node;
  const payloadLabel = chip('PAYLOAD', colors.cyan, {
    x: ANATOMY.payloadLabel.x,
    y: ANATOMY.payloadLabel.y,
    fs: 26,
    sh: 5,
  }) as Node;
  const signatureLabel = chip('SIGNATURE', colors.lime, {
    x: ANATOMY.signatureLabel.x,
    y: ANATOMY.signatureLabel.y,
    fs: 26,
    sh: 5,
  }) as Node;
  headerLabel.opacity(0);
  payloadLabel.opacity(0);
  signatureLabel.opacity(0);
  const fullGroup = (
    <Node>
      {fullStrip.node}
      {headerLabel}
      {payloadLabel}
      {signatureLabel}
    </Node>
  ) as Node;

  const stripTop = tokenStrip({
    x: 0,
    y: ANATOMY.stripTop.y,
    width: 1600,
    fontSize: 22,
    token: JWT_TOKEN,
  });
  stripTop.node.opacity(0);

  const headerPanel = codePanel({
    x: ANATOMY.headerPanel.x,
    y: ANATOMY.headerPanel.y,
    w: ANATOMY.headerPanel.w,
    title: 'HEADER DECODED',
    code: jsonLines(JWT_HEADER_JSON),
    lang: 'json',
    accent: colors.pink,
    fs: 22,
  });
  const headerTable = compareTable({
    x: ANATOMY.headerTable.x,
    y: ANATOMY.headerTable.y,
    w: ANATOMY.headerTable.w,
    columns: [
      {title: 'FIELD', color: colors.pink},
      {title: 'MEANING', color: colors.mute},
    ],
    rows: [
      {label: 'alg', cells: ['algorithm used to sign']},
      {label: 'typ', cells: ['token type']},
      {label: 'kid', cells: ['which key, optional']},
    ],
    rowHeight: 68,
    fontSize: 20,
  });
  const headerGroup = (
    <Node opacity={0}>
      {headerPanel.node}
      {headerTable.node}
    </Node>
  ) as Node;

  const payloadPanel = codePanel({
    x: ANATOMY.payloadPanel.x,
    y: ANATOMY.payloadPanel.y,
    w: ANATOMY.payloadPanel.w,
    title: 'PAYLOAD DECODED',
    code: jsonLines(JWT_PAYLOAD_JSON),
    lang: 'json',
    accent: colors.cyan,
    fs: 22,
  });
  const claimRows = [
    ...REGISTERED_CLAIMS.map(claim => ({label: claim.name, cells: [claim.meaning]})),
    {label: 'name', cells: ['your own claim: display name']},
    {label: 'role', cells: ['your own claim: authorisation role']},
  ];
  const claimsTable = compareTable({
    x: ANATOMY.claimsTable.x,
    y: ANATOMY.claimsTable.y,
    w: ANATOMY.claimsTable.w,
    columns: [
      {title: 'CLAIM', color: colors.cyan},
      {title: 'MEANS', color: colors.mute},
    ],
    rows: claimRows,
    rowHeight: 44,
    fontSize: 17,
  });
  const payloadGroup = (
    <Node opacity={0}>
      {payloadPanel.node}
      {claimsTable.node}
    </Node>
  ) as Node;

  const signatureBlock = (
    <Rect
      x={ANATOMY.signatureBlock.x}
      y={ANATOMY.signatureBlock.y}
      width={ANATOMY.signatureBlock.w}
      height={ANATOMY.signatureBlock.h}
      radius={radius(18)}
      fill={tintedSurface(colors.lime)}
      {...boxStyle(colors.lime, 9, 4)}
      opacity={0}
    >
      <Txt text={JWT_SIGNATURE} fontFamily={fonts.mono} fontWeight={700} fontSize={26} fill={colors.lime} />
    </Rect>
  ) as Rect;
  const formula = chip('HMAC-SHA256(secret, header.payload)', colors.surf2, {
    x: ANATOMY.formula.x,
    y: ANATOMY.formula.y,
    fs: 24,
    color: colors.ink,
    shadow: colors.lime,
    sh: 6,
  }) as Node;
  const signatureNote = chip('32 raw bytes · written as Base64URL text', colors.surf2, {
    x: ANATOMY.signatureNote.x,
    y: ANATOMY.signatureNote.y,
    fs: 21,
    color: colors.mute,
    shadow: colors.dim,
    sh: 4,
  }) as Node;
  formula.opacity(0);
  signatureNote.opacity(0);
  const signatureGroup = (
    <Node opacity={0}>
      {signatureBlock}
      {formula}
      {signatureNote}
    </Node>
  ) as Node;

  view.add(
    <Node ref={root}>
      {fullGroup}
      {stripTop.node}
      {headerGroup}
      {payloadGroup}
      {signatureGroup}
    </Node>,
  );

  yield* all(
    say(captions[0], readSeconds(captions[0])),
    fullStrip.typeIn(1.2),
    delay(1.3, pop(headerLabel, 0.3)),
    delay(1.45, pop(payloadLabel, 0.3)),
    delay(1.6, pop(signatureLabel, 0.3)),
  );
  yield* fullStrip.focus('header');
  yield* waitFor(0.6);
  yield* fullStrip.focus('payload');
  yield* waitFor(0.6);
  yield* fullStrip.focus('signature');
  yield* waitFor(0.8);
  yield* fullStrip.focus(null);
  yield* waitFor(2.5);

  yield* all(fullGroup.opacity(0, 0.3), stripTop.node.opacity(1, 0.3), headerGroup.opacity(1, 0.3));
  yield* all(say(captions[1], readSeconds(captions[1])), revealLines(headerPanel), headerTable.revealAll());
  yield* waitFor(7.0);

  yield* all(headerGroup.opacity(0, 0.25), payloadGroup.opacity(1, 0.3));
  yield* all(say(captions[2], readSeconds(captions[2])), revealLines(payloadPanel), claimsTable.revealAll());
  yield* waitFor(5.0);

  yield* all(
    say(captions[3], readSeconds(captions[3])),
    claimsTable.highlightCell(1, 0, colors.yellow),
    delay(0.5, claimsTable.highlightCell(5, 0, colors.yellow)),
    delay(1.0, claimsTable.highlightCell(3, 0, colors.yellow)),
  );
  yield* waitFor(5.0);

  yield* all(
    say(captions[4], readSeconds(captions[4])),
    claimsTable.highlightCell(7, 1, colors.violet),
    delay(0.35, claimsTable.highlightCell(8, 1, colors.violet)),
  );
  yield* waitFor(5.0);

  yield* all(payloadGroup.opacity(0, 0.25), signatureGroup.opacity(1, 0.3));
  yield* all(
    say(captions[5], readSeconds(captions[5])),
    pop(signatureBlock, 0.35),
    delay(0.25, pop(formula, 0.3)),
    delay(0.45, pop(signatureNote, 0.3)),
  );
  yield* waitFor(6.0);

  yield* all(say(captions[6], readSeconds(captions[6])), stripTop.focus('signature'));
  yield* waitFor(6.0);
  yield* leave(root());
}
