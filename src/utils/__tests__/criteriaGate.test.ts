import { describe, it, expect } from 'vitest';
import { isCriteriaGateOpen } from '../criteriaGate';

describe('isCriteriaGateOpen', () => {
  it('returns true when criteria is undefined', () => {
    expect(isCriteriaGateOpen(undefined, new Set())).toBe(true);
  });

  it('returns true when criteria is empty array', () => {
    expect(isCriteriaGateOpen([], new Set())).toBe(true);
  });

  it('returns true when criteria is undefined and checked set has entries', () => {
    expect(isCriteriaGateOpen(undefined, new Set(['A', 'B', 'C']))).toBe(true);
  });

  it('returns true when criteria is empty array and checked set has entries', () => {
    expect(isCriteriaGateOpen([], new Set(['A']))).toBe(true);
  });

  it('returns false when no criteria are checked', () => {
    expect(isCriteriaGateOpen(['A', 'B'], new Set())).toBe(false);
  });

  it('returns false when only some criteria are checked', () => {
    expect(isCriteriaGateOpen(['A', 'B', 'C'], new Set(['A', 'B']))).toBe(false);
  });

  it('returns true when all criteria are checked', () => {
    expect(isCriteriaGateOpen(['A', 'B'], new Set(['A', 'B']))).toBe(true);
  });

  it('returns true for a single criterion that is checked', () => {
    expect(isCriteriaGateOpen(['A'], new Set(['A']))).toBe(true);
  });

  it('returns false for a single criterion that is unchecked', () => {
    expect(isCriteriaGateOpen(['A'], new Set())).toBe(false);
  });

  describe('off-by-one boundary behaviour', () => {
    it('returns false when checked count is one less than criteria length (n-1)', () => {
      const criteria = ['A', 'B', 'C', 'D'];
      expect(isCriteriaGateOpen(criteria, new Set(['A', 'B', 'C']))).toBe(false);
    });

    it('returns true when checked count equals criteria length exactly (n)', () => {
      const criteria = ['A', 'B', 'C', 'D'];
      expect(isCriteriaGateOpen(criteria, new Set(['A', 'B', 'C', 'D']))).toBe(true);
    });

    it('returns false when checked count is one more than criteria length (n+1 size)', () => {
      // Set has size 3, criteria has length 2 — gate stays closed (sizes differ)
      const criteria = ['A', 'B'];
      expect(isCriteriaGateOpen(criteria, new Set(['A', 'B', 'C']))).toBe(false);
    });
  });

  describe('unmatched criterion strings', () => {
    it('returns true when checked set contains criteria-identifying strings matching count (size-equality)', () => {
      // isCriteriaGateOpen uses size equality, not membership checking.
      // Set(['X', 'Y']).size === ['A', 'B'].length → true even though strings don't match.
      expect(isCriteriaGateOpen(['A', 'B'], new Set(['X', 'Y']))).toBe(true);
    });

    it('returns false when checked set has fewer unmatched entries than criteria length', () => {
      // Only one unmatched string; size (1) < criteria.length (2)
      expect(isCriteriaGateOpen(['A', 'B'], new Set(['X']))).toBe(false);
    });

    it('returns false when a superset of valid strings is provided (more entries than criteria)', () => {
      const criteria = ['A', 'B'];
      expect(isCriteriaGateOpen(criteria, new Set(['A', 'B', 'C', 'D']))).toBe(false);
    });
  });

  describe('duplicate string handling via Set deduplication', () => {
    it('Set deduplicates strings so duplicate entries do not inflate count', () => {
      // Constructing Set(['A', 'A', 'B']) produces size 2, not 3
      const deduped = new Set(['A', 'A', 'B']);
      expect(deduped.size).toBe(2);
      expect(isCriteriaGateOpen(['A', 'B'], deduped)).toBe(true);
    });

    it('returns false when duplicated string would otherwise suggest full coverage', () => {
      // Only 'A' is repeated; Set size remains 1 — one short for two criteria
      const deduped = new Set(['A', 'A']);
      expect(isCriteriaGateOpen(['A', 'B'], deduped)).toBe(false);
    });
  });

  describe('size-equality logic (asserts count, not membership)', () => {
    it('relies on size equality: same count as criteria returns true regardless of string values', () => {
      // Two unmatched strings happen to match criteria.length of 2
      // Documents that the gate uses size equality, not membership checking
      const criteria = ['A', 'B'];
      const checked = new Set(['X', 'Y']);
      // size (2) === criteria.length (2) → true
      expect(isCriteriaGateOpen(criteria, checked)).toBe(true);
    });

    it('returns false when size is less than criteria length regardless of string values', () => {
      expect(isCriteriaGateOpen(['A', 'B', 'C'], new Set(['X', 'Y']))).toBe(false);
    });

    it('returns false when size is greater than criteria length regardless of string values', () => {
      expect(isCriteriaGateOpen(['A', 'B'], new Set(['A', 'B', 'C']))).toBe(false);
    });
  });

  describe('larger criteria arrays', () => {
    it('returns false for a large criteria array with no checks', () => {
      const criteria = Array.from({ length: 10 }, (_, i) => `criterion-${i}`);
      expect(isCriteriaGateOpen(criteria, new Set())).toBe(false);
    });

    it('returns false for a large criteria array checked one short', () => {
      const criteria = Array.from({ length: 10 }, (_, i) => `criterion-${i}`);
      const checked = new Set(Array.from({ length: 9 }, (_, i) => `criterion-${i}`));
      expect(isCriteriaGateOpen(criteria, checked)).toBe(false);
    });

    it('returns true for a large criteria array with exactly all criteria checked', () => {
      const criteria = Array.from({ length: 10 }, (_, i) => `criterion-${i}`);
      const checked = new Set(Array.from({ length: 10 }, (_, i) => `criterion-${i}`));
      expect(isCriteriaGateOpen(criteria, checked)).toBe(true);
    });
  });

  describe('criteria reordering safety', () => {
    it('returns true with reversed criteria order when checked set contains the same strings', () => {
      // Verified that checked state is attached to criterion strings, not indices
      const criteria = ['B', 'A']; // reversed order
      const checked = new Set(['A', 'B']);
      expect(isCriteriaGateOpen(criteria, checked)).toBe(true);
    });
  });
});
