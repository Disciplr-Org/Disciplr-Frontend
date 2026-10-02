import type { ValidationTask } from '../Zustand/Store';

export type PendingSortKey = 'deadline' | 'amount' | 'vaultName';
export type SortDirection = 'asc' | 'desc';

const SORT_KEYS: readonly PendingSortKey[] = ['deadline', 'amount', 'vaultName'];

export const isSortKey = (value: unknown): value is PendingSortKey =>
  typeof value === 'string' && (SORT_KEYS as readonly string[]).includes(value);

export const isSortDirection = (value: unknown): value is SortDirection =>
  value === 'asc' || value === 'desc';

/**
 * Parse a human-readable amount string into a finite number.
 *
 * Invariants:
 * - Always returns a finite number (never NaN or Infinity) so comparisons
 *   remain deterministic and totally ordered.
 * - Negative values and thousands separators are honored.
 * - Unparseable input degrades to 0 rather than throwing, so sorting a
 *   partially malformed list never fails.
 */
const parseAmount = (amount: unknown): number => {
  if (typeof amount !== 'string') {
    return 0;
  }

  const normalized = amount.replace(/,/g, '').trim();
  if (normalized.length === 0) {
    return 0;
  }

  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return 0;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Sort key used for deadlines that cannot be parsed.
 *
 * This is a finite value rather than `Number.POSITIVE_INFINITY` so every
 * deadline key lives on a single comparable numeric scale. Mixing the two
 * made `Infinity - Infinity` evaluate to `NaN`, which is not a legal
 * comparator result. `Array.prototype.sort` coerces such a result to `+0`, so
 * the intended ordering happened to survive — but the comparator was not the
 * total order its own documented invariant promised.
 *
 * `Number.MAX_SAFE_INTEGER` sits above the largest value `Date.parse` can
 * return (the spec caps `TimeClip` at 8.64e15), so the sentinel can never
 * collide with a real timestamp.
 */
const UNPARSEABLE_DEADLINE = Number.MAX_SAFE_INTEGER;

/**
 * Compare two numeric sort keys as a total order.
 *
 * Invariants:
 * - Always returns -1, 0 or 1 — never `NaN` and never `Infinity`, so the
 *   deadline comparator stays total for every pair of tasks.
 * - Non-finite keys are normalized onto the same scale as finite ones, so a
 *   corrupt key can never produce an unordered or unstable comparison.
 */
const compareNumbers = (a: number, b: number): number => {
  const left = Number.isFinite(a) ? a : UNPARSEABLE_DEADLINE;
  const right = Number.isFinite(b) ? b : UNPARSEABLE_DEADLINE;

  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
};

/**
 * Parse a deadline into a comparable numeric timestamp.
 *
 * Invariants:
 * - Missing, blank or unparseable deadlines map to `UNPARSEABLE_DEADLINE`
 *   so they always sort last in ascending order (first in descending) and
 *   never disrupt valid entries.
 * - Always returns a finite number on the same scale as a parsed
 *   timestamp, so comparing two keys can never yield `NaN`.
 */
const parseDeadline = (task: ValidationTask): number => {
  const raw = task?.deadline;
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return UNPARSEABLE_DEADLINE;
  }

  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? timestamp : UNPARSEABLE_DEADLINE;
};

const normalizeVaultName = (task: ValidationTask): string =>
  typeof task?.vaultName === 'string' ? task.vaultName : '';

/**
 * Compare two pending validation tasks for a sort key.
 *
 * Exported so the ordering contract can be asserted directly instead of only
 * being inferred from `sortPending` output.
 *
 * Invariants:
 * - Always returns -1, 0 or 1 — never `NaN` and never `Infinity`, for every
 *   pair of tasks and every key, including malformed fields.
 * - Antisymmetric: `comparePendingTasks(a, b, key)` is the negation of
 *   `comparePendingTasks(b, a, key)` (up to the sign of a zero result,
 *   which carries no ordering information).
 * - Direction is deliberately not applied here; `sortPending` owns the sign
 *   so that ties can fall back to the original index for a stable sort.
 */
export const comparePendingTasks = (
  a: ValidationTask,
  b: ValidationTask,
  key: PendingSortKey,
): number => {
  switch (key) {
    case 'amount':
      // parseAmount always returns a finite number, so this subtraction is
      // already a total comparison and needs no sentinel handling. Only the
      // sign is kept, so every key returns -1, 0 or 1.
      return Math.sign(parseAmount(a?.amount) - parseAmount(b?.amount));
    case 'vaultName':
      return normalizeVaultName(a).localeCompare(normalizeVaultName(b), undefined, {
        sensitivity: 'base',
        numeric: true,
      });
    case 'deadline':
    default:
      return compareNumbers(parseDeadline(a), parseDeadline(b));
  }
};

/**
 * Deterministically sort pending validation tasks.
 *
 * Invariants:
 * - Pure and non-mutating: the input array and its elements are never mutated.
 * - Stable: tasks that compare equal retain their original relative order.
 * - Total ordering: comparators always return a finite number, never NaN.
 * - Fail-safe: malformed or missing fields degrade to deterministic defaults
 *   rather than throwing or producing an unstable order.
 * - Repeatable: identical inputs always produce identical outputs.
 */
export function sortPending(
  tasks: ValidationTask[],
  key: PendingSortKey,
  dir: SortDirection,
): ValidationTask {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }

  const safeKey: PendingSortKey = isSortKey(key) ? key : 'deadline';
  const direction = dir === 'desc' ? -1 : 1;

  return tasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const compared = comparePendingTasks(a.task, b.task, safeKey);
      // Stable tie-break on original index so equal keys never reorder.
      return compared === 0 ? a.index - b.index : compared * direction;
    })
    .map(({ task }) => task);
}
