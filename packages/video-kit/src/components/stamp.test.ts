import {describe, expect, it, vi} from 'vitest';

vi.mock('@motion-canvas/2d', () => {
  class MockNode {
    readonly props: Record<string, unknown>;
    readonly children: MockNode[];

    constructor(props: Record<string, unknown> = {}) {
      const {children, ...rest} = props;
      this.props = rest;
      this.children = Array.isArray(children) ? children.flat() : children ? [children as MockNode] : [];
    }
  }

  return {
    Rect: (props: Record<string, unknown>) => new MockNode(props),
    Txt: (props: Record<string, unknown>) => new MockNode(props),
  };
});

import {colors} from '../theme';
import {stamp} from './stamp';

interface MockNode {
  props: Record<string, unknown>;
  children: MockNode[];
}

const asMock = (node: unknown): MockNode => node as MockNode;

describe('stamp', () => {
  it('returns exactly one label root with one ring and one text', () => {
    const mark = asMock(stamp('MATCH', colors.lime, {rot: -4, fs: 26}));

    expect(mark.children).toHaveLength(1);
    const ring = mark.children[0];
    expect(ring.children).toHaveLength(1);
    expect(ring.children[0].props.text).toBe('MATCH');
  });

  it('has no shadow, which Motion Canvas would draw as a second offset label', () => {
    const mark = asMock(stamp('INVALID', colors.red));

    expect(mark.props).not.toHaveProperty('shadowColor');
    expect(mark.props).not.toHaveProperty('shadowBlur');
    expect(mark.props).not.toHaveProperty('shadowOffset');
  });

  it('keeps both outlines in the supplied colour', () => {
    const mark = asMock(stamp('INVALID', colors.red));

    expect(mark.props.stroke).toBe(colors.red);
    expect(mark.children[0].props.stroke).toBe(colors.red);
  });
});
