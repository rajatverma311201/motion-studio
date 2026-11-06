import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  COMBINING,
  ENCODING,
  ENCRYPTION,
  HASHING,
  INTRO,
  KEY_PAIRS,
  MESSAGE,
  MIX_UPS,
  PROBLEM,
  RECAP,
  SAFE,
  SIGNING,
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
  ['MESSAGE', MESSAGE],
  ...Object.entries(INTRO).map(([name, value]) => [`INTRO ${name}`, value] as [string, Box]),
  ...Object.entries(PROBLEM).map(([name, value]) => [`PROBLEM ${name}`, value] as [string, Box]),
  ...Object.entries(ENCODING).map(([name, value]) => [`ENCODING ${name}`, value] as [string, Box]),
  ...Object.entries(HASHING).map(([name, value]) => [`HASHING ${name}`, value] as [string, Box]),
  ...Object.entries(SIGNING).map(([name, value]) => [`SIGNING ${name}`, value] as [string, Box]),
  ...Object.entries(ENCRYPTION).map(([name, value]) => [`ENCRYPTION ${name}`, value] as [string, Box]),
  ...Object.entries(KEY_PAIRS).map(([name, value]) => [`KEY PAIRS ${name}`, value] as [string, Box]),
  ...Object.entries(COMBINING).map(([name, value]) => [`COMBINING ${name}`, value] as [string, Box]),
  ...Object.entries(MIX_UPS).map(([name, value]) => [`MIX-UPS ${name}`, value] as [string, Box]),
  ...Object.entries(RECAP).map(([name, value]) => [`RECAP ${name}`, value] as [string, Box]),
];

const groups: Array<[string, Box[]]> = [
  ['INTRO', Object.values(INTRO)],
  ['PROBLEM sequence', [PROBLEM.sequence]],
  ['PROBLEM cards', [PROBLEM.sequence, PROBLEM.format, PROBLEM.secrecy, PROBLEM.integrity, PROBLEM.authenticity]],
  [
    'ENCODING',
    [
      MESSAGE,
      ENCODING.keySlot,
      ENCODING.hex,
      ENCODING.url,
      ENCODING.utf8,
      ENCODING.code,
      ENCODING.arrow,
      ENCODING.decoded,
      ENCODING.stamp,
    ],
  ],
  ['HASHING machine', [MESSAGE, HASHING.machine, HASHING.fingerprint]],
  ['HASHING one-way', [MESSAGE, HASHING.fingerprint, HASHING.oneWay]],
  ['HASHING avalanche', [MESSAGE, HASHING.avalanche, HASHING.usedFor, HASHING.oneWay]],
  [
    'HASHING tamper',
    [MESSAGE, HASHING.tamperEdit, HASHING.hashOriginal, HASHING.hashRecomputed, HASHING.match, HASHING.noOrigin],
  ],
  ['SIGNING shared key', [MESSAGE, SIGNING.keyRow, SIGNING.machine, SIGNING.tagRow]],
  ['SIGNING tamper', [MESSAGE, SIGNING.tamper, SIGNING.machine, SIGNING.tagRow, SIGNING.invalid]],
  [
    'SIGNING digital signature',
    [
      MESSAGE,
      SIGNING.signature,
      SIGNING.privateCard,
      SIGNING.publicCard,
      SIGNING.valid,
      SIGNING.invalidSignature,
      SIGNING.uses,
    ],
  ],
  [
    'ENCRYPTION symmetric',
    [
      MESSAGE,
      ENCRYPTION.lock,
      ENCRYPTION.nonce,
      ENCRYPTION.machine,
      ENCRYPTION.eavesdrop,
      ENCRYPTION.keyRow,
      ENCRYPTION.authFailed,
    ],
  ],
  ['ENCRYPTION question', [MESSAGE, ENCRYPTION.question]],
  ['KEY PAIRS hand-out', [MESSAGE, KEY_PAIRS.keyPair, KEY_PAIRS.alice, KEY_PAIRS.eve]],
  [
    'KEY PAIRS encrypt and decrypt',
    [MESSAGE, KEY_PAIRS.aliceCard, KEY_PAIRS.cipherChip, KEY_PAIRS.illustrative, KEY_PAIRS.bankCard],
  ],
  ['KEY PAIRS roles', [MESSAGE, KEY_PAIRS.rolesTable]],
  ['KEY PAIRS hybrid', [MESSAGE, KEY_PAIRS.hybrid]],
  ['COMBINING', [COMBINING.table, COMBINING.aes]],
  ['MIX-UPS', Object.values(MIX_UPS)],
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
