# Verifier Token Mapping

The verifier workflow uses semantic CSS variables from `src/index.css` rather than hardcoded Tailwind color utilities. This keeps the dashboard, queue, and review detail surfaces theme-aware across the default dark theme and manual light mode.

## Surface Mapping

| Surface | Token |
| --- | --- |
| Page cards, tables, and detail panels | `--bg` with `--border` |
| Table headers and evidence panels | `--surface` |
| Muted labels, metadata, and empty states | `--muted` |
| Primary navigation and evidence links | `--info` |
| Pending or urgent deadline accents | `--warning` |
| Completed and approved amounts/actions | `--success` |
| Reject/destructive actions | `--danger` |

## Covered Pages

- `src/pages/VerifierDashboard.tsx`
- `src/pages/PendingValidations.tsx`
- `src/pages/ValidationDetail.tsx`

Tests assert that the verifier page markup no longer uses hardcoded Tailwind color utilities such as `bg-blue-*`, `bg-white`, `text-gray-*`, or `border-l-green-*`.
