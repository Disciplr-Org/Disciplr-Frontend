# `src/utils/__tests__`

This directory is the single canonical location for all unit tests covering the pure utility functions in `src/utils/`. The legacy duplicate directory `src/utils/tests/` has been consolidated and removed.  
All tests run with **Vitest** (`npm run test` or `pnpm exec vitest run src/utils/__tests__`).

## Coverage targets

| Utility | Functions under test | Target |
|---|---|---|
| `typography.ts` | `getTypographyClass` | 100 % |
| `url.ts` | `isSafeEvidenceUrl`, `normalizeEvidenceUrl` | ≥ 95 % |
| `csv.ts` | CSV helpers | ≥ 95 % |
| `paginate.ts` | Pagination helpers | ≥ 95 % |
| `windowRange.ts` | Window-range helpers | ≥ 95 % |
| `vaultValidation.ts` | Vault validation helpers | ≥ 95 % |
| `horizon.ts` | Horizon helpers | ≥ 95 % |

## Typography role contract

`getTypographyClass(role)` maps every `TypographyRole` to an exact Tailwind
class string:

| Role | CSS class |
|---|---|
| `display` | `text-display` |
| `title` | `text-title` |
| `subtitle` | `text-subtitle` |
| `body` | `text-body` |
| `caption` | `text-caption` |
| `mono` | `text-mono` |

Class composition with additional styles is handled directly by the `Text` primitive (`src/components/Text.tsx`). The deprecated `classifyTypography` export is removed to minimize surface area and prevent redundant wrappers.

