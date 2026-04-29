# Typography Scale — Figma Specification & Design Handoff

## Overview

This document specifies the Figma type styles and specification frames required for Issue #28: Typography Scale implementation across the Disciplr Frontend.

All type styles are derived from `design-system/tokens/typography.json` and are responsive across three breakpoints: sm (< 640px), md (640px-768px), and lg (≥768px).

---

## Type Style Definitions

### Display Role

**Purpose:** Hero headlines, page-level display text. One per page, decorative weight not used for body reading.

| Breakpoint | Font Size | Line Height | Letter Spacing | Font Weight | Font Family |
|-----------|-----------|-------------|-----------------|-------------|-------------|
| sm        | 28px      | 36px        | -0.01em         | 700         | Inter       |
| md        | 48px      | 60px        | -0.01em         | 700         | Inter       |
| lg        | 72px      | 90px        | -0.02em         | 700         | Inter       |

**Figma Type Styles to Create:**
- `Display/sm` — 28px, 700 weight, -0.01em tracking
- `Display/md` — 48px, 700 weight, -0.01em tracking
- `Display/lg` — 72px, 700 weight, -0.02em tracking

**WCAG 2.1 AA Contrast:**
- Text color: #e8edf5 (light)
- Background: #0a0e17 (dark)
- Contrast ratio: 15.5:1 ✓ (exceeds 4.5:1 requirement)

---

### Title Role

**Purpose:** Section headings, subsection titles. Used for structural hierarchy below display.

| Breakpoint | Font Size | Line Height | Letter Spacing | Font Weight | Font Family |
|-----------|-----------|-------------|-----------------|-------------|-------------|
| sm        | 20px      | 28px        | 0               | 600         | Inter       |
| md        | 28px      | 36px        | -0.01em         | 600         | Inter       |
| lg        | 36px      | 44px        | -0.01em         | 600         | Inter       |

**Figma Type Styles to Create:**
- `Title/sm` — 20px, 600 weight, 0 tracking
- `Title/md` — 28px, 600 weight, -0.01em tracking
- `Title/lg` — 36px, 600 weight, -0.01em tracking

**WCAG 2.1 AA Contrast:**
- Contrast ratio: 15.5:1 ✓ (exceeds 4.5:1 requirement)

---

### Body Role

**Purpose:** Primary body copy, paragraphs, list items. Default reading text.

| Breakpoint | Font Size | Line Height | Letter Spacing | Font Weight | Font Family |
|-----------|-----------|-------------|-----------------|-------------|-------------|
| sm        | 14px      | 20px        | 0               | 400         | Inter       |
| md        | 16px      | 24px        | 0               | 400         | Inter       |
| lg        | 18px      | 28px        | 0               | 400         | Inter       |

**Figma Type Styles to Create:**
- `Body/sm` — 14px, 400 weight, 0 tracking
- `Body/md` — 16px, 400 weight, 0 tracking
- `Body/lg` — 18px, 400 weight, 0 tracking

**WCAG 2.1 AA Contrast:**
- Contrast ratio: 15.5:1 ✓ (exceeds 4.5:1 requirement)

---

### Caption Role

**Purpose:** Labels, helper text, metadata, form labels, small UI text.

| Breakpoint | Font Size | Line Height | Letter Spacing | Font Weight | Font Family |
|-----------|-----------|-------------|-----------------|-------------|-------------|
| sm        | 12px      | 16px        | 0               | 400         | Inter       |
| md        | 13px      | 18px        | 0               | 400         | Inter       |
| lg        | 14px      | 20px        | 0               | 400         | Inter       |

**Figma Type Styles to Create:**
- `Caption/sm` — 12px, 400 weight, 0 tracking
- `Caption/md` — 13px, 400 weight, 0 tracking
- `Caption/lg` — 14px, 400 weight, 0 tracking

**WCAG 2.1 AA Contrast:**
- Contrast ratio: 15.5:1 ✓ (exceeds 3:1 requirement for large text)

---

### Mono Role

**Purpose:** Code, financial data, monospaced numbers, technical content.

| Breakpoint | Font Size | Line Height | Letter Spacing | Font Weight | Font Family |
|-----------|-----------|-------------|-----------------|-------------|-------------|
| sm        | 12px      | 18px        | 0               | 400         | JetBrains Mono |
| md        | 14px      | 20px        | 0               | 400         | JetBrains Mono |
| lg        | 16px      | 24px        | 0               | 400         | JetBrains Mono |

**Figma Type Styles to Create:**
- `Mono/sm` — 12px, 400 weight, 0 tracking, JetBrains Mono
- `Mono/md` — 14px, 400 weight, 0 tracking, JetBrains Mono
- `Mono/lg` — 16px, 400 weight, 0 tracking, JetBrains Mono

**WCAG 2.1 AA Contrast:**
- Contrast ratio: 15.5:1 ✓ (exceeds 3:1 requirement for large text)

---

## Specification Frames

### Frame 1: Layout Component — Before/After

**Location:** Figma file, page "Typography Scale Spec"

**Content:**
- **Before:** Current Layout component with existing text styles annotated
  - "Disciplr" logo: current style
  - "Home" nav link: current style
  - "Create Vault" button: current style
- **After:** Layout component with new type styles applied
  - "Disciplr" logo: `Title/md` (or `Title/lg` at lg breakpoint)
  - "Home" nav link: `Caption/md` (or `Caption/lg` at lg breakpoint)
  - "Create Vault" button: `Caption/md` (or `Caption/lg` at lg breakpoint)

**Annotations:**
- Token names for each text element
- Responsive breakpoint indicators (sm/md/lg)
- Contrast ratio: 15.5:1 ✓

---

### Frame 2: Home Page — Before/After

**Location:** Figma file, page "Typography Scale Spec"

**Content:**
- **Before:** Current Home page with existing text styles
  - Hero headline: current style
  - Subtitle: current style
  - Buttons: current style
  - Section heading: current style
  - List items: current style
- **After:** Home page with new type styles applied
  - Hero headline: `Display/md` (or `Display/lg` at lg breakpoint)
  - Subtitle: `Body/md` (or `Body/lg` at lg breakpoint)
  - Buttons: `Body/md` (or `Body/lg` at lg breakpoint)
  - Section heading: `Title/md` (or `Title/lg` at lg breakpoint)
  - List items: `Body/md` (or `Body/lg` at lg breakpoint)

**Annotations:**
- Token names for each text element
- Responsive breakpoint indicators
- Contrast ratio: 15.5:1 ✓

---

### Frame 3: Vaults Page — Before/After

**Location:** Figma file, page "Typography Scale Spec"

**Content:**
- **Before:** Current Vaults page
  - Page heading: current style
  - Subtitle: current style
  - Empty state message: current style
- **After:** Vaults page with new type styles
  - Page heading: `Display/md` (or `Display/lg` at lg breakpoint)
  - Subtitle: `Body/md` (or `Body/lg` at lg breakpoint)
  - Empty state message: `Body/md` (or `Body/lg` at lg breakpoint)

**Annotations:**
- Token names
- Responsive breakpoint indicators
- Contrast ratio: 15.5:1 ✓

---

### Frame 4: Create Vault Page — Before/After

**Location:** Figma file, page "Typography Scale Spec"

**Content:**
- **Before:** Current Create Vault page
  - Page heading: current style
  - Subtitle: current style
  - Form labels: current style
  - Button: current style
- **After:** Create Vault page with new type styles
  - Page heading: `Display/md` (or `Display/lg` at lg breakpoint)
  - Subtitle: `Body/md` (or `Body/lg` at lg breakpoint)
  - Form labels: `Caption/md` (or `Caption/lg` at lg breakpoint)
  - Button: `Caption/md` (or `Caption/lg` at lg breakpoint)

**Annotations:**
- Token names
- Responsive breakpoint indicators
- Touch target verification: all interactive elements ≥ 44×44 px ✓
- Contrast ratio: 15.5:1 ✓

---

## Implementation Mapping

### CSS Variables → Figma Type Styles

The following CSS variables in `src/index.css` map directly to Figma type styles:

```css
/* Display */
--font-size-display: 28px | 48px | 72px
--line-height-display: 36px | 60px | 90px
--letter-spacing-display: -0.01em | -0.01em | -0.02em
--font-weight-display: 700

/* Title */
--font-size-title: 20px | 28px | 36px
--line-height-title: 28px | 36px | 44px
--letter-spacing-title: 0 | -0.01em | -0.01em
--font-weight-title: 600

/* Body */
--font-size-body: 14px | 16px | 18px
--line-height-body: 20px | 24px | 28px
--letter-spacing-body: 0
--font-weight-body: 400

/* Caption */
--font-size-caption: 12px | 13px | 14px
--line-height-caption: 16px | 18px | 20px
--letter-spacing-caption: 0
--font-weight-caption: 400

/* Mono */
--font-size-mono: 12px | 14px | 16px
--line-height-mono: 18px | 20px | 24px
--letter-spacing-mono: 0
--font-weight-mono: 400
--font-family-mono: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace
```

Each Figma type style should be named to match the token structure: `{Role}/{Breakpoint}` (e.g., `Display/sm`, `Title/md`, `Body/lg`).

---

## Responsive Breakpoint Behavior

All type styles scale responsively at the following breakpoints:

- **sm (< 640px):** Mobile devices
- **md (640px-768px):** Tablets
- **lg (≥768px):** Desktops and large screens

In Figma, create separate type styles for each breakpoint. In the implementation, CSS media queries automatically apply the correct values based on viewport width.

---

## Accessibility Compliance

### WCAG 2.1 AA Verification

All text elements meet WCAG 2.1 AA contrast requirements:

- **Normal text (< 18px):** Minimum 4.5:1 contrast ratio
- **Large text (≥ 18px):** Minimum 3:1 contrast ratio

**Current theme contrast:**
- Text color: #e8edf5 (light)
- Background: #0a0e17 (dark)
- Calculated contrast ratio: **15.5:1** ✓

All five typographic roles exceed the minimum requirement.

### Touch Target Verification

All interactive elements (buttons, links) maintain a minimum touch target of 44×44 px:
- "Create Vault" button: 44px minimum height ✓
- "View Vaults" button: 44px minimum height ✓
- Navigation links: 44px minimum height ✓

---

## Dark Mode Notes

The current implementation uses a dark theme exclusively. Light mode contrast verification is not applicable. If light mode is added in a future release, the following text colors should be verified:

- Light mode text: #111827 (dark)
- Light mode background: #F9FAFB (light)
- Expected contrast ratio: ~15:1 (should exceed WCAG AA)

---

## Implementation Checklist

- [x] All five typographic roles defined in design-system/tokens/typography.json
- [x] CSS variables in src/index.css aligned to token values
- [x] Responsive scaling implemented at sm/md/lg breakpoints
- [x] Text component (src/components/Text.tsx) supports all roles
- [x] All four pages (Layout, Home, Vaults, CreateVault) use Text component with correct roles
- [x] WCAG 2.1 AA contrast verified (15.5:1 ✓)
- [x] Touch targets verified (≥ 44×44 px ✓)
- [x] Build passes without errors
- [x] Linter passes (pre-existing issues only)

---

## Figma File Structure

**Recommended Figma file organization:**

```
Disciplr Design System
├── Typography Scale
│   ├── Type Styles (component set)
│   │   ├── Display/sm
│   │   ├── Display/md
│   │   ├── Display/lg
│   │   ├── Title/sm
│   │   ├── Title/md
│   │   ├── Title/lg
│   │   ├── Body/sm
│   │   ├── Body/md
│   │   ├── Body/lg
│   │   ├── Caption/sm
│   │   ├── Caption/md
│   │   ├── Caption/lg
│   │   ├── Mono/sm
│   │   ├── Mono/md
│   │   └── Mono/lg
│   └── Specification Frames
│       ├── Layout — Before/After
│       ├── Home — Before/After
│       ├── Vaults — Before/After
│       └── Create Vault — Before/After
```

---

## Next Steps

1. Create Figma type styles matching the specifications above
2. Create specification frames for each page showing before/after states
3. Annotate all frames with token names and contrast ratios
4. Share Figma file link and node IDs in PR description
5. Attach before/after screenshots at sm, md, lg viewports
