# Transaction Filters

`filterTransactions` in `src/utils/transactionFilter.ts` applies the
VaultTransactions client-side status, type, and date-range filters outside
React so the rules are unit-testable.

- `type` accepts `create`, `validate`, `release`, `redirect`, or `all`.
- `status` accepts `confirmed`, `pending`, `failed`, or `all`.
- `startDate` and `endDate` use `YYYY-MM-DD` values from date inputs.
- Date bounds are inclusive for the full local calendar day.
- Invalid date strings are ignored; an invalid transaction timestamp is excluded.
- If `startDate` is after `endDate`, the helper returns an empty list.
