# Token And Component Catalog

This catalog maps the design token groups to the React components, pages, and utilities that currently consume their CSS variables or helper APIs.

| Token group | Source file | Runtime variables / helpers | Current consumers |
|---|---|---|---|
| Color | `design-system/tokens/colors.json` | `--accent`, `--accent-dim`, `--accent-transparent`, `--success`, `--danger`, `--warning`, `--info`, `--surface`, `--surface-raised`, `--border`, `--text`, `--muted` in `src/index.css` | `src/components/VaultCard.tsx`, `src/components/Field.tsx`, `src/components/ConfirmationModal.tsx`, `src/components/Wallet/wallet.css`, `src/pages/Dashboard.tsx`, `src/pages/VaultDetail.tsx`, `src/pages/Vaults.tsx`, `src/pages/ValidationDetail.tsx`, `src/pages/Analytics.tsx`, `src/pages/NotificationSettings.tsx` |
| Chart color | `design-system/tokens/colors.json` | Chart CSS variables documented in `design-system/documentation/chart-palette.md`; resolved by `src/pages/analyticsTheme.ts` | `src/pages/Analytics.tsx`, `src/pages/__tests__/Analytics.test.tsx` |
| Typography | `design-system/tokens/typography.json` | `--font-size-*`, `--line-height-*`, `--letter-spacing-*`, `--font-weight-*`, `--font-family-mono`, `src/utils/typography.ts` | `src/components/Text.tsx`, `src/components/Field.tsx`, `src/components/VaultCard.tsx`, `src/pages/Dashboard.tsx`, `src/pages/VaultDetail.tsx`, `src/pages/VaultTransactions.tsx` |
| Spacing | `design-system/tokens/spacing.json` | `--spacing-*`, `--container-*`, breakpoint docs in `breakpoints.md` | `src/components/Layout.tsx`, `src/components/Layout.css`, `src/pages/Dashboard.tsx`, `src/pages/VaultDetail.tsx`, `src/pages/VaultTransactions.tsx`, `src/pages/CreateVault.tsx` |
| Border and radius | `design-system/tokens/borders.json` | `--radius-*`, `--radius`, `--border-width-*`, `--border-*` | `src/components/Field.tsx`, `src/components/VaultCard.tsx`, `src/components/ConfirmationModal.tsx`, `src/components/Wallet/wallet.css`, `src/pages/Dashboard.tsx`, `src/pages/VaultDetail.tsx`, `src/pages/VaultTransactions.tsx` |
| Shadow | `design-system/tokens/shadows.json` | `--elevated` and surface shadow declarations in `src/index.css` | `src/components/VaultCard.tsx`, `src/components/Wallet/wallet.css`, modal and card surfaces across page components |
| Motion | `design-system/tokens/motion.json` | `src/utils/motion.ts` exports `duration`, `ease`, `transitionEnter`, `transitionExit`, and `transitionPage` | Components using `framer-motion` transitions and page/dropdown animation utilities |

## Validation entry points

- `design-system/src/utils/validators.ts` validates color token strings, token prefixes, and chart token groups.
- `design-system/src/utils/token-loader.ts` loads the token files for validation and package consumers.
- `design-system/src/__tests__/tokens.test.ts` and `design-system/src/__tests__/chart-tokens.test.ts` exercise token validity.

## When adding a component

Use existing runtime variables before creating a new alias. If a component needs a new semantic token, add it to the token file, update `src/index.css`, add validation coverage when relevant, and record the consumer in this catalog.
