import assert from 'node:assert/strict';
import {test} from 'node:test';
import {shortenMiddle} from './shorten';

test('leaves a short value unchanged', () => {
  assert.equal(shortenMiddle('P-256'), 'P-256');
});

test('keeps both ends and stays within the limit', () => {
  const value = 'WRR3bHcwYTyipkGWeG6mEMux-SCDDSU2z_vkrDWFDqU';
  const short = shortenMiddle(value, 18);

  assert.equal(short.length, 18);
  assert.ok(short.includes('…'));
  assert.ok(short.startsWith(value.slice(0, 9)));
  assert.ok(short.endsWith(value.slice(-8)));
});

test('handles an even limit', () => {
  const short = shortenMiddle('abcdefghijklmnopqrstuvwxyz', 10);
  assert.equal(short, 'abcde…wxyz');
});
