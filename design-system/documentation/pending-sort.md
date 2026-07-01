# Pending Validation Sorting

`PendingValidations` uses `sortPending(tasks, key, dir)` after filtering the
queue. Filtering stays responsible for narrowing the result set; sorting only
orders the visible tasks.

Supported keys:

- `deadline`: earliest or latest deadline first
- `amount`: numeric amount parsed from strings such as `20,000 USDC`
- `vaultName`: case-insensitive vault-name ordering

The comparator is stable, so tasks with equal sort keys keep their original
relative order. This keeps queue movement predictable when several validations
share a deadline or an unavailable amount.
