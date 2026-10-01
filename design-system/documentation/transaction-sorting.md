# Transaction Sorting

`VaultTransactions` exposes clickable column headers for transaction type,
amount, fee, and timestamp. Sorting happens after the current filters are
applied and before section windowing, so pending, failed, and confirmed sections
all reflect the same active sort.

The page uses `sortTransactions(rows, key, dir)` from
`src/utils/sortTransactions.ts` for local reasoning and testability.

Accessibility rules:

- The active sortable header sets `aria-sort` to `ascending` or `descending`.
- Inactive sortable headers set `aria-sort` to `none`.
- Header buttons announce the next sort direction.

Data rules:

- Timestamp values are compared by parsed date value.
- Amount and fee values are compared numerically.
- Transaction type values are compared case-insensitively.
- Missing numeric or timestamp values sort after defined values.
- Equal values preserve input order.
