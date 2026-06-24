# Design System Getting Started

This guide explains how the React app consumes the Disciplr design-system
tokens and where contributors should add or validate new tokens.

## Source Files

Design tokens live in `design-system/tokens/`:

| Token file | Runtime surface | Notes |
| --- | --- | --- |
| `colors.json` | CSS variables in `src/index.css` such as `--bg`, `--surface`, `--text`, `--muted`, `--accent`, `--success`, `--warning`, and chart variables used by analytics views. | Use semantic names in components instead of hard-coded colors. |
| `typography.json` | Typography CSS variables and classes in `src/index.css`, plus `src/utils/typography.ts`. | Components should use the `Text` component or `classifyTypography()` roles where possible. |
| `spacing.json` | Spacing, container, touch-target, and breakpoint CSS variables in `src/index.css`; breakpoint details are documented in `documentation/breakpoints.md`. | Prefer `--spacing-*`, `--container-*`, and breakpoint tokens over one-off values. |
| `borders.json` | Radius, border-width, and semantic border CSS variables in `src/index.css`. | Use `--radius-*`, `--border-width-*`, and semantic border variables for cards, fields, buttons, and modals. |
| `shadows.json` | Elevation language for raised surfaces and overlays. | Match existing component surfaces before adding a new shadow. |
| `motion.json` | JS motion constants in `src/utils/motion.ts` and reduced-motion guidance in `documentation/breakpoints.md`. | Use the exported `duration`, `ease`, and standard transitions for Framer Motion flows. |

## Consuming Tokens In Components

1. Import existing components first: `Text`, `Field`, `VaultCard`,
   `ConfirmationModal`, wallet components, and dashboard surfaces already bind
   to token-backed CSS variables.
2. Use CSS variables directly when the component has no wrapper yet. Common
   examples are `var(--accent)`, `var(--accent-transparent)`, `var(--success)`,
   `var(--surface)`, `var(--surface-raised)`, `var(--border)`,
   `var(--radius-md)`, and `var(--radius-full)`.
3. Use `src/utils/typography.ts` for text roles. `getTypographyClass()` maps
   `display`, `title`, `subtitle`, `body`, `caption`, and `mono` to the
   responsive classes defined in `src/index.css`.
4. Use `src/utils/motion.ts` for Framer Motion transitions. This keeps
   dropdowns, pages, and tooltips aligned with `motion.json`.

## Adding A Token

1. Add the token to the correct file in `design-system/tokens/`.
2. If it must be available at runtime, add the corresponding CSS variable or
   utility export in `src/index.css`, `src/utils/typography.ts`, or
   `src/utils/motion.ts`.
3. Validate the token shape through `design-system/src/utils/validators.ts`.
   Color and chart additions should satisfy `isValidColorToken()` or
   `isValidChartTokens()` as applicable.
4. Update `documentation/token-catalog.md` when the new token is consumed by a
   component.
5. Run the relevant checks:

```sh
npm test
npm run lint
npm run build
git diff --check
```

For documentation-only changes, verify every referenced file, CSS variable, and
component path exists before opening the PR.

## Related Documentation

- `documentation/token-catalog.md` maps token groups to consumers.
- `../../docs/VERIFIER_FLOW.md` documents the verifier journey and
  `useVerifierStore` state model.
- `documentation/breakpoints.md` documents the responsive spacing and layout
  scale.
- `documentation/chart-palette.md` documents analytics chart color usage.
- `documentation/field.md` and `documentation/confirmation-modal.md` document
  component-level accessibility behavior.
