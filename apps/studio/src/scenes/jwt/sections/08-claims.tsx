import {Line, Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  chip,
  chipText,
  colors,
  fonts,
  JWT_TOKEN,
  label,
  leave,
  pop,
  readSeconds,
  say,
  timeBar,
  titledPanel,
  tokenStrip,
  validateClaims,
  type ClaimCheck,
} from '@motion-studio/video-kit';
import {CLAIMS} from '../layout';

const IAT = 1767225600;
const EXP = 1767229200;
const FROM = IAT - 900;
const TO = EXP + 900;
const NOW = IAT + 1800;

const payload = {iss: 'auth.example.com', aud: 'orders-api', exp: EXP, nbf: IAT, iat: IAT};

function checkLabel(check: ClaimCheck): string {
  if (check.name === 'iss') return 'iss = auth.example.com';
  if (check.name === 'aud') return 'aud = orders-api';
  return check.name;
}

// 07 CLAIMS — planned 55 s: time window, checklist, skew, wrong audience, refresh.
export function* claimsSection(view: View2D): ThreadGenerator {
  const captions = [
    'A valid signature is not enough. The server also checks the claims.',
    'exp: after this moment the token is dead. Keep access tokens short.',
    'nbf means not before. iat records when it was issued.',
    'iss must be someone you trust. aud must be you.',
    'Allow a little clock skew, a few seconds, between servers.',
    'A short life means a stolen token stops working soon.',
    'A refresh token gets a new access token without logging in again.',
  ];
  const root = createRef<Node>();

  const bar = timeBar({
    x: CLAIMS.bar.x,
    y: CLAIMS.bar.y,
    w: CLAIMS.bar.w,
    from: FROM,
    to: TO,
    markers: [
      {t: IAT, label: 'iat', color: colors.lime},
      {t: EXP, label: 'exp', color: colors.red},
    ],
    zones: [
      {from: FROM, to: IAT, color: colors.red},
      {from: IAT, to: EXP, color: colors.lime},
      {from: EXP, to: TO, color: colors.red},
    ],
  });
  const skew = chip('± a few seconds', colors.surf2, {
    x: CLAIMS.skew.x,
    y: CLAIMS.skew.y,
    fs: 20,
    color: colors.yellow,
    shadow: colors.dim,
    sh: 4,
  }) as Node;
  skew.opacity(0);

  const strip = tokenStrip({
    x: CLAIMS.tokenStrip.x,
    y: CLAIMS.tokenStrip.y,
    width: 1500,
    fontSize: 24,
    token: JWT_TOKEN,
  });
  const status = chip('VALID', colors.lime, {
    x: CLAIMS.status.x,
    y: CLAIMS.status.y,
    fs: 24,
    sh: 5,
  }) as Rect;

  const card = titledPanel({
    x: CLAIMS.checklist.x,
    y: CLAIMS.checklist.y,
    width: CLAIMS.checklist.w,
    height: CLAIMS.checklist.h,
    title: 'SERVER CHECKS',
    color: colors.lime,
  });
  const verdict = label('PASS', 360, -70, {fs: 18, fill: colors.lime, align: 'right'});
  card.add(verdict);

  const valid = validateClaims(payload, NOW, {issuer: 'auth.example.com', audience: 'orders-api', skewSeconds: 5});
  const rowLabels: Txt[] = [];
  const checkText = (check: ClaimCheck): string => `${checkLabel(check)} ${check.ok ? '✓' : '✗'}`;

  const signatureRow = (
    <Node y={-40} opacity={0}>
      <Txt
        x={-430}
        offsetX={-1}
        text="signature ✓"
        fontFamily={fonts.mono}
        fontWeight={700}
        fontSize={19}
        fill={colors.lime}
      />
    </Node>
  ) as Node;
  const checksRows = valid.checks.map((check, index) => {
    const row = (
      <Node y={-8 + index * 32} opacity={0}>
        <Txt
          x={-430}
          offsetX={-1}
          text={checkText(check)}
          fontFamily={fonts.mono}
          fontWeight={700}
          fontSize={19}
          fill={colors.ink}
        />
      </Node>
    ) as Node;
    rowLabels.push(row.children()[0] as Txt);
    return row;
  });
  card.add(signatureRow);
  for (const row of checksRows) card.add(row);

  const claimsGroup = (
    <Node>
      {bar.node}
      {skew}
      {strip.node}
      {status}
      {card}
    </Node>
  ) as Node;

  const refreshAccess = chip('ACCESS · 15 MIN', colors.lime, {
    x: CLAIMS.refreshAccess.x,
    y: CLAIMS.refreshAccess.y,
    fs: 24,
    sh: 6,
  }) as Node;
  const refreshExpired = chip('EXPIRED', colors.red, {
    x: CLAIMS.refreshExpired.x,
    y: CLAIMS.refreshExpired.y,
    fs: 24,
    sh: 6,
  }) as Node;
  const refreshChip = chip('REFRESH · stored server side', colors.violet, {
    x: CLAIMS.refreshChip.x,
    y: CLAIMS.refreshChip.y,
    fs: 22,
    sh: 6,
  }) as Node;
  const refreshNew = chip('NEW ACCESS', colors.lime, {
    x: CLAIMS.refreshNew.x,
    y: CLAIMS.refreshNew.y,
    fs: 24,
    sh: 6,
  }) as Node;
  const refreshStore = titledPanel({
    x: CLAIMS.refreshStore.x,
    y: CLAIMS.refreshStore.y,
    width: CLAIMS.refreshStore.w,
    height: CLAIMS.refreshStore.h,
    title: 'REFRESH TOKEN',
    color: colors.violet,
  });
  refreshStore.add(
    <Txt
      y={10}
      text="days · stored server side · rotated on use"
      fontFamily={fonts.mono}
      fontSize={20}
      fill={colors.mute}
    />,
  );
  const refreshArrows = [
    <Line
      points={[
        [-430, -115],
        [-430, -35],
      ]}
      stroke={colors.red}
      lineWidth={3}
      endArrow
      arrowSize={12}
    />,
    <Line
      points={[
        [-280, 0],
        [-230, 45],
      ]}
      stroke={colors.violet}
      lineWidth={3}
      endArrow
      arrowSize={12}
    />,
    <Line
      points={[
        [150, 60],
        [260, -115],
      ]}
      stroke={colors.violet}
      lineWidth={3}
      endArrow
      arrowSize={12}
    />,
    <Line
      points={[
        [-40, 115],
        [-40, 190],
      ]}
      stroke={colors.dim}
      lineWidth={3}
      lineDash={[8, 8]}
      endArrow
      arrowSize={12}
    />,
  ];
  const refreshGroup = (
    <Node opacity={0}>
      {refreshAccess}
      {refreshExpired}
      {refreshChip}
      {refreshNew}
      {refreshStore}
      {refreshArrows}
    </Node>
  ) as Node;

  view.add(
    <Node ref={root}>
      {claimsGroup}
      {refreshGroup}
    </Node>,
  );

  yield* all(
    say(captions[0], readSeconds(captions[0])),
    strip.typeIn(0.8),
    bar.moveNow(IAT, 0.9),
    delay(0.3, signatureRow.opacity(1, 0.25)),
  );
  yield* waitFor(2.0);

  yield* all(say(captions[1], readSeconds(captions[1])), bar.moveNow(EXP - 600, 0.9));
  for (const row of checksRows.slice(0, 1)) yield* row.opacity(1, 0.2);
  yield* waitFor(2.0);
  yield* all(bar.moveNow(EXP + 300, 0.9), status.fill(colors.red, 0.3));
  chipText(status).text('EXPIRED');
  yield* waitFor(3.0);

  yield* all(say(captions[2], readSeconds(captions[2])), bar.moveNow(IAT + 600, 0.6), status.fill(colors.lime, 0.3));
  chipText(status).text('VALID');
  yield* all(checksRows[0].opacity(1, 0.2), checksRows[1].opacity(1, 0.2));
  yield* waitFor(2.5);

  yield* all(
    say(captions[3], readSeconds(captions[3])),
    checksRows[2].opacity(1, 0.2),
    delay(0.3, checksRows[3].opacity(1, 0.2)),
  );
  yield* waitFor(3.0);

  const failed = validateClaims(payload, NOW, {
    issuer: 'auth.example.com',
    audience: 'payments-api',
    skewSeconds: 5,
  });
  for (let index = 0; index < failed.checks.length; index++) {
    const check = failed.checks[index];
    rowLabels[index].text(checkText(check));
    rowLabels[index].fill(check.ok ? colors.ink : colors.red);
  }
  verdict.text('REJECT');
  verdict.fill(colors.red);
  yield* all(card.stroke(colors.red, 0.25), card.shadowColor(colors.red, 0.25));
  yield* waitFor(2.5);

  for (let index = 0; index < valid.checks.length; index++) {
    const check = valid.checks[index];
    rowLabels[index].text(checkText(check));
    rowLabels[index].fill(colors.ink);
  }
  verdict.text('PASS');
  verdict.fill(colors.lime);
  yield* all(card.stroke(colors.border, 0.25), card.shadowColor(colors.lime, 0.25));
  yield* all(say(captions[4], readSeconds(captions[4])), pop(skew, 0.3));
  yield* waitFor(3.0);

  yield* all(say(captions[5], readSeconds(captions[5])), bar.moveNow(EXP + 600, 0.9), status.fill(colors.red, 0.3));
  chipText(status).text('EXPIRED');
  yield* waitFor(3.0);

  yield* all(claimsGroup.opacity(0, 0.3), refreshGroup.opacity(1, 0.3));
  yield* all(
    say(captions[6], readSeconds(captions[6])),
    pop(refreshAccess, 0.3),
    delay(0.2, pop(refreshExpired, 0.3)),
    delay(0.4, pop(refreshChip, 0.3)),
    delay(0.6, pop(refreshNew, 0.3)),
    delay(0.5, pop(refreshStore, 0.3)),
  );
  yield* waitFor(4.0);
  yield* leave(root());
}
