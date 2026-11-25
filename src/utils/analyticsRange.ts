/**
 * analyticsRange.ts
 *
 * Pure helpers that guard the Analytics page against invalid and duplicate
 * range inputs. Kept out of the page component so they can be reused and
 * tested without rendering.
 *
 * Time-of-day note: `from` and `to` are parsed with `new Date(string)`. A
 * date-only string such as "2025-01-01" is interpreted as UTC midnight, while
 * a date-time string without an offset is interpreted in the local timezone.
 * Because of this, `validateCustomRange` compares the parsed instants as-is:
 * a same-day range ("2025-01-01" to "2025-01-01") yields from === to and is
 * considered valid. Callers that need an inclusive end-of-day bound should
 * pass an explicit time (e.g. "2025-01-01T23:59:59Z") for `to`.
 */

/** Validate a custom date range. Returns null when the range is not usable. */
export function validateCustomRange(from: string, to: string): { from: Date; to: Date } | null {
  if (!from || !to) return null
  const f = new Date(from)
  const t = new Date(to)
  if (isNaN(f.getTime()) || isNaN(t.getTime())) return null
  if (f > t) return null
  return { from: f, to: t }
}

/** Deduplicate a series by `name`, keeping the last occurrence (latest wins). */
export function dedupeByName<T extends { name: string }>(rows: T[]): T[] {
  const seen = new Map<string, T>()
  for (const row of rows) seen.set(row.name, row)
  return Array.from(seen.values())
}
