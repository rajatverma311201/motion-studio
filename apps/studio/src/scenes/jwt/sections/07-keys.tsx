import {Line, Node, Txt, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  chip,
  codePanel,
  colors,
  ES256_JWK,
  fonts,
  keyIcon,
  label,
  leave,
  pop,
  readSeconds,
  revealLines,
  say,
  slam,
  stamp,
  titledPanel,
} from '@motion-studio/video-kit';
import {KEYS} from '../layout';
import {shortenMiddle} from '../shorten';

const JWK_LINES = [
  '{',
  '  "keys": [',
  '    {',
  '      "kty": "EC",',
  '      "crv": "P-256",',
  `      "x": "${shortenMiddle(ES256_JWK.x)}",`,
  `      "y": "${shortenMiddle(ES256_JWK.y)}",`,
  '      "kid": "key-1",',
  '      "use": "sig",',
  '      "alg": "ES256"',
  '    }',
  '  ]',
  '}',
];

// 06 KEYS — planned 55 s: shared secret, leak, key pair, JWKS, rotation.
export function* keysSection(view: View2D): ThreadGenerator {
  const captions = [
    'HS256 uses one shared secret. Everyone who verifies can also sign.',
    'Ten services, ten copies of the secret. One leak breaks them all.',
    'RS256 and ES256 use a key pair instead.',
    'The private key signs, and it never leaves the auth server.',
    'The public key only verifies. Services can hold it safely.',
    'Public keys are published at a JWKS URL. The kid picks the right one.',
    'Rotating a key means publishing a new one with a new kid.',
  ];
  const root = createRef<Node>();

  const authPanel = titledPanel({
    x: KEYS.authServer.x,
    y: KEYS.authServer.y,
    width: KEYS.authServer.w,
    height: KEYS.authServer.h,
    title: 'AUTH SERVER',
    color: colors.red,
  });
  const servicePanels = [KEYS.service1, KEYS.service2, KEYS.service3].map((position, index) =>
    titledPanel({
      x: position.x,
      y: position.y,
      width: position.w,
      height: position.h,
      title: `SERVICE ${index + 1}`,
      color: colors.lime,
    }),
  );

  const arrows = [KEYS.service1, KEYS.service2, KEYS.service3].map(
    service =>
      (
        <Line
          points={[
            [KEYS.authServer.x + KEYS.authServer.w / 2, KEYS.authServer.y],
            [service.x - service.w / 2, service.y],
          ]}
          stroke={colors.orange}
          lineWidth={3}
          lineDash={[9, 8]}
          endArrow
          arrowSize={12}
          opacity={0.75}
        />
      ) as Line,
  );

  const secretKeys = (
    <Node>
      {keyIcon({x: KEYS.authServer.x, y: KEYS.authServer.y - 5, size: 64, color: colors.orange})}
      {label('SECRET', KEYS.authServer.x, KEYS.authServer.y + 52, {fs: 18, fill: colors.orange})}
      {[KEYS.service1, KEYS.service2, KEYS.service3].map(position => (
        <Node>
          {keyIcon({x: position.x, y: position.y - 2, size: 44, color: colors.orange})}
          {label('SECRET', position.x, position.y + 40, {fs: 16, fill: colors.orange})}
        </Node>
      ))}
    </Node>
  ) as Node;

  const leakKeys = (
    <Node opacity={0}>
      {keyIcon({x: KEYS.authServer.x, y: KEYS.authServer.y - 5, size: 64, color: colors.red})}
      {label('LEAKED', KEYS.authServer.x, KEYS.authServer.y + 52, {fs: 18, fill: colors.red})}
      {[KEYS.service1, KEYS.service2, KEYS.service3].map(position => (
        <Node>
          {keyIcon({x: position.x, y: position.y - 2, size: 44, color: colors.red})}
          {label('LEAKED', position.x, position.y + 40, {fs: 16, fill: colors.red})}
        </Node>
      ))}
      {(() => {
        const mark = stamp('LEAKED', colors.red, {rot: -5, fs: 18});
        mark.x(KEYS.service2.x);
        mark.y(KEYS.service2.y);
        return mark;
      })()}
    </Node>
  ) as Node;

  const pairKeys = (
    <Node opacity={0}>
      {keyIcon({x: KEYS.authServer.x, y: KEYS.authServer.y - 5, size: 64, color: colors.red})}
      {label('PRIVATE · SIGNS', KEYS.authServer.x, KEYS.authServer.y + 52, {fs: 16, fill: colors.red})}
      {[KEYS.service1, KEYS.service2, KEYS.service3].map(position => (
        <Node>
          {keyIcon({x: position.x, y: position.y - 2, size: 44, color: colors.lime})}
          {label('PUBLIC · VERIFIES', position.x, position.y + 40, {fs: 14, fill: colors.lime})}
        </Node>
      ))}
    </Node>
  ) as Node;

  const forged = (
    <Node opacity={0}>
      <Line
        points={[
          [KEYS.service2.x + KEYS.service2.w / 2, KEYS.service2.y],
          [KEYS.forged.x - KEYS.forged.w / 2, KEYS.forged.y],
        ]}
        stroke={colors.red}
        lineWidth={3}
        lineDash={[8, 8]}
        endArrow
        arrowSize={12}
      />
      {chip('FORGED · {"role":"admin"}', colors.red, {
        x: KEYS.forged.x,
        y: KEYS.forged.y,
        fs: 20,
        sh: 5,
      })}
    </Node>
  ) as Node;

  const actorsGroup = (
    <Node>
      {authPanel}
      {servicePanels}
      {secretKeys}
      {arrows}
      {leakKeys}
      {pairKeys}
      {forged}
    </Node>
  ) as Node;

  const jwksPanel = codePanel({
    x: KEYS.jwksPanel.x,
    y: KEYS.jwksPanel.y,
    w: KEYS.jwksPanel.w,
    title: 'JWKS',
    code: JWK_LINES,
    lang: 'json',
    accent: colors.violet,
    fs: 18,
  });
  const url = chip('/.well-known/jwks.json', colors.surf2, {
    x: KEYS.urlChip.x,
    y: KEYS.urlChip.y,
    fs: 22,
    color: colors.cyan,
    shadow: colors.dim,
    sh: 5,
  }) as Node;
  const headerPanel = codePanel({
    x: KEYS.headerPanel.x,
    y: KEYS.headerPanel.y,
    w: KEYS.headerPanel.w,
    title: 'ES256 HEADER',
    code: ['{"alg": "ES256", "typ": "JWT", "kid": "key-1"}'],
    lang: 'json',
    accent: colors.pink,
    fs: 18,
  });
  const kid = chip('kid = key-1', colors.surf2, {
    x: KEYS.kidChip.x,
    y: KEYS.kidChip.y,
    fs: 22,
    color: colors.violet,
    shadow: colors.dim,
    sh: 4,
  }) as Node;
  const jwksGroup = (
    <Node opacity={0}>
      {jwksPanel.node}
      {url}
      {headerPanel.node}
      {kid}
    </Node>
  ) as Node;

  const keyCard = (
    position: {x: number; y: number; w: number; h: number},
    title: string,
    accent: string,
    kidText: string,
  ) => {
    const card = titledPanel({
      x: position.x,
      y: position.y,
      width: position.w,
      height: position.h,
      title,
      color: accent,
    });
    card.add(
      <Node>
        <Txt y={-38} text={kidText} fontFamily={fonts.mono} fontWeight={700} fontSize={22} fill={accent} />
        <Txt y={20} text="ES256 · P-256 · use: sig" fontFamily={fonts.mono} fontSize={18} fill={colors.mute} />
      </Node>,
    );
    return card;
  };

  const key1 = keyCard(KEYS.key1, 'KEY 1', colors.lime, 'kid: key-1');
  const key2 = keyCard(KEYS.key2, 'KEY 2', colors.cyan, 'kid: key-2');
  const key1Icon = keyIcon({x: -180, y: KEYS.key1.y, size: 58, color: colors.lime});
  const key2Icon = keyIcon({x: -180, y: KEYS.key2.y, size: 58, color: colors.cyan});
  key2Icon.opacity(0);
  const rotateArrow = (
    <Txt
      x={KEYS.rotateArrow.x}
      y={KEYS.rotateArrow.y}
      text="↓"
      fontFamily={fonts.mono}
      fontWeight={700}
      fontSize={44}
      fill={colors.yellow}
    />
  ) as Txt;
  const retired = stamp('RETIRED', colors.red, {rot: -5, fs: 22});
  retired.x(KEYS.retired.x);
  retired.y(KEYS.retired.y);
  retired.opacity(0);
  key2.opacity(0);
  const rotationGroup = (
    <Node opacity={0}>
      {key1}
      {key1Icon}
      {key2}
      {key2Icon}
      {rotateArrow}
      {retired}
    </Node>
  ) as Node;

  view.add(
    <Node ref={root}>
      {actorsGroup}
      {jwksGroup}
      {rotationGroup}
    </Node>,
  );
  actorsGroup.opacity(0);

  yield* all(say(captions[0], readSeconds(captions[0])), actorsGroup.opacity(1, 0.3));
  yield* waitFor(1.0);

  yield* all(
    say(captions[1], readSeconds(captions[1])),
    secretKeys.opacity(0, 0.25),
    leakKeys.opacity(1, 0.25),
    delay(0.35, pop(forged, 0.3)),
  );
  yield* waitFor(3.0);

  yield* all(
    say(captions[2], readSeconds(captions[2])),
    leakKeys.opacity(0, 0.25),
    forged.opacity(0, 0.2),
    pairKeys.opacity(1, 0.25),
  );
  yield* waitFor(2.0);

  yield* say(captions[3], readSeconds(captions[3]));
  yield* waitFor(3.0);

  yield* say(captions[4], readSeconds(captions[4]));
  yield* waitFor(3.0);

  yield* all(
    say(captions[5], readSeconds(captions[5])),
    actorsGroup.opacity(0, 0.3),
    jwksGroup.opacity(1, 0.3),
    delay(0.2, revealLines(jwksPanel)),
    delay(0.3, pop(url, 0.3)),
    delay(0.45, pop(headerPanel.node, 0.3)),
    delay(0.6, pop(kid, 0.3)),
  );
  yield* waitFor(4.0);

  yield* all(jwksGroup.opacity(0, 0.3), rotationGroup.opacity(1, 0.3));
  yield* all(
    say(captions[6], readSeconds(captions[6])),
    pop(key2, 0.35),
    key2Icon.opacity(1, 0.25),
    delay(0.25, slam(retired, 0.4)),
  );
  yield* waitFor(4.0);
  yield* leave(root());
}
