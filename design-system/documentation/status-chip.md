# Status Chip

`StatusChip` renders a presentational, non-focusable status label for vault and
validation states. It centralizes the status-to-token mapping used by vault
cards, vault lists, pending validations, and validation history.

## Status Mapping

| Status | Default label | Token |
| --- | --- | --- |
| `active` | Active | `--accent` |
| `pending_validation` | Pending Validation | `--warning` |
| `completed` | Completed | `--success` |
| `failed` | Failed | `--danger` |
| `cancelled` | Cancelled | `--muted` |
| `approved` | Approved | `--success` |
| `rejected` | Rejected | `--danger` |

Backgrounds use `color-mix()` with the same semantic token so light and dark
themes inherit the existing palette. Unknown runtime statuses fall back to the
muted token and the `Unknown` label.

## Sizing And Labels

- `size="md"` is the default list/table chip size.
- `size="sm"` is used in compact card or row metadata.
- A `label` override can preserve legacy visible labels while retaining the
shared semantic token mapping. For example, compact vault cards keep the
existing `Pending` label for `pending_validation`.

Each chip exposes `aria-label="Status: <label>"`, so the status is announced as
text and never depends on color alone.
