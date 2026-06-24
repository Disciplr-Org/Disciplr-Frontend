# Verifier Metrics

`VerifierMetrics` summarizes verifier workload and outcomes from the existing
`useVerifierStore` pending and history arrays.

## Metric Definitions

- Approval Rate: approved resolved validations divided by all approved or
  rejected resolved validations. Empty history returns `0%`.
- Total Resolved: count of approved plus rejected history records.
- Urgent Pending: pending validations with `daysRemaining <= 3`.
- Overdue Pending: pending validations with `daysRemaining <= 0`.

Overdue validations are also urgent by threshold. The current store does not
include assignment or resolution timestamps, so turnaround time should be added
only after those fields exist.

## Token Usage

- Cards use `--surface` for background and `--border` for outlines.
- Approval rate uses `--success`.
- Total resolved uses `--info`.
- Urgent pending uses `--warning`.
- Overdue pending uses `--danger`.
- Supporting labels use `--muted`.

Each card exposes an `aria-label` with the metric value and detail text so
screen readers announce the KPI without relying on color alone.
