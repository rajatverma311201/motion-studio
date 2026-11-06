import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ENCODING, ENCRYPTION, HOOK, SHORT, SIGNING, VERDICT, ZONES, type Box} from './layout';

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

const content: Array<[string, Box]> = [
  ['HOOK card', HOOK.card],
  ['HOOK encoding chip', HOOK.encoding],
  ['HOOK signing chip', HOOK.signing],
  ['HOOK encryption chip', HOOK.encryption],
  ['ENCODING card', ENCODING.card],
  ['ENCODING key slot', ENCODING.keySlot],
  ['ENCODING no-key chip', ENCODING.noKey],
  ['ENCODING stamp', ENCODING.stamp],
  ['SIGNING card', SIGNING.card],
  ['SIGNING machine', SIGNING.machine],
  ['SIGNING old tag', SIGNING.oldChip],
  ['SIGNING new tag', SIGNING.newChip],
  ['SIGNING stamp', SIGNING.stamp],
  ['ENCRYPTION lock', ENCRYPTION.lock],
  ['ENCRYPTION card', ENCRYPTION.card],
  ['ENCRYPTION eavesdrop chip', ENCRYPTION.eavesdrop],
  ['ENCRYPTION key icon', ENCRYPTION.keyIcon],
  ['ENCRYPTION key chip', ENCRYPTION.keyChip],
  ['ENCRYPTION stamp', ENCRYPTION.stamp],
  ['VERDICT encoding row', VERDICT.encoding],
  ['VERDICT signing row', VERDICT.signing],
  ['VERDICT encryption row', VERDICT.encryption],
  ['VERDICT AES chip', VERDICT.aes],
  ['VERDICT Base64 chip', VERDICT.base64],
];

const groups: Array<[string, Box[]]> = [
  ['HOOK', [HOOK.card, HOOK.encoding, HOOK.signing, HOOK.encryption]],
  ['ENCODING', [ENCODING.card, ENCODING.keySlot, ENCODING.noKey, ENCODING.stamp]],
  ['SIGNING', [SIGNING.card, SIGNING.machine, SIGNING.oldChip, SIGNING.newChip, SIGNING.stamp]],
  [
    'ENCRYPTION',
    [ENCRYPTION.lock, ENCRYPTION.card, ENCRYPTION.eavesdrop, ENCRYPTION.keyIcon, ENCRYPTION.keyChip, ENCRYPTION.stamp],
  ],
  ['VERDICT', [VERDICT.encoding, VERDICT.signing, VERDICT.encryption, VERDICT.aes, VERDICT.base64]],
];

test('the canvas is 1080 x 1920', () => {
  assert.deepEqual(SHORT, {w: 1080, h: 1920});
});

test('every content box stays inside the main zone', () => {
  for (const [name, item] of content) {
    assert.ok(inside(bounds(item), ZONES.main), `${name} leaves the main zone`);
  }
});

test('nothing runs into the Shorts UI', () => {
  for (const [name, item] of content) {
    const b = bounds(item);
    assert.ok(!intersects(b, ZONES.reservedBottom), `${name} enters the bottom app UI`);
    assert.ok(!intersects(b, ZONES.reservedCorner), `${name} enters the right action rail`);
  }
});

test('nothing runs into the caption zone', () => {
  for (const [name, item] of content) {
    assert.ok(!intersects(bounds(item), ZONES.caption), `${name} enters the caption zone`);
  }
});

test('boxes that share a chapter do not overlap', () => {
  for (const [chapter, boxes] of groups) {
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        assert.ok(!intersects(bounds(boxes[i]), bounds(boxes[j])), `${chapter} boxes ${i} and ${j} overlap`);
      }
    }
  }
});
