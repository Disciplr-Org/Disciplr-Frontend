# windowRange — Virtualization Helper

This document covers `src/utils/windowRange.ts`: what it does, what every
exported constant and field means, when windowing engages, how anchor clamping
works, and how to tune the thresholds for different row heights.

---

## 1. Purpose

`windowRange` is a **pure, synchronous math helper** that slices a sorted or
filtered array down to the rows that need to be rendered. It has no DOM
dependency and no side-effects — it takes an array and returns a plain object
describing the visible slice.

> **Design intent:** small lists below the threshold are returned as-is with
> zero allocation overhead. Windowing only kicks in when the list is large
> enough that rendering every row would hurt frame rate.

---

## 2. Exported Constants

```ts
export const WINDOW_THRESHOLD = 50;   // lines 12–13 of windowRange.ts
export const WINDOW_SIZE      = 40;
```

| Constant | Value | Meaning |
|---|---|---|
| `WINDOW_THRESHOLD` | `50` | **Minimum row count** before windowing is activated. Arrays of ≤ 50 items are returned in full with `windowed: false`. |
| `WINDOW_SIZE` | `40` | **Maximum rows rendered at one time** when windowing is active. The returned slice contains at most this many items. |

Both constants are exported so consumers can:

- Import and reference them in conditional UI (e.g. show a "showing N of M
  rows" banner only when `windowed` is `true`).
- Use them in tests without hard-coding magic numbers.

---

## 3. `WindowResult` Fields

```ts
export interface WindowResult {
  items:      unknown[];   // Slice of items that should be rendered
  startIndex: number;      // Index of the first rendered item in the source array
  endIndex:   number;      // Index one past the last rendered item (exclusive)
  windowed:   boolean;     // True when the source list exceeds WINDOW_THRESHOLD
}
```

| Field | Type | Meaning |
|---|---|---|
| `items` | `T[]` | The rendered slice. **Same reference** as the input array when `windowed` is `false`; a new `Array.slice` when `windowed` is `true`. |
| `startIndex` | `number` | Zero-based index of `items[0]` in the original array. Always `0` when `windowed` is `false`. |
| `endIndex` | `number` | **Exclusive** upper bound. `items === source.slice(startIndex, endIndex)`. Equals `source.length` when `windowed` is `false`. |
| `windowed` | `boolean` | `false` → full list returned; `true` → windowing is active and only a subset of rows is rendered. |

### Why `endIndex` is exclusive

`endIndex` follows the same convention as `Array.slice` and `Array.from`
index ranges, making it straightforward to render a "Showing rows
{startIndex + 1}–{endIndex} of {total}" label without any off-by-one
arithmetic.

---

## 4. Function Signature

```ts
export function windowRange<T>(
  items:      T[],
  anchorIndex = 0,
  windowSize  = WINDOW_SIZE,
): WindowResult & { items: T[] }
```

| Parameter | Default | Description |
|---|---|---|
| `items` | *(required)* | Full sorted/filtered source array. |
| `anchorIndex` | `0` | Index of the first row that must appear in the rendered slice (e.g. the scroll-top row or the row the user navigated to). |
| `windowSize` | `WINDOW_SIZE` (40) | Override for the number of rows to render. Clamped to a minimum of `1` internally (`Math.max(1, windowSize)`). |

---

## 5. Behaviour

### 5.1 Pass-through below the threshold

```ts
if (total <= WINDOW_THRESHOLD) {
  return { items, startIndex: 0, endIndex: total, windowed: false };
}
```

When `items.length` is **at or below** `WINDOW_THRESHOLD`:

- The **original array reference** is returned as `items` — no allocation.
- `startIndex` is `0`, `endIndex` is `items.length`.
- `windowed` is `false`.

This means **0 items, 1 item, …, 50 items** all pass through unchanged.
Windowing first activates at **51 items** (`WINDOW_THRESHOLD + 1`).

### 5.2 Windowing above the threshold

```ts
const size  = Math.max(1, windowSize);
const start = Math.min(Math.max(0, anchorIndex), Math.max(0, total - size));
const end   = Math.min(start + size, total);

return { items: items.slice(start, end), startIndex: start, endIndex: end, windowed: true };
```

**Step-by-step:**

1. **`size`** — clamp `windowSize` to at least `1` so an invalid override
   (e.g. `0` or negative) still renders something.
2. **`start`** — clamp `anchorIndex` into `[0, total - size]`:
   - `Math.max(0, anchorIndex)` prevents negative indices.
   - `Math.min(..., total - size)` prevents the window from starting so close
     to the end that it would underflow (no room for `size` rows).
3. **`end`** — `start + size`, capped at `total` to avoid overrunning the
   array.
4. Return a **new slice** (`items.slice(start, end)`); `windowed` is `true`.

### 5.3 Anchor clamping examples

| `total` | `anchorIndex` | `size` | `start` (computed) | `end` |
|---|---|---|---|---|
| 100 | 0 | 40 | 0 | 40 |
| 100 | 30 | 40 | 30 | 70 |
| 100 | 90 | 40 | **60** (clamped from 90) | 100 |
| 100 | 9999 | 40 | 60 (clamped) | 100 |
| 100 | -5 | 40 | **0** (clamped) | 40 |
| 100 | 0 | 0 | 0 | **1** (size clamped to 1) |

The clamp at `total - size` is what prevents the tail of the list from
rendering fewer than `size` rows — when you scroll near the end, the window
shifts backward so a full page of rows is always visible.

---

## 6. How `VaultTransactions` Uses It

`windowRange` is applied **per status section** (Pending / Failed / Confirmed)
rather than to the entire filtered list:

```ts
// src/pages/VaultTransactions.tsx
const pendingWindow = useMemo(() => windowRange(pending, anchorIndex), [pending, anchorIndex]);
const failedWindow  = useMemo(() => windowRange(failed,  anchorIndex), [failed,  anchorIndex]);
const restWindow    = useMemo(() => windowRange(rest,    anchorIndex), [rest,    anchorIndex]);
```

**Key observations:**

- Each section independently compares its own length against `WINDOW_THRESHOLD`.
  Pending and Failed sections rarely exceed 50 rows in typical use, so they
  usually pass through unchanged.
- The Confirmed section is where windowing is most likely to engage for large
  vaults.
- All three sections share the same `anchorIndex` state so paging controls
  advance all sections in lock-step.
- `anchorIndex` is reset to `0` when filters change (`clearFilters`) so the user
  always starts at the top of a new filter result.

**`WindowBanner` pattern:** the `windowed` flag gates the navigation UI:

```tsx
{restWindow.windowed && (
  <WindowBanner
    start={restWindow.startIndex}
    end={restWindow.endIndex}
    total={rest.length}
    onPrev={() => setAnchorIndex(a => Math.max(0, a - 10))}
    onNext={() => setAnchorIndex(a => Math.min(rest.length - 1, a + 10))}
  />
)}
```

The banner renders "Showing rows X–Y of Z" with Prev / Next buttons that
increment `anchorIndex` in steps of 10.

---

## 7. Threshold Tuning Guide

The defaults (`WINDOW_THRESHOLD = 50`, `WINDOW_SIZE = 40`) are calibrated for
the VaultTransactions row height (~72 px on desktop). They are **not
hard-coded in any global config** — they are module-level constants that can be
changed in a single file.

### Choosing `WINDOW_THRESHOLD`

The threshold should be **as high as the list can grow before rendering becomes
noticeably slow**. A practical formula:

```
WINDOW_THRESHOLD ≈ target_viewport_height (px) / row_height (px) × 2
```

| Row height | Viewport (900 px) | Suggested threshold |
|---|---|---|
| 40 px (compact table) | 900 px | ~45 → use `50` |
| 72 px (default tx row) | 900 px | ~25 → use `50` (generous) |
| 120 px (card layout) | 900 px | ~15 → use `20` |
| 200 px (large card) | 900 px | ~9 → use `10` |

A higher threshold means more rows are rendered before windowing engages, which
is fine for lightweight DOM nodes. A lower threshold engages windowing sooner,
which is better for complex or image-heavy rows.

### Choosing `WINDOW_SIZE`

`WINDOW_SIZE` controls how many rows are rendered at once when windowing is
active. A reasonable target:

```
WINDOW_SIZE ≥ visible_rows_in_viewport + overscan_buffer
```

| Scenario | Visible rows | Recommended `WINDOW_SIZE` |
|---|---|---|
| 72 px rows, 900 px viewport | ~12 | 20–40 (current default ✓) |
| 40 px rows, 900 px viewport | ~22 | 30–50 |
| 120 px rows, 900 px viewport | ~7 | 12–20 |

Keep `WINDOW_SIZE < WINDOW_THRESHOLD`. If `WINDOW_SIZE ≥ WINDOW_THRESHOLD` then
windowing would immediately render all rows that triggered it, negating the
performance benefit.

### Overriding per call-site

Rather than changing the global constants, a consumer can pass a custom
`windowSize` as the third argument:

```ts
// Render only 20 rows at a time for a compact card list
const result = windowRange(items, anchorIndex, 20);
```

The global `WINDOW_THRESHOLD` cannot be overridden per call — it is always used
for the pass-through decision. If the threshold needs to vary by context, wrap
`windowRange` in a helper:

```ts
function windowRangeCompact<T>(items: T[], anchor = 0) {
  // Manually apply a lower threshold for compact card layouts
  if (items.length <= 20) {
    return { items, startIndex: 0, endIndex: items.length, windowed: false };
  }
  return windowRange(items, anchor, 15);
}
```

---

## 8. Property Guarantees (from the test suite)

The property-based tests in
`src/utils/__tests__/windowRange.test.ts` assert that, for any valid input:

- `windowed` is `false` when `total <= WINDOW_THRESHOLD`, and the original
  array reference is returned unchanged.
- `windowed` is `true` for `total > WINDOW_THRESHOLD`.
- `0 ≤ startIndex ≤ endIndex ≤ total` always — the slice is always in-bounds.
- `items === source.slice(startIndex, endIndex)` always.
- Negative, zero, and very large `anchorIndex` values never throw.

---

## 9. Related Files

| File | Role |
|---|---|
| [`src/utils/windowRange.ts`](../src/utils/windowRange.ts) | Source — constants, `WindowResult` type, `windowRange` function |
| [`src/utils/__tests__/windowRange.test.ts`](../src/utils/__tests__/windowRange.test.ts) | Unit + property-based tests (Vitest + fast-check) |
| [`src/pages/VaultTransactions.tsx`](../src/pages/VaultTransactions.tsx) | Only current consumer — applies `windowRange` per status section |
