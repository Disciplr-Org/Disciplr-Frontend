import { describe, it, expect } from 'vitest';
import { fuzzyMatch } from '../commandPalette';

describe('fuzzyMatch', () => {
  it('returns true for an empty query', () => {
    expect(fuzzyMatch('', 'any value')).toBe(true);
    expect(fuzzyMatch('   ', 'any value')).toBe(true);
  });

  it('returns true when query is a true subsequence of the value', () => {
    expect(fuzzyMatch('abc', 'a b c')).toBe(true);
    expect(fuzzyMatch('cmd', 'command')).toBe(true);
    expect(fuzzyMatch('pal', 'palette')).toBe(true);
  });

  it('returns false when characters are out of order', () => {
    expect(fuzzyMatch('acb', 'a b c')).toBe(false);
    expect(fuzzyMatch('dmo', 'domain')).toBe(false);
  });

  it('performs mixed-case matching', () => {
    expect(fuzzyMatch('CoM', 'Command')).toBe(true);
    expect(fuzzyMatch('cmd', 'CoMmAnD')).toBe(true);
    expect(fuzzyMatch('PALETTE', 'palette')).toBe(true);
  });

  it('returns false when query is longer than the value', () => {
    expect(fuzzyMatch('longerquery', 'short')).toBe(false);
  });

  it('handles partial matches that do not complete correctly', () => {
    expect(fuzzyMatch('abc', 'ab')).toBe(false);
  });
});
