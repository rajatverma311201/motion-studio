import {describe, expect, it} from 'vitest';
import {resolveProjectName} from './project-name';

describe('resolveProjectName', () => {
  it('keeps the plain slug for the default look', () => {
    expect(resolveProjectName('db-indexing')).toBe('db-indexing');
    expect(resolveProjectName('db-indexing', {theme: 'neubrutal', mode: 'dark'})).toBe('db-indexing');
  });

  it('adds the theme and the resolved mode otherwise', () => {
    expect(resolveProjectName('db-indexing', {theme: 'tokyo-night', mode: 'light'})).toBe(
      'db-indexing--tokyo-night--light',
    );
  });

  it("uses the theme's defaultMode when the lesson only sets a theme", () => {
    expect(resolveProjectName('theme-showcase', {theme: 'paper-editorial'})).toBe(
      'theme-showcase--paper-editorial--light',
    );
  });

  it('ignores an unknown lesson theme', () => {
    expect(resolveProjectName('db-indexing', {theme: 'does-not-exist'})).toBe('db-indexing');
  });
});
