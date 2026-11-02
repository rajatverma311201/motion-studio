import assert from 'node:assert/strict';
import {test} from 'node:test';
import {HOOK, PARTS, READABLE, SHORT, SIGNATURE, TAMPER, TAKEAWAY, ZONES, type Box} from './layout';

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
  ['HOOK strip', HOOK.strip],
  ['HOOK JWT chip', HOOK.jwtChip],
  ['HOOK full-name chip', HOOK.fullNameChip],
  ['PARTS strip', PARTS.strip],
  ['PARTS header chip', PARTS.header],
  ['PARTS payload chip', PARTS.payload],
  ['PARTS signature chip', PARTS.signature],
  ['READABLE strip', READABLE.strip],
  ['READABLE header card', READABLE.headerCard],
  ['READABLE payload card', READABLE.payloadCard],
  ['READABLE Base64URL label', READABLE.base64Label],
  ['READABLE stamp', READABLE.stamp],
  ['SIGNATURE machine', SIGNATURE.machine],
  ['TAMPER strip', TAMPER.strip],
  ['TAMPER payload card', TAMPER.payloadCard],
  ['TAMPER machine', TAMPER.machine],
  ['TAMPER original chip', TAMPER.originalChip],
  ['TAMPER new chip', TAMPER.newChip],
  ['TAMPER stamp', TAMPER.stamp],
  ['TAKEAWAY signed chip', TAKEAWAY.signed],
  ['TAKEAWAY no-passwords chip', TAKEAWAY.noPasswords],
  ['TAKEAWAY channel chip', TAKEAWAY.channel],
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

test('the two JSON cards do not overlap', () => {
  assert.ok(!intersects(bounds(READABLE.headerCard), bounds(READABLE.payloadCard)));
});

test('the TAMPER comparison chips do not overlap', () => {
  assert.ok(!intersects(bounds(TAMPER.originalChip), bounds(TAMPER.newChip)));
});
