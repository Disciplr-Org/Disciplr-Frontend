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
    expect(isCriteriaGateOpen(undefined, new Set([0, 1, 2]))).toBe(true);
  });

  it('returns true when criteria is empty array and checked set has entries', () => {
    expect(isCriteriaGateOpen([], new Set([0]))).toBe(true);
  });

  it('returns false when no criteria are checked', () => {
    expect(isCriteriaGateOpen(['A', 'B'], new Set())).toBe(false);
  });

  it('returns false when only some criteria are checked', () => {
    expect(isCriteriaGateOpen(['A', 'B', 'C'], new Set([0, 1]))).toBe(false);
  });

  it('returns true when all criteria are checked', () => {
    expect(isCriteriaGateOpen(['A', 'B'], new Set([0, 1]))).toBe(true);
  });

  it('returns true for a single criterion that is checked', () => {
    expect(isCriteriaGateOpen(['A'], new Set([0]))).toBe(true);
  });

  it('returns false for a single criterion that is unchecked', () => {
    expect(isCriteriaGateOpen(['A'], new Set())).toBe(false);
  });

  describe('off-by-one boundary behaviour', () => {
    it('returns false when checked count is one less than criteria length (n-1)', () => {
      const criteria = ['A', 'B', 'C', 'D'];
      expect(isCriteriaGateOpen(criteria, new Set([0, 1, 2]))).toBe(false);
    });

    it('returns true when checked count equals criteria length exactly (n)', () => {
      const criteria = ['A', 'B', 'C', 'D'];
      expect(isCriteriaGateOpen(criteria, new Set([0, 1, 2, 3]))).toBe(true);
    });

    it('returns true when checked count is one more than criteria length via out-of-range index (n+1 size)', () => {
      // Set has size 3, criteria has length 2 — gate stays closed (sizes differ)
      const criteria = ['A', 'B'];
      expect(isCriteriaGateOpen(criteria, new Set([0, 1, 99]))).toBe(false);
    });
  });

  describe('out-of-range index handling', () => {
    it('returns true when checked set contains only out-of-range indices matching criteria count (size-equality)', () => {
      // isCriteriaGateOpen uses size equality, not membership checking.
      // Set([5, 10]).size === ['A', 'B'].length → true even though indices are out-of-range.
      expect(isCriteriaGateOpen(['A', 'B'], new Set([5, 10]))).toBe(true);
    });

    it('returns false when checked set has fewer out-of-range entries than criteria length', () => {
      // Only one out-of-range index; size (1) < criteria.length (2)
      expect(isCriteriaGateOpen(['A', 'B'], new Set([99]))).toBe(false);
    });

    it('returns false when a superset of valid indices is provided (more entries than criteria)', () => {
      const criteria = ['A', 'B'];
      expect(isCriteriaGateOpen(criteria, new Set([0, 1, 2, 3]))).toBe(false);
    });
  });

  describe('duplicate index handling via Set deduplication', () => {
    it('Set deduplicates indices so duplicate entries do not inflate count', () => {
      // Constructing Set([0, 0, 1]) produces size 2, not 3
      const deduped = new Set([0, 0, 1]);
      expect(deduped.size).toBe(2);
      expect(isCriteriaGateOpen(['A', 'B'], deduped)).toBe(true);
    });

    it('returns false when duplicated index would otherwise suggest full coverage', () => {
      // Only index 0 is repeated; Set size remains 1 — one short for two criteria
      const deduped = new Set([0, 0]);
      expect(isCriteriaGateOpen(['A', 'B'], deduped)).toBe(false);
    });
  });

  describe('size-equality logic (asserts count, not membership)', () => {
    it('relies on size equality: same count as criteria returns true regardless of index values', () => {
      // Two out-of-range indices happen to match criteria.length of 2
      // Documents that the gate uses size equality, not membership checking
      const criteria = ['A', 'B'];
      const checked = new Set([100, 200]);
      // size (2) === criteria.length (2) → true
      expect(isCriteriaGateOpen(criteria, checked)).toBe(true);
    });

    it('returns false when size is less than criteria length regardless of index values', () => {
      expect(isCriteriaGateOpen(['A', 'B', 'C'], new Set([100, 200]))).toBe(false);
    });

    it('returns false when size is greater than criteria length regardless of index values', () => {
      expect(isCriteriaGateOpen(['A', 'B'], new Set([0, 1, 2]))).toBe(false);
    });
  });

  describe('larger criteria arrays', () => {
    it('returns false for a large criteria array with no checks', () => {
      const criteria = Array.from({ length: 10 }, (_, i) => `criterion-${i}`);
      expect(isCriteriaGateOpen(criteria, new Set())).toBe(false);
    });

    it('returns false for a large criteria array checked one short', () => {
      const criteria = Array.from({ length: 10 }, (_, i) => `criterion-${i}`);
      const checked = new Set(Array.from({ length: 9 }, (_, i) => i));
      expect(isCriteriaGateOpen(criteria, checked)).toBe(false);
    });

    it('returns true for a large criteria array with exactly all indices checked', () => {
      const criteria = Array.from({ length: 10 }, (_, i) => `criterion-${i}`);
      const checked = new Set(Array.from({ length: 10 }, (_, i) => i));
      expect(isCriteriaGateOpen(criteria, checked)).toBe(true);
    });
  });
});
