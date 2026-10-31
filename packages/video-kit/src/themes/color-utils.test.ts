import {describe, expect, it} from 'vitest';
import {contrastRatio, mix, parseColor, withAlpha} from './color-utils';

describe('parseColor', () => {
  it('parses short and long hex', () => {
    expect(parseColor('#fff')).toEqual({r: 255, g: 255, b: 255, a: 1});
    expect(parseColor('#C6FF3D')).toEqual({r: 198, g: 255, b: 61, a: 1});
  });

  it('parses rgb and rgba', () => {
    expect(parseColor('rgb(1,2,3)')).toEqual({r: 1, g: 2, b: 3, a: 1});
    expect(parseColor('rgba(1,2,3,0.4)')).toEqual({r: 1, g: 2, b: 3, a: 0.4});
  });

  it('throws on an unsupported string', () => {
    expect(() => parseColor('chartreuse')).toThrow(/Unsupported colour/);
  });
});

describe('withAlpha', () => {
  it('returns the exact rgba string', () => {
    expect(withAlpha('#C6FF3D', 0.35)).toBe('rgba(198,255,61,0.35)');
  });

  it('replaces the alpha of an rgba input', () => {
    expect(withAlpha('rgba(10,20,30,0.2)', 0.4)).toBe('rgba(10,20,30,0.4)');
  });
});

describe('mix', () => {
  it('returns the endpoints and the midpoint', () => {
    expect(mix('#000000', '#FFFFFF', 0)).toBe('rgba(0,0,0,1)');
    expect(mix('#000000', '#FFFFFF', 1)).toBe('rgba(255,255,255,1)');
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('rgba(128,128,128,1)');
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });

  it('is 1 for identical colours', () => {
    expect(contrastRatio('#123456', '#123456')).toBe(1);
  });
});
