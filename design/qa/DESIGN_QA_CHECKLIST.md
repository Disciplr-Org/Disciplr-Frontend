# Design QA Checklist — Disciplr Frontend

**Standard:** WCAG 2.1 AA (default theme, both light and dark)  
**Owner:** Design + Engineering  
**Cadence:** Every PR that touches `src/pages/`, `src/components/`, `src/index.css`, or `design-system/tokens/`  
**Branch convention:** `design/qa-checklist-visual-regression`

---

## How to use this checklist

Copy the relevant section(s) into your PR description and check each item before requesting review. Mark items `N/A` only when the surface genuinely has no such element (e.g. a page with no modals).

Legend: ✅ Pass · ❌ Fail (block) · ⚠️ Fail (warn, document gap) · N/A

---

## 1. Contrast — Text & UI Components

Target: **4.5 : 1** for normal text, **3 : 1** for large text (≥ 18 px regular / ≥ 14 px bold) and UI components.

Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) or the browser DevTools accessibility panel.

### Token reference (from `design-system/tokens/colors.json` + `src/index.css`)

| Token pair | Light ratio | Dark ratio | AA? |
|---|---|---|---|
| `--text` (#111827) on `--bg` (#F9FAFB) | ~16 : 1 | — | ✅ |
| `--text` (#F9FAFB) on `--bg` (#111827) | — | ~16 : 1 | ✅ |
| `--muted` (#4B5563) on `--bg` (#F9FAFB) | ~7.0 : 1 | — | ✅ |
| `--muted` (#9CA3AF) on `--bg` (#111827) | — | ~3.9 : 1 | ⚠️ borderline AA |
| `--accent` (#0A7668) on `--bg` (#F9FAFB) | ~4.5 : 1 | — | ✅ |
| `--accent` (#14B8A6) on `--bg` (#111827) | — | ~3.1 : 1 | ⚠️ large text only |
| `--danger` (#DC2626) on `--bg` (#F9FAFB) | ~4.6 : 1 | — | ✅ |
| `--danger` (#EF4444) on `--bg` (#111827) | — | ~4.0 : 1 | ✅ |
| `--warning` (#D97706) on `--bg` (#F9FAFB) | ~3.1 : 1 | — | ⚠️ large text only |
| `--warning` (#F59E0B) on `--bg` (#111827) | — | ~3.5 : 1 | ⚠️ large text only |
| Button text (`--bg`) on `--accent` (light) | ~4.5 : 1 | — | ✅ |
| Status badge text on badge bg | verify per badge | verify per badge | — |

> **Known gap (dark mode):** `--muted` on `--bg` in dark theme is ~3.9 : 1. Acceptable for secondary/caption text only if font-size ≥ 18 px or bold ≥ 14 px. Flag any body-weight muted text smaller than 18 px as a fail.

### Per-page contrast checks

#### Home (`/`)
- [ ] Hero headline (`--text` on `--bg`) ≥ 4.5 : 1
- [ ] Subheading / description text ≥ 4.5 : 1
- [ ] CTA button label on button background ≥ 4.5 : 1
- [ ] Link text in body copy ≥ 4.5 : 1

#### Vaults (`/vaults`)
- [ ] Vault name (bold body) ≥ 4.5 : 1
- [ ] Deadline caption (`--muted`) — verify size; if < 18 px regular, must be ≥ 4.5 : 1
- [ ] Amount text (`--accent`) on `--surface` ≥ 3 : 1 (large/bold) or 4.5 : 1 (normal)
- [ ] Status badge: each status color on its background ≥ 3 : 1
  - [ ] Active (accent on accent-transparent)
  - [ ] Completed (success on success-transparent)
  - [ ] Failed (danger on danger-transparent)
  - [ ] Cancelled (muted on muted-transparent)
  - [ ] Pending Validation (warning on warning-transparent)
- [ ] "+ Create Vault" button label on `--accent` ≥ 4.5 : 1

#### Create Vault (`/vaults/create`)
- [ ] Form label text ≥ 4.5 : 1
- [ ] Input placeholder text (`--muted`) ≥ 3 : 1 (placeholders are informational, not required AA)
- [ ] Input value text on `--surface` ≥ 4.5 : 1
- [ ] Input border (`--border`) on `--bg` ≥ 3 : 1 (UI component)
- [ ] Submit button label on `--accent` ≥ 4.5 : 1
- [ ] Error message text on background ≥ 4.5 : 1

#### Dashboard (`/dashboard`)
- [ ] All stat/metric values ≥ 4.5 : 1
- [ ] Chart labels and axis text ≥ 4.5 : 1
- [ ] Table header text ≥ 4.5 : 1
- [ ] Table row text ≥ 4.5 : 1

#### Vault Detail (`/vaults/:id`)
- [ ] Vault title ≥ 4.5 : 1
- [ ] All metadata labels and values ≥ 4.5 : 1
- [ ] Transaction list text ≥ 4.5 : 1
- [ ] Action button labels ≥ 4.5 : 1

#### Vault Transactions (`/vaults/:id/transactions`)
- [ ] Transaction amount (positive/negative colors) ≥ 4.5 : 1 on background
- [ ] Date/time text ≥ 4.5 : 1
- [ ] Status indicators ≥ 3 : 1

#### Notifications (`/notifications`)
- [ ] Notification title ≥ 4.5 : 1
- [ ] Notification body text ≥ 4.5 : 1
- [ ] Timestamp (`--muted`) — verify size

#### Notification Settings (`/notifications/settings`)
- [ ] Setting label text ≥ 4.5 : 1
- [ ] Toggle/checkbox labels ≥ 4.5 : 1
- [ ] Description/helper text ≥ 4.5 : 1

#### Modals (all)
- [ ] Modal title ≥ 4.5 : 1 on modal background
- [ ] Modal body text ≥ 4.5 : 1
- [ ] Confirm/destructive button label ≥ 4.5 : 1
- [ ] Cancel button label ≥ 4.5 : 1
- [ ] Close (×) icon button — icon color on modal background ≥ 3 : 1

---

## 2. Focus Management

All interactive elements must have a **visible focus indicator** that meets WCAG 2.1 AA (3 : 1 contrast between focused and unfocused state, or a 2 px outline with sufficient offset).

### Global
- [ ] Tab through the entire page — every interactive element receives focus in logical DOM order
- [ ] Focus ring is visible on all interactive elements (no `outline: none` without a custom replacement)
- [ ] Focus ring color contrasts ≥ 3 : 1 against adjacent background
- [ ] Skip-to-main-content link present and functional (first focusable element)

### Per-page focus order

#### Home
- [ ] Nav links → CTA button → footer links (logical order)

#### Vaults
- [ ] "Create Vault" button reachable by keyboard
- [ ] Each vault card is focusable and activatable with Enter/Space
- [ ] Focus order: header → create button → vault list items → pagination (if any)

#### Create Vault
- [ ] Form fields tab in visual top-to-bottom order
- [ ] Submit button is last in tab order within the form
- [ ] Required field errors announced to screen reader on submit

#### Dashboard
- [ ] Chart elements: if interactive, keyboard accessible; if decorative, `aria-hidden="true"`
- [ ] Table rows: if clickable, focusable with Enter/Space

#### Vault Detail / Transactions
- [ ] Action buttons reachable and operable by keyboard
- [ ] "Back" navigation reachable

#### Modals
- [ ] Focus moves into modal on open (first focusable element or modal title)
- [ ] Focus is **trapped** inside modal while open
- [ ] Escape key closes modal
- [ ] Focus returns to trigger element on close
- [ ] Modal has `role="dialog"` and `aria-labelledby` pointing to title

#### Notification Settings
- [ ] Toggle controls operable with Space
- [ ] Grouped settings have `fieldset`/`legend` or equivalent `role="group"` + `aria-labelledby`

---

## 3. Breakpoints

Test at these viewport widths. Use browser DevTools device emulation.

| Breakpoint | Width | Device proxy |
|---|---|---|
| xs (mobile) | 375 px | iPhone SE |
| sm | 640 px | CSS `@media (min-width: 640px)` boundary |
| md | 768 px | iPad portrait |
| lg | 1024 px | iPad landscape / small laptop |
| xl | 1280 px | Desktop |
| 2xl | 1440 px | Wide desktop |

### Layout checks (all pages)

- [ ] No horizontal scroll at any breakpoint (except intentional horizontal scroll containers)
- [ ] Navigation collapses or adapts correctly on mobile
- [ ] Touch targets ≥ 44 × 44 px on mobile (xs, sm) — verify buttons, links, vault cards
- [ ] Text does not overflow containers or truncate unexpectedly
- [ ] Images/icons scale proportionally
- [ ] Spacing tokens (`--spacing-*`) produce comfortable density at each breakpoint

### Per-page breakpoint checks

#### Home
- [ ] Hero layout stacks vertically on xs/sm
- [ ] CTA button full-width or appropriately sized on mobile

#### Vaults
- [ ] Vault card layout: amount + status badge wrap gracefully on xs
- [ ] "Create Vault" button accessible on mobile (not hidden behind overflow)

#### Create Vault
- [ ] Form max-width (400 px) respected; full-width on xs
- [ ] Labels and inputs readable at all breakpoints

#### Dashboard
- [ ] Stat cards reflow to single column on xs/sm
- [ ] Charts resize without clipping labels

#### Vault Detail / Transactions
- [ ] Transaction table scrolls horizontally if needed (not clipped)
- [ ] Action buttons stack on mobile

#### Modals
- [ ] Modal width ≤ viewport width − 32 px on xs
- [ ] Modal content scrollable if taller than viewport

---

## 4. Motion & Animation

Reference: `design-system/tokens/motion.json`, `src/index.css` (`prefers-reduced-motion`).

### Global
- [ ] `@media (prefers-reduced-motion: reduce)` collapses all `--duration-*` tokens to `1ms`
- [ ] `*, *::before, *::after` transition/animation durations set to `1ms !important` under reduced-motion
- [ ] Framer Motion components use `useReducedMotion()` hook and skip or simplify animations when true
- [ ] No animation loops indefinitely without user control (WCAG 2.2.2)
- [ ] No content flashes more than 3 times per second (WCAG 2.3.1)

### Per-surface motion checks

#### Page transitions
- [ ] Route change animation ≤ 300 ms (normal motion)
- [ ] Route change animation ≤ 1 ms (reduced motion)

#### Vault card hover
- [ ] Border-color transition ≤ 150 ms (normal)
- [ ] Transition disabled under reduced-motion

#### Modals
- [ ] Open/close animation ≤ 200 ms (normal)
- [ ] No animation under reduced-motion (instant show/hide)

#### Notifications
- [ ] Toast/notification slide-in ≤ 300 ms
- [ ] Instant under reduced-motion

#### Loading states / spinners
- [ ] Spinner animation pauses or is replaced with static indicator under reduced-motion

---

## 5. Screen Reader Smoke Test

Run with VoiceOver (macOS/iOS) or NVDA (Windows). Test the happy path for each flow.

- [ ] **Home:** Page title announced; CTA button label meaningful
- [ ] **Vaults list:** Each vault card announces name, amount, status, and deadline
- [ ] **Create Vault:** Form labels associated with inputs; required fields announced; error messages announced on submit
- [ ] **Vault Detail:** Vault title, status, and action buttons announced
- [ ] **Modals:** Dialog role, title, and close button announced; focus trap confirmed
- [ ] **Notifications:** Each notification item announces title and body
- [ ] **Theme toggle:** Button announces current state ("Switch to dark mode" / "Switch to light mode")

---

## 6. Dark Mode Gaps (document, do not block)

The following are known or likely gaps in dark mode. Document findings here; they do not block release unless contrast fails AA.

| Surface | Gap | Severity |
|---|---|---|
| `--muted` text < 18 px on dark `--bg` | ~3.9 : 1 (borderline) | ⚠️ Warn |
| `--accent` (#14B8A6) on dark `--bg` | ~3.1 : 1 (large text only) | ⚠️ Warn |
| `--warning` badge text on dark bg | verify per instance | TBD |
| Status badge borders in dark mode | verify per instance | TBD |

---

## 7. Figma / Spec Traceability

Each checked item should be traceable to a Figma frame or design-system token.

- [ ] Link Figma file URL in PR description
- [ ] Reference Figma node IDs for any new or changed components
- [ ] Confirm token names in code match token names in `design-system/tokens/*.json`
- [ ] Note any token updates needed in `design-system/tokens/*.json` in the PR description

---

## Sign-off

| Role | Name | Date | Status |
|---|---|---|---|
| Design | | | |
| Engineering | | | |
| Accessibility | | | |
