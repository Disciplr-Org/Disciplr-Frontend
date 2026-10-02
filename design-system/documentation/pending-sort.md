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

Deadlines that are missing, blank, or not parseable as dates are grouped after
every valid deadline when sorting ascending (and before them when sorting
descending). They keep their original relative order among themselves, so a
malformed record can never outrank a real deadline or shuffle the queue
between renders. `comparePendingTasks` exposes the underlying comparator for
callers that need the raw ordering; it always returns `-1`, `0`, or `1`.
