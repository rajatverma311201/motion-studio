import {describe, expect, it} from 'vitest';
import {seededRandom} from '../animation';
import {base64Alphabet, base64Steps, toUrlSafe} from './base64-steps';

describe('base64Steps', () => {
  it('walks Man through bytes, bits, six-bit groups, indices and chars', () => {
    const steps = base64Steps('Man');

    expect(steps.bytes).toEqual([77, 97, 110]);
    expect(steps.bits).toEqual(['01001101', '01100001', '01101110']);
    expect(steps.groups).toEqual(['010011', '010110', '000101', '101110']);
    expect(steps.indices).toEqual([19, 22, 5, 46]);
    expect(steps.chars).toEqual(['T', 'W', 'F', 'u']);
    expect(steps.padding).toBe(0);
    expect(steps.chars.join('')).toBe('TWFu');
  });

  it('adds one = for two bytes and two = for one byte', () => {
    expect(base64Steps('Ma').chars.join('')).toBe('TWE=');
    expect(base64Steps('Ma').padding).toBe(1);
    expect(base64Steps('M').chars.join('')).toBe('TQ==');
    expect(base64Steps('M').padding).toBe(2);
  });

  it('matches Node for 100 seeded random ASCII strings', () => {
    const random = seededRandom(42);
    const alphabet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

    for (let i = 0; i < 100; i++) {
      const length = 1 + Math.floor(random() * 24);
      let input = '';
      for (let j = 0; j < length; j++) {
        input += alphabet[Math.floor(random() * alphabet.length)];
      }
      expect(base64Steps(input).chars.join(''), JSON.stringify(input)).toBe(Buffer.from(input).toString('base64'));
    }
  });

  it('exposes the standard alphabet in index order', () => {
    expect(base64Alphabet).toHaveLength(64);
    expect(base64Alphabet[19]).toBe('T');
    expect(base64Alphabet[22]).toBe('W');
    expect(base64Alphabet[5]).toBe('F');
    expect(base64Alphabet[46]).toBe('u');
  });
});

describe('toUrlSafe', () => {
  it('swaps + and /, and drops padding', () => {
    expect(toUrlSafe('a+b/c==')).toBe('a-b_c');
    expect(toUrlSafe('TWFu')).toBe('TWFu');
  });
});
