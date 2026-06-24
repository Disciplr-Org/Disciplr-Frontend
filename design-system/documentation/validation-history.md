# Validation History Filters

The verifier validation history page supports client-side filtering, search, and
pagination for completed milestone decisions.

## Controls

- Outcome filter: `All outcomes`, `Approved`, or `Rejected`.
- Search: matches `vaultName` and `owner` text from each validation task.
- Page size: verifier-selectable page size values of 5, 10, or 25.
- Pagination: Previous and Next buttons expose explicit `aria-label` text and
  disabled states at the first and last pages.

## Empty States

- When there is no validation history at all, the page renders the existing
  "No History Found" message.
- When filters match no history records, the page renders "No matching
  validations" with guidance to adjust filters.

## Token Usage

The surface uses semantic tokens:

- `--surface` and `--bg` for panels and nested note blocks.
- `--border` for panel, row, and control borders.
- `--muted` for labels and helper text.
- `--success` for approved status.
- `--danger` for rejected status.

## Related Flow Documentation

See `../../docs/VERIFIER_FLOW.md` for the `ValidationTask` lifecycle and the
store transition that moves approved or rejected tasks from the pending queue
into validation history.
