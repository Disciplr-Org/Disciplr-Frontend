import { describe, expect, it } from 'vitest';
import {
  CRITICAL_DEADLINE_MS,
  SOON_DEADLINE_MS,
  deadlineUrgency,
} from '../deadlineUrgency';

const now = new Date('2026-06-18T12:00:00Z');

function deadlineAfter(ms: number) {
  return new Date(now.getTime() + ms).toISOString();
}

describe('deadlineUrgency', () => {
  it('classifies deadlines beyond the seven-day threshold as safe', () => {
    expect(deadlineUrgency(deadlineAfter(SOON_DEADLINE_MS + 1), now)).toBe('safe');
  });

  it('classifies the seven-day boundary through more than twenty-four hours as soon', () => {
    expect(deadlineUrgency(deadlineAfter(SOON_DEADLINE_MS), now)).toBe('soon');
    expect(deadlineUrgency(deadlineAfter(CRITICAL_DEADLINE_MS + 1), now)).toBe('soon');
  });

  it('classifies the twenty-four-hour boundary, past-due, and invalid deadlines as critical', () => {
    expect(deadlineUrgency(deadlineAfter(CRITICAL_DEADLINE_MS), now)).toBe('critical');
    expect(deadlineUrgency(deadlineAfter(-1), now)).toBe('critical');
    expect(deadlineUrgency('not-a-date', now)).toBe('critical');
  });
});
