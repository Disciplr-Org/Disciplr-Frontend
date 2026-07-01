/**
 * windowRange – lightweight virtual-list math helper.
 *
 * Windowing is only engaged when the list length exceeds WINDOW_THRESHOLD.
 * Below that threshold the full list is returned unchanged so small lists
 * incur zero overhead.
 *
 * WINDOW_THRESHOLD – minimum row count before windowing is active (50).
 * WINDOW_SIZE      – maximum rows rendered at one time when windowing is on (40).
 */

export const WINDOW_THRESHOLD = 50;
export const WINDOW_SIZE = 40;

export interface WindowResult<T> {
  /** Slice of items that should be rendered. */
  items: T[];
  /** Index of the first rendered item in the source array. */
  startIndex: number;
  /** Index one past the last rendered item in the source array. */
  endIndex: number;
  /** True when the source list exceeds WINDOW_THRESHOLD. */
  windowed: boolean;
}

/**
 * Returns the visible slice of `items` centred around `anchorIndex`.
 *
 * @param items       Full sorted/filtered array.
 * @param anchorIndex First item that must be visible (e.g. scroll-top row). Defaults to 0.
 * @param windowSize  Override for the number of rows to render. Defaults to WINDOW_SIZE.
 */
export function windowRange<T>(
  items: T[],
  anchorIndex = 0,
  windowSize = WINDOW_SIZE,
): WindowResult<T> {
  const total = items.length;

  if (total <= WINDOW_THRESHOLD) {
    return { items, startIndex: 0, endIndex: total, windowed: false };
  }

  const size = Math.max(1, windowSize);
  const start = Math.min(Math.max(0, anchorIndex), Math.max(0, total - size));
  const end = Math.min(start + size, total);

  return { items: items.slice(start, end), startIndex: start, endIndex: end, windowed: true };
}
