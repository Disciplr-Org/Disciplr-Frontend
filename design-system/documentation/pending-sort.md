# Pending Validation Sorting

`PendingValidations` uses the shared `sortPending` utility to keep queue ordering predictable across UI and tests.

## Sort Keys

- `deadline`: compares the submitted deadline date, with `daysRemaining` as a fallback for invalid dates.
- `amount`: parses readable token strings, such as `20,000 USDC`, into numeric values before comparing.
- `vaultName`: compares vault names case-insensitively.

## Direction

The queue supports ascending and descending order for every sort key. The table exposes the active sort state with `aria-sort` on the matching column header and `none` on sortable inactive headers.

## Stability

`sortPending` preserves the original relative order when two tasks compare equally. This prevents repeated render churn when several validations share the same deadline, amount, or vault name.

## Filtering

The page applies `filterPending` first, then passes the filtered queue into `sortPending`. Select-all and batch actions therefore operate only on the visible filtered and sorted set.
