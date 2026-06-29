# Transaction Sorting

`src/pages/VaultTransactions.tsx` exposes sortable table headers for the
activity explorer.

## Behavior

- Sortable columns: type, timestamp, amount, and fee.
- The default order is timestamp descending so the newest activity appears first.
- Clicking the active header toggles ascending and descending order.
- Clicking a different header activates that column in ascending order.
- Sorting is applied after filters and before windowing, so CSV export,
visible totals, and window banners reflect the same ordered result.

## Accessibility

- Header controls are real buttons inside `role="columnheader"` cells.
- The active header exposes `aria-sort="ascending"` or
  `aria-sort="descending"`.
- Inactive sortable headers expose `aria-sort="none"`.

## Utility

The pure `sortTransactions(rows, key, dir)` helper lives in
`src/utils/sortTransactions.ts` and is covered by focused unit tests in
`src/utils/__tests__/sortTransactions.test.ts`.
