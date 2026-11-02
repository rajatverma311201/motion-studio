import {Node, type View2D} from '@motion-canvas/2d';
import {all, createRef, delay, waitFor, type ThreadGenerator} from '@motion-canvas/core';
import {
  chip,
  codePanel,
  colors,
  compareTable,
  focusLine,
  leave,
  pop,
  readSeconds,
  revealLines,
  say,
  sequenceDiagram,
} from '@motion-studio/video-kit';
import {PRACTICE} from '../layout';

// 08 IN PRACTICE — planned 65 s: login flow, storage table, Quarkus config and roles.
export function* inPracticeSection(view: View2D): ThreadGenerator {
  const captions = [
    'Login: the client sends credentials, the auth server replies with a token.',
    'Every later call sends it in the Authorization header as a Bearer token.',
    'The API checks signature and claims. No database lookup needed.',
    'Where does the browser keep it? An HttpOnly cookie hides it from scripts.',
    'localStorage is easy, but any injected script can read it.',
    'In Quarkus, SmallRye JWT does the checking: set the public key and issuer.',
    'Then @RolesAllowed reads the roles from the token’s claims.',
  ];
  const root = createRef<Node>();

  const flow = sequenceDiagram({
    x: PRACTICE.sequence.x,
    y: PRACTICE.sequence.y,
    w: PRACTICE.sequence.w,
    h: PRACTICE.sequence.h,
    actors: [
      {id: 'browser', label: 'BROWSER', color: colors.cyan},
      {id: 'auth', label: 'AUTH', color: colors.violet},
      {id: 'api', label: 'API', color: colors.lime},
    ],
  });

  const storage = compareTable({
    x: PRACTICE.storageTable.x,
    y: PRACTICE.storageTable.y,
    w: PRACTICE.storageTable.w,
    columns: [
      {title: 'HttpOnly COOKIE', color: colors.lime},
      {title: 'localStorage', color: colors.yellow},
    ],
    rows: [
      {label: 'Readable by scripts', cells: ['no', 'yes']},
      {label: 'Sent automatically', cells: ['yes', 'no']},
      {label: 'Main risk', cells: ['CSRF', 'XSS']},
    ],
    rowHeight: 82,
    fontSize: 22,
  });
  storage.node.opacity(0);

  const properties = codePanel({
    x: PRACTICE.propertiesPanel.x,
    y: PRACTICE.propertiesPanel.y,
    w: PRACTICE.propertiesPanel.w,
    title: 'application.properties',
    code: [
      '# SmallRye JWT',
      'mp.jwt.verify.publickey.location=',
      '  https://auth.example.com/.well-known/jwks.json',
      'mp.jwt.verify.issuer=https://auth.example.com',
    ],
    lang: 'properties',
    accent: colors.cyan,
    fs: 20,
  });
  const java = codePanel({
    x: PRACTICE.javaPanel.x,
    y: PRACTICE.javaPanel.y,
    w: PRACTICE.javaPanel.w,
    title: 'OrderResource.java',
    code: ['@GET', '@RolesAllowed("admin")', 'public List<Order> orders() {', '  return service.list();', '}'],
    lang: 'java',
    accent: colors.lime,
    fs: 22,
  });
  const extension = chip('EXTENSION · quarkus-smallrye-jwt', colors.surf2, {
    x: PRACTICE.extensionChip.x,
    y: PRACTICE.extensionChip.y,
    fs: 22,
    color: colors.cyan,
    shadow: colors.dim,
    sh: 5,
  }) as Node;
  properties.node.opacity(0);
  java.node.opacity(0);
  extension.opacity(0);

  view.add(
    <Node ref={root}>
      {flow.node}
      {storage.node}
      {properties.node}
      {java.node}
      {extension}
    </Node>,
  );

  yield* all(
    say(captions[0], readSeconds(captions[0])),
    flow.message('browser', 'auth', 'POST /login', {chip: 'credentials'}),
    delay(0.55, flow.message('auth', 'browser', '200 + token', {color: colors.lime})),
  );
  yield* waitFor(2.0);

  yield* all(
    say(captions[1], readSeconds(captions[1])),
    flow.message('browser', 'api', 'GET /orders', {chip: 'Authorization: Bearer <token>'}),
  );
  yield* waitFor(2.0);

  yield* all(
    say(captions[2], readSeconds(captions[2])),
    delay(0.2, flow.note('api', 'verify signature + claims', {color: colors.lime})),
    delay(1.0, flow.message('api', 'browser', '200 orders', {color: colors.lime})),
  );
  yield* waitFor(4.0);

  yield* all(flow.node.opacity(0, 0.3), delay(0.2, storage.node.opacity(1, 0.25)));
  yield* all(say(captions[3], readSeconds(captions[3])), storage.revealRow(0));
  yield* waitFor(3.5);

  yield* all(say(captions[4], readSeconds(captions[4])), storage.revealRow(1), delay(0.4, storage.revealRow(2)));
  yield* waitFor(4.0);

  yield* all(
    storage.node.opacity(0, 0.3),
    properties.node.opacity(1, 0.3),
    delay(0.2, revealLines(properties)),
    delay(0.4, pop(extension, 0.3)),
  );
  yield* all(say(captions[5], readSeconds(captions[5])), focusLine(properties, 1, colors.cyan));
  yield* waitFor(4.0);

  yield* all(java.node.opacity(1, 0.3), delay(0.2, revealLines(java)));
  yield* all(say(captions[6], readSeconds(captions[6])), focusLine(java, 1, colors.lime));
  yield* waitFor(5.0);
  yield* leave(root());
}
