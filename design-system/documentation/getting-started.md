# Design System Getting Started

This guide explains how Disciplr's design tokens flow from the token JSON files into the app's CSS custom properties and component utilities.

## Token sources

The canonical token files live in `design-system/tokens/`:

- `colors.json`
- `typography.json`
- `spacing.json`
- `shadows.json`
- `motion.json`
- `borders.json`

`design-system/src/utils/token-loader.ts` loads those files, and `design-system/src/utils/validators.ts` checks that the token shapes are valid before they are consumed by the app.

## How tokens reach the app

The React app consumes the design system through CSS variables defined in `src/index.css`. That file maps the token vocabulary to the runtime variables used across components, for example:

- `--accent` and `--success` for primary and positive states.
- `--danger` and `--warning` for destructive and caution states.
- `--radius-full` and the rest of the radius scale for rounded surfaces.
- `--surface`, `--surface-raised`, `--border`, `--text`, and `--muted` for layout and hierarchy.

Typography utilities are centralized in `src/utils/typography.ts`, which maps semantic roles like `display`, `title`, `body`, `caption`, and `mono` to the classes used by `src/components/Text.tsx`.

Motion tokens are centralized in `src/utils/motion.ts`, so UI transitions stay in sync with the token set.

## Adding a new token

1. Add the token to the correct file under `design-system/tokens/`.
2. Make sure the token passes `design-system/src/utils/validators.ts`.
3. Add or update the CSS variable mapping in `src/index.css` if the app needs a runtime alias.
4. Update the consuming component or utility to read the new variable or helper.

## Validating a change

- Use the token validators in `design-system/src/utils/validators.ts`.
- Confirm the CSS variable exists in `src/index.css`.
- Confirm the component or utility that should consume the token is imported from the correct path.
- When in doubt, search the repo for the variable or component name before adding a new alias.

## Related guides

- [`token-catalog.md`](token-catalog.md)
- [`field.md`](field.md)
- [`confirmation-modal.md`](confirmation-modal.md)
- [`breakpoints.md`](breakpoints.md)
