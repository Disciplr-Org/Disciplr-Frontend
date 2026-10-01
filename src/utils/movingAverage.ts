/**
 * movingAverage.ts
 *
 * Pure, deterministic trailing moving-average utility.
 */

/**
 * Compute a trailing moving average over a numeric series.
 *
 * For each index i the average is taken over the window
 * [max(0, i - window + 1), i] (inclusive), so partial windows are used
 * at the start of the series rather than returning null/undefined.
 *
 * Edge cases:
 * - Empty series → returns [].
 * - window ≤ 0 → treated as window = 1 (identity).
 * - window > series length → partial window used for all points.
 *
 * @param values - Input numeric series.
 * @param window - Number of data points to include in the trailing window.
 * @returns Array of the same length as `values` with smoothed values.
 */
export function movingAverage(values: number[], window: number): number[] {
  if (values.length === 0) return [];
  const w = Math.max(1, window);
  return values.map((_, i) => {
    const start = Math.max(0, i - w + 1);
    const slice = values.slice(start, i + 1);
    return slice.reduce((sum, v) => sum + v, 0) / slice.length;
  });
}
