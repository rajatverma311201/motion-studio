import {describe, expect, it} from 'vitest';
import {pillRow} from './pill-row';

const JWT_PILLS = {startX: 290, step: 60, width: 30, activeWidth: 64};
const TEN_PILLS = {startX: 290, step: 60, width: 30, activeWidth: 64};
const SECTION_CHIP = {left: -560, right: -140, top: -512, bottom: -472};

describe('pillRow', () => {
  it('reproduces the legacy right-aligned row for nine chapters', () => {
    expect(pillRow(9).map(pill => pill.x)).toEqual([581, 619, 657, 695, 733, 771, 809, 847, 885]);
  });

  it('keeps eleven JWT pills inside the top bar and apart from each other', () => {
    const pills = pillRow(11, JWT_PILLS);

    expect(pills).toHaveLength(11);
    for (const pill of pills) {
      expect(pill.x - pill.activeWidth / 2).toBeGreaterThanOrEqual(-930);
      expect(pill.x + pill.activeWidth / 2).toBeLessThanOrEqual(930);
    }

    for (let i = 1; i < pills.length; i++) {
      const previous = pills[i - 1];
      const current = pills[i];
      expect(current.x - previous.x).toBeGreaterThan((previous.activeWidth + current.width) / 2);
    }
  });

  it('keeps the pill row clear of the section chip', () => {
    const pills = pillRow(11, JWT_PILLS);
    const first = pills[0];

    expect(first.x - first.activeWidth / 2).toBeGreaterThan(SECTION_CHIP.right);
  });

  it('keeps ten pills inside the top bar and apart from each other', () => {
    const pills = pillRow(10, TEN_PILLS);

    expect(pills).toHaveLength(10);
    for (const pill of pills) {
      expect(pill.x - pill.activeWidth / 2).toBeGreaterThanOrEqual(-930);
      expect(pill.x + pill.activeWidth / 2).toBeLessThanOrEqual(930);
    }

    for (let i = 1; i < pills.length; i++) {
      const previous = pills[i - 1];
      const current = pills[i];
      expect(current.x - previous.x).toBeGreaterThan((previous.activeWidth + current.width) / 2);
    }
    expect(pills[0].x - pills[0].activeWidth / 2).toBeGreaterThan(SECTION_CHIP.right);
  });
});
