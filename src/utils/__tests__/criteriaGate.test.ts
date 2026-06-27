import { describe, it, expect } from 'vitest';
import { isCriteriaGateOpen } from '../criteriaGate';

describe('isCriteriaGateOpen', () => {
  it('returns true when criteria is undefined', () => {
    expect(isCriteriaGateOpen(undefined, new Set())).toBe(true);
  });

  it('returns true when criteria is empty array', () => {
    expect(isCriteriaGateOpen([], new Set())).toBe(true);
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
});
