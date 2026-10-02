import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { ValidationTask } from '../../Zustand/Store';
import { comparePendingTasks, sortPending } from '../sortPending';

const task = (
  id: string,
  overrides: Partial<ValidationTask> = {},
): ValidationTask => ({
  id,
  vaultName: `Vault ${id}`,
  owner: '0xowner',
  amount: '1,000 USDC',
  deadline: '2026-07-01',
  status: 'pending',
  milestone: 'Milestone',
  ...overrides,
});

/**
 * Reference deadline sort key used only by the property tests below.
 *
 * Written independently from the production helper, but with the same
 * semantics: blank input is rejected up front and anything else is handed to
 * `Date.parse` untrimmed (`Date.parse` treats surrounding whitespace as
 * significant, so trimming here would not match the real key).
 */
const referenceDeadlineKey = (candidate: ValidationTask): number => {
  const raw = typeof candidate.deadline === 'string' ? candidate.deadline : '';
  if (raw.trim().length === 0) {
    return Number.MAX_SAFE_INTEGER;
  }

  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
};

describe('sortPending', () => {
  it('sorts deadlines ascending and descending', () => {
    const tasks = [
      task('later', { deadline: '2026-08-01' }),
      task('soon', { deadline: '2026-06-20' }),
      task('middle', { deadline: '2026-07-01' }),
    ];

    expect(sortPending(tasks, 'deadline', 'asc').map((t) => t.id)).toEqual([
      'soon',
      'middle',
      'later',
    ]);
    expect(sortPending(tasks, 'deadline', 'desc').map((t) => t.id)).toEqual([
      'later',
      'middle',
      'soon',
    ]);
  });

  it('parses numeric amounts with separators', () => {
    const tasks = [
      task('small', { amount: '500 USDC' }),
      task('large', { amount: '20,000 USDC' }),
      task('middle', { amount: '$1,250.50' }),
    ];

    expect(sortPending(tasks, 'amount', 'desc').map((t) => t.id)).toEqual([
      'large',
      'middle',
      'small',
    ]);
  });

  it('sorts vault names case-insensitively', () => {
    const tasks = [
      task('c', { vaultName: 'zeta Vault' }),
      task('a', { vaultName: 'Alpha Vault' }),
      task('b', { vaultName: 'beta Vault' }),
    ];

    expect(sortPending(tasks, 'vaultName', 'asc').map((t) => t.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('preserves relative order for equal keys', () => {
    const tasks = [
      task('first', { amount: 'not available' }),
      task('second', { amount: 'pending' }),
      task('third', { amount: 'unknown' }),
    ];

    expect(sortPending(tasks, 'amount', 'asc').map((t) => t.id)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('handles empty lists', () => {
    expect(sortPending([], 'deadline', 'asc')).toEqual([]);
  });

  it('keeps unparseable deadlines after valid ones when sorting ascending', () => {
    const tasks = [
      task('unparseable', { deadline: 'not-a-date' }),
      task('later', { deadline: '2026-08-01' }),
      task('soon', { deadline: '2026-06-20' }),
      task('blank', { deadline: '   ' }),
    ];

    expect(sortPending(tasks, 'deadline', 'asc').map((t) => t.id)).toEqual([
      'soon',
      'later',
      'unparseable',
      'blank',
    ]);
  });

  it('keeps unparseable deadlines before valid ones when sorting descending', () => {
    const tasks = [
      task('unparseable', { deadline: 'not-a-date' }),
      task('later', { deadline: '2026-08-01' }),
      task('soon', { deadline: '2026-06-20' }),
      task('blank', { deadline: '   ' }),
    ];

    expect(sortPending(tasks, 'deadline', 'desc').map((t) => t.id)).toEqual([
      'unparseable',
      'blank',
      'later',
      'soon',
    ]);
  });

  it('treats blank and non-string deadlines as unparseable', () => {
    const tasks = [
      task('valid', { deadline: '2026-06-01' }),
      task('whitespace', { deadline: '  \t ' }),
      task('missing', { deadline: undefined as unknown as string }),
      task('wrongType', { deadline: 20260601 as unknown as string }),
    ];

    expect(sortPending(tasks, 'deadline', 'asc').map((t) => t.id)).toEqual([
      'valid',
      'whitespace',
      'missing',
      'wrongType',
    ]);
  });

  it('keeps input order among tasks whose deadlines are all unparseable', () => {
    const tasks = [
      task('first', { deadline: 'soon' }),
      task('second', { deadline: '-' }),
      task('third', { deadline: '31/02/2026' }),
    ];

    expect(sortPending(tasks, 'deadline', 'asc').map((t) => t.id)).toEqual([
      'first',
      'second',
      'third',
    ]);
    expect(sortPending(tasks, 'deadline', 'desc').map((t) => t.id)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  describe('sort key invariants', () => {
    const variantArb = fc.record({
      // Parseable deadlines, including whitespace-padded input: `Date.parse`
      // accepts it, so it must not be treated as unparseable.
      deadline: fc.oneof(
        fc.constantFrom('2026-06-20', '2026-07-01', '2026-08-01', '2026-12-31', ' 2026-06-20 '),
        fc.constantFrom('not-a-date', '', '   ', '31/02/2026', '2026-13-45'),
      ),
      amount: fc.constantFrom('1,000 USDC', '20,000 USDC', 'not available', ''),
      vaultName: fc.constantFrom('Alpha Vault', 'beta vault', 'Zeta', ''),
    });

    const tasksArb = fc
      .array(variantArb, { minLength: 1, maxLength: 25 })
      .map((variants) =>
        variants.map((variant, index) => task(`t-${index}`, variant)),
      );

    const pairArb = fc
      .tuple(variantArb, variantArb)
      .map(([left, right]) => [task('left', left), task('right', right)] as const);

    it('does not return NaN when both deadlines are unparseable', () => {
      const left = task('left', { deadline: 'not-a-date' });
      const right = task('right', { deadline: '   ' });

      expect(comparePendingTasks(left, right, 'deadline')).toBe(0);
    });

    it('keeps the amount comparator total when the difference overflows', () => {
      // Both amounts stay finite on their own, but subtracting them overflows
      // to Infinity, so only the sign may be kept.
      const overflowAmount = (sign: '' | '-') => `${sign}899${'0'.repeat(305)}`;
      const left = task('left', { amount: overflowAmount('') });
      const right = task('right', { amount: overflowAmount('-') });

      expect(comparePendingTasks(left, right, 'amount')).toBe(1);
      expect(comparePendingTasks(right, left, 'amount')).toBe(-1);
    });

    it('returns a finite comparator result for every pair and key', () => {
      fc.assert(
        fc.property(pairArb, ([left, right]) => {
          for (const key of ['deadline', 'amount', 'vaultName'] as const) {
            const compared = comparePendingTasks(left, right, key);

            expect(Number.isFinite(compared)).toBe(true);
            expect([-1, 0, 1]).toContain(compared);
          }
        }),
      );
    });

    it('is antisymmetric', () => {
      // `-0` and `0` describe the same ordering, so normalize the signed zero
      // before comparing (`toBe` uses `Object.is`, which distinguishes them).
      const normalize = (value: number) => (value === 0 ? 0 : value);

      fc.assert(
        fc.property(pairArb, ([left, right]) => {
          for (const key of ['deadline', 'amount', 'vaultName'] as const) {
            expect(normalize(comparePendingTasks(left, right, key))).toBe(
              normalize(-comparePendingTasks(right, left, key)),
            );
          }
        }),
      );
    });

    it('returns a permutation of the input tasks', () => {
      fc.assert(
        fc.property(tasksArb, (tasks) => {
          const actual = sortPending(tasks, 'deadline', 'asc').map((t) => t.id);
          const expected = tasks.map((t) => t.id);

          expect(actual.slice().sort()).toEqual(expected.slice().sort());
        }),
      );
    });

    it('never mutates the input array', () => {
      fc.assert(
        fc.property(tasksArb, (tasks) => {
          const snapshot = tasks.map((t) => t.id);

          sortPending(tasks, 'deadline', 'asc');
          sortPending(tasks, 'deadline', 'desc');

          expect(tasks.map((t) => t.id)).toEqual(snapshot);
        }),
      );
    });

    it('produces the same order when an already sorted queue is sorted again', () => {
      fc.assert(
        fc.property(tasksArb, (tasks) => {
          for (const dir of ['asc', 'desc'] as const) {
            const once = sortPending(tasks, 'deadline', dir).map((t) => t.id);
            const twice = sortPending(sortPending(tasks, 'deadline', dir), 'deadline', dir).map(
              (t) => t.id,
            );

            expect(twice).toEqual(once);
          }
        }),
      );
    });

    it('orders every adjacent pair by deadline, mixing valid and unparseable values', () => {
      fc.assert(
        fc.property(tasksArb, (tasks) => {
          for (const dir of ['asc', 'desc'] as const) {
            const sorted = sortPending(tasks, 'deadline', dir);

            for (let index = 1; index < sorted.length; index += 1) {
              const previous = referenceDeadlineKey(sorted[index - 1]);
              const current = referenceDeadlineKey(sorted[index]);

              expect(dir === 'asc' ? previous <= current : previous >= current).toBe(true);
            }
          }
        }),
      );
    });
  });
});
