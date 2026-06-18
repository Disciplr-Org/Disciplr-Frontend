# ValidationHistory Filters and Pagination

`ValidationHistory` now supports three controls for verifier-scale history:

- outcome filter: `all`, `approved`, `rejected`
- free-text search across `vaultName` and `owner`
- page-size control with accessible pagination buttons

## Behavior Matrix

| Control | Behavior |
|---|---|
| Outcome filter | Narrows history by `ValidationTask.status`. |
| Search | Matches case-insensitively against vault name and owner. |
| Page size | Recomputes pages and resets the view to page 1. |
| Pagination | Previous/next buttons are disabled at the boundaries and page buttons expose `aria-label`s. |

## Empty States

- No history yet: shows the verifier has not processed any validations.
- No search matches: shows that the filters are too narrow and need adjustment.

## Token Guidance

- Panels use `--surface`, `--bg`, and `--border` surfaces.
- Approved and rejected outcomes use `--success` and `--danger` tokens in the summary cards and history pills.
- Disabled pagination controls lower opacity and remain non-interactive.
