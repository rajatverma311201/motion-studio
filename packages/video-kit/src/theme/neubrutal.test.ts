import {describe, expect, it} from 'vitest';
import {colors} from './colors';
import {formatNumber, neubrutal} from './neubrutal';

describe('formatNumber', () => {
  it('rounds and inserts thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
});

describe('neubrutal', () => {
  it('returns a light border and a hard offset shadow', () => {
    const props = neubrutal('#fff', 8, 4);
    expect(props.shadowOffset).toEqual([8, 8]);
    expect(props.lineWidth).toBe(4);
    expect(props.stroke).toBe(colors.ink);
  });
});
