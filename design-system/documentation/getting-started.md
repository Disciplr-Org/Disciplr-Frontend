# Design System Getting Started

This guide explains how the React app consumes the Disciplr design-system
tokens and where contributors should add or validate new tokens.

## Source Files

Design tokens live in `design-system/tokens/`:

| Token file        | Runtime surface                                                                                                                                                       | Notes                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `colors.json`     | CSS variables in `src/index.css` such as `--bg`, `--surface`, `--text`, `--muted`, `--accent`, `--success`, `--warning`, and chart variables used by analytics views. | Use semantic names in components instead of hard-coded colors.                                              |
| `typography.json` | Typography CSS variables and classes in `src/index.css`, plus `src/utils/typography.ts`.                                                                              | Components should use the `Text` component or `classifyTypography()` roles where possible.                  |
| `spacing.json`    | Spacing, container, touch-target, and breakpoint CSS variables in `src/index.css`; breakpoint details are documented in `documentation/breakpoints.md`.               | Prefer `--spacing-*`, `--container-*`, and breakpoint tokens over one-off values.                           |
| `borders.json`    | Radius, border-width, and semantic border CSS variables in `src/index.css`.                                                                                           | Use `--radius-*`, `--border-width-*`, and semantic border variables for cards, fields, buttons, and modals. |
| `shadows.json`    | Elevation language for raised surfaces and overlays.                                                                                                                  | Match existing component surfaces before adding a new shadow.                                               |
| `motion.json`     | JS motion constants in `src/utils/motion.ts` and reduced-motion guidance in `documentation/breakpoints.md`.                                                           | Use the exported `duration`, `ease`, and standard transitions for Framer Motion flows.                      |

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
5. Use `src/utils/csv.ts` for standardized CSV exports. The `toCsv()` utility supports both `ValidationTask[]` (for verification history) and `Transaction[]` (for vault activity logs). Pair it with `downloadCsv()` to trigger browser file downloads with stable, human-readable headers and proper comma-escaping.
6. Use `src/utils/relativeTime.ts` for consistent, localized relative time formatting. The `formatRelativeTime()` utility handles seconds, minutes, hours, days, and weeks for both past and future dates using `Intl.RelativeTimeFormat`.

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

## Navigation Structure

The site-wide navigation is defined in `src/components/Layout.tsx` for desktop headers and `src/components/MobileDrawer.tsx` for mobile viewports.

1. **Active State with NavLink**: Use the custom `NavLink` component (`src/components/NavLink.tsx`) for navigation entries. It extends standard `Link` properties and automatically handles active state styling and accessibility features.
2. **Subroute Activation**: For nested views (such as `/verifier/queue` or `/verifier/history` under `/verifier`), the parent `NavLink` remains active by matching paths using `.startsWith()`.
3. **Accessibility**: `NavLink` sets `aria-current="page"` when active to assist screen readers and keyboard navigation (consistent with WCAG 2.1 AA).
4. **Token-Based Styling**: Nav links use CSS variables for theme colors. Active states receive `color: var(--accent)`, and inactive states default to `color: var(--muted)` (header) or `color: var(--text)` (mobile drawer).

## Related Documentation

- `documentation/token-catalog.md` maps token groups to consumers.
- `documentation/breakpoints.md` documents the responsive spacing and layout
  scale.
- `documentation/chart-palette.md` documents analytics chart color usage.
- `documentation/field.md` and `documentation/confirmation-modal.md` document
  component-level accessibility behavior.

## AddressDisplay Component

`src/components/AddressDisplay.tsx` renders a Stellar address with consistent
truncation, a copy-to-clipboard button, and an optional Stellar Expert explorer
link.

```tsx
import { AddressDisplay } from '../components/AddressDisplay';

// Basic – truncation + copy only
<AddressDisplay address="GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L" />

// With explorer link
<AddressDisplay
  address="GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L"
  network="TESTNET"
/>

// Custom head/tail char counts
<AddressDisplay address={addr} chars={8} tailChars={6} />
```

### Props

| Prop        | Type                            | Default     | Description                                                                               |
| ----------- | ------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `address`   | `string`                        | —           | Full Stellar address to display.                                                          |
| `network`   | `'TESTNET' \| 'PUBLIC' \| null` | `undefined` | When provided, renders an explorer link to `stellar.expert`. Omit or pass `null` to hide. |
| `chars`     | `number`                        | `6`         | Characters to keep at the start of the truncated display.                                 |
| `tailChars` | `number`                        | `4`         | Characters to keep at the end of the truncated display.                                   |

### Accessibility

- The full address is always present in `title` and `aria-label` on the display
  `<span>`, ensuring screen readers and tooltips expose the complete value.
- The copy button's `aria-label` switches from `"Copy address"` to `"Copied"`
  for 1.5 s so screen readers announce the success state.
- The explorer link carries an `aria-label` describing both the address and the
  destination (`"View <address> on Stellar Expert"`).

### Usage Guidelines

- Use `AddressDisplay` everywhere a Stellar address appears in the UI instead
  of ad-hoc truncation helpers (`truncAddr`, manual `slice` calls, etc.).
- Pass the `network` prop whenever the connected wallet's network is available
  so the explorer link points to the correct network.
- The component uses `var(--success)`, `var(--muted)`, and `var(--accent)` CSS
  variables; it inherits correctly in both light and dark themes.

## formatRelativeTime Utility

`src/utils/relativeTime.ts` provides a consistent, localized relative time formatting
utility using `Intl.RelativeTimeFormat`. It handles seconds, minutes, hours, days,
and weeks for both past and future dates.

```ts
import { formatRelativeTime } from '../utils/relativeTime';

// Basic usage - defaults to current time
formatRelativeTime(new Date(Date.now() - 3600000)); // "1 hour ago"

// With custom reference time for testing
const now = new Date('2024-04-28T12:00:00Z').getTime();
formatRelativeTime('2024-04-28T10:00:00Z', now); // "2 hours ago"

// Future dates
formatRelativeTime(new Date(Date.now() + 86400000)); // "in 1 day"

// Accepts Date objects, ISO strings, or timestamps
formatRelativeTime(new Date('2024-04-28T10:00:00Z'));
formatRelativeTime('2024-04-28T10:00:00Z');
formatRelativeTime(1714305600000);
```

### Features

- **Localized**: Uses `Intl.RelativeTimeFormat` for proper English locale formatting
- **Deterministic testing**: Optional `now` parameter allows predictable test results
- **Comprehensive coverage**: Handles seconds, minutes, hours, days, and weeks
- **Future support**: Formats both past and future dates correctly
- **Graceful fallback**: Returns absolute date for dates beyond a month
- **Error handling**: Returns "Invalid date" for invalid inputs

### Usage Guidelines

- Use `formatRelativeTime()` everywhere timestamps are displayed to users (activity feeds, transaction lists, etc.)
- Avoid ad-hoc time formatting helpers in components
- The utility is already applied in `src/utils/dashboard.ts` for the Dashboard activity feed and in `src/pages/VaultTransactions.tsx` for transaction timestamps
- For testing, pass a fixed `now` timestamp to ensure deterministic results
