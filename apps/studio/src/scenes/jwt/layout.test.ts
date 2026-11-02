import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  ANATOMY,
  BASE64,
  CLAIMS,
  ENCODE,
  INTRO,
  KEYS,
  PITFALLS,
  PRACTICE,
  RECAP,
  SAFE,
  SIGNING,
  WHY,
  type Box,
} from './layout';

type Bounds = {x0: number; x1: number; y0: number; y1: number};

const bounds = (b: Box): Bounds => ({
  x0: b.x - b.w / 2,
  x1: b.x + b.w / 2,
  y0: b.y - b.h / 2,
  y1: b.y + b.h / 2,
});

const inside = (inner: Bounds, outer: Bounds): boolean =>
  inner.x0 >= outer.x0 && inner.x1 <= outer.x1 && inner.y0 >= outer.y0 && inner.y1 <= outer.y1;

const intersects = (a: Bounds, b: Bounds): boolean => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

const allBoxes: Array<[string, Box]> = [
  ...Object.entries(INTRO).map(([name, value]) => [`INTRO ${name}`, value] as [string, Box]),
  ...Object.entries(WHY).map(([name, value]) => [`WHY ${name}`, value] as [string, Box]),
  ...Object.entries(ANATOMY).map(([name, value]) => [`ANATOMY ${name}`, value] as [string, Box]),
  ...Object.entries(BASE64).map(([name, value]) => [`BASE64 ${name}`, value] as [string, Box]),
  ...Object.entries(ENCODE).map(([name, value]) => [`ENCODE ${name}`, value] as [string, Box]),
  ...Object.entries(SIGNING).map(([name, value]) => [`SIGNING ${name}`, value] as [string, Box]),
  ...Object.entries(KEYS).map(([name, value]) => [`KEYS ${name}`, value] as [string, Box]),
  ...Object.entries(CLAIMS).map(([name, value]) => [`CLAIMS ${name}`, value] as [string, Box]),
  ...Object.entries(PRACTICE).map(([name, value]) => [`PRACTICE ${name}`, value] as [string, Box]),
  ...Object.entries(PITFALLS).map(([name, value]) => [`PITFALLS ${name}`, value] as [string, Box]),
  ...Object.entries(RECAP).map(([name, value]) => [`RECAP ${name}`, value] as [string, Box]),
];

const groups: Array<[string, Box[]]> = [
  ['INTRO', Object.values(INTRO)],
  ['WHY act A', [WHY.sequence]],
  ['WHY act B', [WHY.sequence, WHY.store]],
  ['WHY table', [WHY.table]],
  ['ANATOMY full strip', [ANATOMY.fullStrip, ANATOMY.headerLabel, ANATOMY.payloadLabel, ANATOMY.signatureLabel]],
  ['ANATOMY header', [ANATOMY.stripTop, ANATOMY.headerPanel, ANATOMY.headerTable]],
  ['ANATOMY payload', [ANATOMY.stripTop, ANATOMY.payloadPanel, ANATOMY.claimsTable]],
  ['ANATOMY signature', [ANATOMY.stripTop, ANATOMY.signatureBlock, ANATOMY.formula, ANATOMY.signatureNote]],
  ['BASE64URL', [BASE64.visual, BASE64.decodeLeft, BASE64.decodeArrow, BASE64.decodeRight, BASE64.stamp]],
  ['ENCODE SIGN ENCRYPT', Object.values(ENCODE)],
  ['SIGNING build the input', [SIGNING.headerChip, SIGNING.dot, SIGNING.payloadChip, SIGNING.signingInput]],
  ['SIGNING sign', [SIGNING.signingInput, SIGNING.machine]],
  ['SIGNING verify', [SIGNING.strip, SIGNING.sigOriginal, SIGNING.sigRecomputed, SIGNING.match, SIGNING.machine]],
  [
    'SIGNING tamper',
    [
      SIGNING.strip,
      SIGNING.tamper,
      SIGNING.tamperOriginal,
      SIGNING.tamperRecomputed,
      SIGNING.tamperMachine,
      SIGNING.invalid,
    ],
  ],
  ['SIGNING reject', [SIGNING.strip, SIGNING.invalid, SIGNING.note]],
  ['KEYS shared secret', [KEYS.authServer, KEYS.service1, KEYS.service2, KEYS.service3, KEYS.forged]],
  ['KEYS key pair', [KEYS.authServer, KEYS.service1, KEYS.service2, KEYS.service3]],
  ['KEYS jwks', [KEYS.jwksPanel, KEYS.urlChip, KEYS.headerPanel, KEYS.kidChip]],
  ['KEYS rotation', [KEYS.key1, KEYS.key2, KEYS.rotateArrow]],
  ['CLAIMS valid window', [CLAIMS.bar, CLAIMS.skew, CLAIMS.tokenStrip, CLAIMS.status, CLAIMS.checklist]],
  [
    'CLAIMS refresh flow',
    [CLAIMS.refreshAccess, CLAIMS.refreshExpired, CLAIMS.refreshChip, CLAIMS.refreshNew, CLAIMS.refreshStore],
  ],
  ['PRACTICE sequence', [PRACTICE.sequence]],
  ['PRACTICE storage table', [PRACTICE.storageTable]],
  ['PRACTICE quarkus', [PRACTICE.propertiesPanel, PRACTICE.javaPanel, PRACTICE.extensionChip]],
  ['PITFALLS cards', Object.values(PITFALLS)],
  ['PITFALLS first row', [PITFALLS.card1, PITFALLS.card2]],
  ['PITFALLS second row', [PITFALLS.card3, PITFALLS.card4]],
  ['PITFALLS third row', [PITFALLS.card5, PITFALLS.card6]],
  ['RECAP', Object.values(RECAP)],
];

test('every declared box stays inside the safe content area', () => {
  for (const [name, item] of allBoxes) {
    assert.ok(inside(bounds(item), SAFE), `${name} leaves x ±930 / y ±410`);
  }
});

test('every box stays above the caption bar', () => {
  for (const [name, item] of allBoxes) {
    assert.ok(bounds(item).y1 <= 440, `${name} enters the caption bar`);
  }
});

for (const [name, boxes] of groups) {
  test(`${name}: the boxes on screen together do not overlap`, () => {
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        assert.ok(!intersects(bounds(boxes[i]), bounds(boxes[j])), `${name}: box ${i} and box ${j} overlap`);
      }
    }
  });
}
