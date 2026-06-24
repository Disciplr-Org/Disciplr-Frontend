# Table Accessibility

Use native table markup when the UI is visually tabular. If a view must keep a card or list layout, expose the same structure with ARIA table roles.

## Required Semantics

- Give every data table a programmatic name with a `<caption>` or `aria-label`.
- Mark native table headers with `scope="col"` or `scope="row"`.
- For ARIA tables, use `role="table"`, `role="rowgroup"`, `role="row"`, `role="columnheader"`, and `role="cell"` together.
- Expose active sorting on the sorted column with `aria-sort="ascending"` or `aria-sort="descending"`.
- Keep hidden table headers available to assistive tech with visually hidden CSS, not `display: none`.

## Non-Color Cues

Status, urgency, and risk must not be communicated by color alone. Pair color with visible text such as `Urgent`, `Pending`, `Failed`, or an equivalent `aria-label`.

## Test Expectations

Tests for tables should assert:

- The table can be found by role and accessible name.
- Column headers are present and scoped.
- Sorted columns expose `aria-sort`.
- Status and urgency meanings are available as text or labels.
