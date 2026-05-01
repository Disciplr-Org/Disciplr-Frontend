# Responsive Breakpoints

Canonical breakpoint reference for Disciplr. All values are sourced from
[`design-system/tokens/spacing.json`](../tokens/spacing.json) under `spacing.breakpoint.*`.

These breakpoints align 1:1 with Tailwind v4 defaults (used via `@tailwindcss/vite` in
[`vite.config.ts`](../../vite.config.ts)) so a Tailwind class like `md:flex` and a CSS
`@media (min-width: 768px)` rule fire at the same viewport.

---

## Breakpoint table

| Token   | Min width | Tailwind prefix | Device tier              | Primary intent                                                                 |
| ------- | --------- | --------------- | ------------------------ | ------------------------------------------------------------------------------ |
| *(base)* | 0         | *(unprefixed)* | Small mobile (≥ 320 px) | Single-column, full-bleed, sticky bottom nav assumed.                          |
| `sm`    | 640 px    | `sm:`           | Large mobile / phablet   | Restore generous header padding; bump body type from 14 → 16 px.               |
| `md`    | 768 px    | `md:`           | Tablets (portrait)       | Bump display/title scale; allow side-by-side cards in two-column grids.        |
| `lg`    | 1024 px   | `lg:`           | Small laptops            | Show full nav labels; introduce sidebar layouts (e.g. dashboard right rail).   |
| `xl`    | 1280 px   | `xl:`           | Desktops                 | Reach `desktop.maxWidth` (1280 px) container; widen gutters per `grid.desktop`. |
| `2xl`   | 1536 px   | `2xl:`          | Large screens            | No additional layout reflow; content remains centered at `xl` max-width.       |

The `sm` / `md` / `lg` triple is the canonical set referenced by this issue;
`xl` and `2xl` are documented for completeness and exist in the same token file.

### Source of truth

```jsonc
// design-system/tokens/spacing.json → spacing.breakpoint
"sm":  "640px",
"md":  "768px",
"lg":  "1024px",
"xl":  "1280px",
"2xl": "1536px"
```

### Grid coupling

Each device tier also has a column/gutter/margin definition under
`spacing.grid.{mobile|tablet|desktop}` in the same file:

| Tier    | Columns | Gutter | Margin | Container max-width |
| ------- | ------- | ------ | ------ | ------------------- |
| mobile  | 4       | 16 px  | 16 px  | (fluid)             |
| tablet  | 8       | 20 px  | 32 px  | (fluid)             |
| desktop | 12      | 24 px  | 48 px  | **1280 px**         |

The desktop `maxWidth` token is the *design-system contract* for full-width content
containers. Components that intentionally render narrower (e.g. forms, modals) should
opt out explicitly with their own `max-width` and document the reason.

---

## Container max-widths in code

Container widths in the current codebase do **not** all consume the
`spacing.grid.desktop.maxWidth = 1280 px` token. They are recorded here for
traceability:

| Surface               | File                                                                   | Current `max-width` | Aligned with token? | Notes                                                                 |
| --------------------- | ---------------------------------------------------------------------- | ------------------- | ------------------- | --------------------------------------------------------------------- |
| App `<main>`          | [`src/components/Layout.tsx:141`](../../src/components/Layout.tsx#L141) | **960 px**          | ❌ legacy           | Predates the breakpoint token. Treat as *legacy main*; new pages should use `1100` (Dashboard) or the desktop token (1280). |
| Dashboard root        | [`src/pages/Dashboard.tsx:129`](../../src/pages/Dashboard.tsx#L129)     | 1100 px             | ❌ off-token        | Wider than `<main>` because Dashboard is a top-level surface.         |
| VaultDetail root      | [`src/pages/VaultDetail.tsx:262`](../../src/pages/VaultDetail.tsx#L262) | 860 px              | ❌ readability cap  | Intentionally narrow for long-form detail content.                    |
| VaultTransactions    | [`src/pages/VaultTransactions.tsx:581`](../../src/pages/VaultTransactions.tsx#L581) | 1100 px             | ❌ off-token        | Mirrors Dashboard width.                                              |
| CreateVault form      | [`src/pages/CreateVault.tsx:30`](../../src/pages/CreateVault.tsx#L30)   | 400 px              | n/a                 | Form column — readability constraint, not a layout breakpoint.        |
| Wallet modal          | [`src/components/Wallet/wallet.css:64`](../../src/components/Wallet/wallet.css#L64) | 420 px              | n/a                 | Modal dialog — sized to its task.                                     |
| Tx detail modal       | [`src/pages/VaultTransactions.tsx:736`](../../src/pages/VaultTransactions.tsx#L736) | 580 px              | n/a                 | Modal dialog — sized to its task.                                     |

> **Recommendation (no code change in this PR):** consolidate the page-level
> max-widths (960 / 1100) onto the `desktop.maxWidth = 1280` token (or a new
> `container.{narrow|standard|wide}` token tier under `spacing.json`) in a follow-up
> PR. See [Token gaps](#token-gaps) below.

---

## When vault columns stack

The Dashboard renders a two-column layout on desktop:

```tsx
// src/pages/Dashboard.tsx:175
display: 'grid',
gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)',
gap: '1.25rem',
alignItems: 'start',
```

This **does not currently stack** at any breakpoint — the right rail (340 px) collapses
the left column at narrow viewports, which causes content squeeze below ~720 px.

**Documented intent (matching the breakpoint scale):**

| Viewport       | Behavior                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------- |
| < `md` (768 px) | Stack: vault list above sidebar (Upcoming Deadlines + Success Rate). Single column.      |
| `md` – `lg`    | Two columns, sidebar narrows toward 280 px.                                               |
| ≥ `lg` (1024 px) | Two columns, sidebar at full 340 px width.                                              |

The summary-card grid above (`gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'`)
already auto-stacks responsively and needs no breakpoint-driven change.

The vault-detail two-card grid uses
`gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'`
([`VaultDetail.tsx:336`](../../src/pages/VaultDetail.tsx#L336)) which naturally collapses
to one column below ~600 px viewport — no manual breakpoint needed.

---

## Example layouts per breakpoint

### Base (≤ 639 px) — Mobile

```
┌──────────────────────────┐
│ ☰  Disciplr        🔔 ⊕ │  ← header, mobile nav drawer
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │  Total Locked $25.5K │ │  ← summary cards stack 1-up (auto-fit)
│ ├──────────────────────┤ │
│ │  Active Vaults    3  │ │
│ ├──────────────────────┤ │
│ │  Pending          2  │ │
│ ├──────────────────────┤ │
│ │  Completion     67%  │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │  Active Vaults  ›    │ │  ← main content
│ │  • Alpha Vault       │ │
│ │  • Beta Reserve      │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │  Upcoming Deadlines  │ │  ← sidebar STACKED below main
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │  Success Rate        │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### `sm` (640 – 767 px) — Large mobile

```
┌────────────────────────────────────────┐
│  Disciplr     Home  +Create  🔔 ⊕    │  ← header reaches full padding
├────────────────────────────────────────┤
│ ┌────────┬────────┬────────┬────────┐ │
│ │ Locked │ Active │ Pendg  │  67%   │ │  ← cards may pair-up via auto-fit
│ └────────┴────────┴────────┴────────┘ │
│ ┌────────────────────────────────────┐ │
│ │  Active Vaults  ›                  │ │  ← still single content column
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │  Upcoming Deadlines                │ │  ← sidebar still stacked
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### `md` (768 – 1023 px) — Tablet

```
┌───────────────────────────────────────────────────────────┐
│  Disciplr   Home   + Create Vault   🔔 ⊕                │
├───────────────────────────────────────────────────────────┤
│ ┌────────┬────────┬────────┬────────┐                    │
│ │ Locked │ Active │ Pendg  │  67%   │                    │
│ └────────┴────────┴────────┴────────┘                    │
│ ┌──────────────────────────┬──────────────────────────┐  │
│ │  Active Vaults  ›        │  Upcoming Deadlines      │  │  ← side-by-side
│ │  • Alpha Vault           │  • Beta Reserve  3d      │  │
│ │  • Beta Reserve          │  • Alpha Vault  72d      │  │
│ │  • Gamma Fund            │  ──────────────────────  │  │
│ │                          │  Success Rate            │  │
│ └──────────────────────────┴──────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### `lg` (1024 – 1279 px) — Small laptop

```
┌────────────────────────────────────────────────────────────────────────┐
│  Disciplr    Home    + Create Vault     [wallet]   🔔 ⊕              │  ← full nav
├────────────────────────────────────────────────────────────────────────┤
│ Dashboard                                                              │
│ ┌──────────┬──────────┬──────────┬──────────┐                         │
│ │ Locked   │ Active   │ Pending  │ Complete │                         │
│ └──────────┴──────────┴──────────┴──────────┘                         │
│ ┌──────────────────────────────────────┬──────────────────────────┐   │
│ │  Active Vaults                ›      │  Upcoming Deadlines      │   │
│ │  • Alpha Vault   12,500 USDC  Active │  • Beta Reserve   3d ⚠   │   │
│ │  • Beta Reserve   8,800 USDC  Pendg  │  • Alpha Vault   72d ✓   │   │
│ │  • Gamma Fund     4,200 USDC  Active │  ──────────────────────  │   │
│ │                                       │  Success Rate            │   │
│ │                                       │  ▁▂▃▅▄▃                   │   │
│ └──────────────────────────────────────┴──────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                          ↑ 1100 px max (Dashboard)
```

### `xl` / `2xl` (≥ 1280 px) — Desktop

Layout is identical to `lg`; content remains centered at the page's `max-width`
(1100 px for Dashboard / VaultTransactions, 960 px for legacy `<main>`, 1280 px
for the `desktop.maxWidth` token target). Beyond `2xl` no additional reflow
occurs — only generous side margins.

---

## CSS / Tailwind usage

### Plain CSS (mobile-first, recommended)

```css
/* default styles target base (mobile) */
.section { padding: 1rem; }

@media (min-width: 768px) {            /* md */
  .section { padding: 2rem; }
}

@media (min-width: 1024px) {           /* lg */
  .section { padding: 3rem; }
}
```

### Tailwind v4

```html
<div class="p-4 md:p-8 lg:p-12">…</div>
```

The Tailwind prefixes (`sm:` / `md:` / `lg:` / `xl:` / `2xl:`) resolve to the
identical pixel values listed in the token table above.

### Reading tokens from JS / TS

```ts
import borderspacing from '@disciplr/design-system/tokens/spacing.json';
const md = spacing.spacing.breakpoint.md.$value; // "768px"
```

For runtime CSS-in-JS (e.g. inline `style` props in React), prefer wrapping the
breakpoint in a `useMediaQuery`-style hook rather than re-implementing `matchMedia`
inline.

---

## Off-token usages (catalogue)

The audit found the following non-token breakpoint values. None are blocking; they
are listed so they can be addressed in follow-up PRs that touch those files.

| File / line                                                                                 | Value             | Why it's off-token                                                                        | Suggested action                                              |
| ------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`src/components/Layout.css:71`](../../src/components/Layout.css#L71)                       | `min-width: 400px` | Hides the "Transactions" label below 400 px — micro-breakpoint for label-vs-icon swap.    | Acceptable as a content-driven micro-breakpoint; document it inline. |
| [`src/pages/VaultTransactions.tsx:783`](../../src/pages/VaultTransactions.tsx#L783)         | `max-width: 680px` | Stacks transaction stats and hides memo column.                                           | Migrate to `min-width: 768px` (md, mobile-first) in a future pass. |
| [`src/pages/VaultTransactions.tsx:793`](../../src/pages/VaultTransactions.tsx#L793)         | `max-width: 480px` | Single-column stat cards on small phones.                                                 | Acceptable for sub-`sm`; consider standardizing to `max-width: 639px`. |

---

## Token gaps

These are *recommendations only* — no token JSON is changed in this PR.

1. **Container scale.** The page-level max-widths (960 / 1100 / 1280) are a real
   design pattern but live only in component code. Consider adding a `container.*`
   ramp under `spacing.json`:
   ```jsonc
   "container": {
     "narrow":   { "$value": "640px",  "$description": "Long-form / form columns" },
     "standard": { "$value": "960px",  "$description": "Legacy main; content pages" },
     "wide":     { "$value": "1100px", "$description": "Dashboards and transaction tables" },
     "max":      { "$value": "1280px", "$description": "Full grid (matches grid.desktop.maxWidth)" }
   }
   ```
2. **No `xs` token.** Mobile (< 640 px) is intentionally unprefixed in Tailwind and
   has no token entry. If we ever need to gate behavior at ~400 px (see
   `Layout.css:71`), add an explicit `xs: "400px"` entry rather than perpetuating
   inline magic numbers.
3. **Dashboard sidebar collapse.** Add a project-level token or convention for
   "sidebar collapses below `md`" so multiple pages can opt into the same behavior
   without re-deriving the breakpoint each time.

---

## Accessibility checklist (smoke level)

When adjusting layouts at any breakpoint, verify:

- **Touch targets** stay ≥ 44 × 44 px (`--touch-target` is enforced in
  [`Layout.css`](../../src/components/Layout.css) for header items).
- **Focus order** stays logical when columns reflow — stacked items must follow
  reading order, not visual order.
- **Reduced motion.** All breakpoint-triggered animations respect
  `@media (prefers-reduced-motion: reduce)` (already handled globally in
  [`src/index.css`](../../src/index.css)).
- **Contrast** is unaffected by viewport, but verify any layout-driven color shifts
  (e.g. cards moving onto darker surfaces at `md`) still meet WCAG 2.1 AA
  (4.5:1 text / 3:1 non-text).

---

## Change log for this document

- *2026-04-29* — Initial documentation of `sm` / `md` / `lg` (and `xl` / `2xl`)
  breakpoints, container max-widths, vault-column stacking guidance, and off-token
  usages catalogue. Source-of-truth tokens already exist in
  [`spacing.json`](../tokens/spacing.json) — no token changes required.
