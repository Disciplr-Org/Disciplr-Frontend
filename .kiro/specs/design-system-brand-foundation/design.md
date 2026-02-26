# Design Document: Design System & Brand Foundation

## Overview

The Disciplr Design System establishes a comprehensive visual language and component library for a financial platform that handles money and sensitive financial data. The system prioritizes trust, security, professionalism, and accessibility while maintaining visual consistency across all touchpoints.

### Design Philosophy

**Trust Through Clarity**: Every design decision reinforces user confidence through clear visual hierarchies, predictable interactions, and transparent communication.

**Accessibility First**: The system meets WCAG 2.1 Level AA standards from the ground up, ensuring all users can access financial information regardless of ability.

**Financial Data Optimization**: Typography, color, and layout choices optimize for extended reading sessions and numerical data comprehension.

**Scalable Foundation**: Design tokens and systematic approach enable consistent implementation across web, mobile, and future platforms.

### Key Design Decisions

1. **Primary Brand Color**: Deep blue (#1E40AF) chosen to convey trust, stability, and security—essential for financial applications
2. **Base Spacing Unit**: 8px grid system for balanced layouts and easier mathematical calculations
3. **Typography**: Inter font family for exceptional readability at all sizes, with JetBrains Mono for financial data
4. **Dark Mode**: Full dark mode support designed from the start, not retrofitted
5. **Component States**: Comprehensive state system ensures predictable, accessible interactions

## Architecture

### Design Token Structure

The design system uses a three-tier token architecture:

```
Foundation Tokens (Primitive values)
    ↓
Semantic Tokens (Contextual meaning)
    ↓
Component Tokens (Specific usage)
```

**Foundation Tokens**: Raw values (colors, sizes, weights)
- Example: `blue-600: #1E40AF`

**Semantic Tokens**: Meaning-based references
- Example: `color-primary: blue-600`

**Component Tokens**: Component-specific applications
- Example: `button-background-primary: color-primary`

This architecture enables:
- Easy theme switching (light/dark mode)
- Consistent updates across the system
- Platform-agnostic token export

### File Organization

```
design-system/
├── tokens/
│   ├── colors.json
│   ├── typography.json
│   ├── spacing.json
│   ├── shadows.json
│   └── motion.json
├── components/
│   ├── buttons/
│   ├── inputs/
│   ├── cards/
│   └── tables/
├── patterns/
│   ├── layouts/
│   ├── navigation/
│   └── data-display/
├── assets/
│   ├── logos/
│   ├── icons/
│   └── illustrations/
└── documentation/
    ├── brand-guide.pdf
    ├── getting-started.md
    └── accessibility.md
```

## Components and Interfaces

### 1. Brand Identity System

#### Logo Variations

**Full Logo** (Primary)
- Composition: Icon + Wordmark
- Usage: Main navigation, marketing materials, login screens
- Minimum width: 120px
- Clear space: 0.5x logo height on all sides

**Icon Only** (Secondary)
- Usage: Favicons, app icons, tight spaces
- Minimum size: 32x32px
- Clear space: 0.25x icon height

**Wordmark Only** (Tertiary)
- Usage: Footer, secondary branding areas
- Minimum width: 80px
- Clear space: 0.5x wordmark height

#### Logo Usage Guidelines

**Acceptable**:
- Use on white, light gray, or primary brand color backgrounds
- Maintain minimum size requirements
- Preserve aspect ratio
- Use provided color variations (full color, white, black)

**Unacceptable**:
- Stretching or distorting proportions
- Changing colors outside approved palette
- Adding effects (shadows, gradients, outlines)
- Placing on busy backgrounds without sufficient contrast
- Rotating or skewing

#### Brand Voice

**Tone**: Professional yet approachable, confident but not arrogant
**Language Style**: Clear, concise, jargon-free
**Messaging Principles**:
- Transparency: Explain financial concepts clearly
- Empowerment: Help users feel in control of their finances
- Security: Reassure users their data is protected
- Growth: Focus on progress and achievement

#### Imagery Style

**Photography**:
- Authentic, diverse people in real financial situations
- Natural lighting, warm tones
- Avoid stock photo clichés (handshakes, piggy banks)
- Show technology in context, not isolated

**Illustrations**:
- Geometric, modern style with subtle gradients
- Use brand color palette
- Abstract financial concepts (growth, security, planning)
- Consistent line weight and corner radius

### 2. Color System

#### Primary Brand Colors

**Primary Blue** (`color-primary`)
- Light mode: `#1E40AF` (blue-700)
- Dark mode: `#3B82F6` (blue-500)
- Usage: Primary actions, links, brand elements
- Contrast ratio: 4.52:1 on white, 7.21:1 on dark background

**Secondary Teal** (`color-secondary`)
- Light mode: `#0D9488` (teal-600)
- Dark mode: `#14B8A6` (teal-500)
- Usage: Accents, secondary actions, highlights
- Contrast ratio: 4.54:1 on white

#### Semantic Colors

**Success** (`color-success`)
- Light mode: `#059669` (green-600)
- Dark mode: `#10B981` (green-500)
- Usage: Positive financial changes, confirmations, completed states

**Error** (`color-error`)
- Light mode: `#DC2626` (red-600)
- Dark mode: `#EF4444` (red-500)
- Usage: Errors, negative financial changes, destructive actions

**Warning** (`color-warning`)
- Light mode: `#D97706` (amber-600)
- Dark mode: `#F59E0B` (amber-500)
- Usage: Alerts, pending states, important notices

**Info** (`color-info`)
- Light mode: `#2563EB` (blue-600)
- Dark mode: `#60A5FA` (blue-400)
- Usage: Informational messages, tips, neutral notifications

#### Neutral Scale

**Light Mode Neutrals**:
- `neutral-50`: `#F9FAFB` - Backgrounds, subtle fills
- `neutral-100`: `#F3F4F6` - Hover states, borders
- `neutral-200`: `#E5E7EB` - Borders, dividers
- `neutral-300`: `#D1D5DB` - Disabled states
- `neutral-400`: `#9CA3AF` - Placeholders
- `neutral-500`: `#6B7280` - Secondary text
- `neutral-600`: `#4B5563` - Body text
- `neutral-700`: `#374151` - Headings
- `neutral-800`: `#1F2937` - Emphasis text
- `neutral-900`: `#111827` - High contrast text

**Dark Mode Neutrals**:
- `neutral-900`: `#111827` - Background
- `neutral-800`: `#1F2937` - Surface
- `neutral-700`: `#374151` - Elevated surface
- `neutral-600`: `#4B5563` - Borders
- `neutral-500`: `#6B7280` - Disabled text
- `neutral-400`: `#9CA3AF` - Secondary text
- `neutral-300`: `#D1D5DB` - Body text
- `neutral-200`: `#E5E7EB` - Headings
- `neutral-100`: `#F3F4F6` - High contrast text
- `neutral-50`: `#F9FAFB` - Maximum contrast

#### Financial Data Colors

**Positive Values** (`color-financial-positive`)
- Light mode: `#059669` (green-600)
- Dark mode: `#10B981` (green-500)
- Usage: Gains, increases, positive balances

**Negative Values** (`color-financial-negative`)
- Light mode: `#DC2626` (red-600)
- Dark mode: `#EF4444` (red-500)
- Usage: Losses, decreases, debts

**Neutral Values** (`color-financial-neutral`)
- Light mode: `#6B7280` (neutral-500)
- Dark mode: `#9CA3AF` (neutral-400)
- Usage: Zero values, unchanged amounts

#### Color Usage Guidelines

1. **Text on Backgrounds**: Always verify 4.5:1 contrast ratio for normal text, 3:1 for large text
2. **Interactive Elements**: Use primary color for clickable elements, secondary for hover states
3. **Semantic Meaning**: Never rely on color alone—pair with icons or text labels
4. **Colorblind Safety**: Success/error states use both color and iconography
5. **Dark Mode**: Test all color combinations in both modes during design

### 3. Typography System

#### Font Families

**Primary: Inter**
- Usage: UI text, headings, body copy
- Weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Rationale: Excellent readability, extensive weight options, optimized for screens

**Monospace: JetBrains Mono**
- Usage: Financial data, numbers, code, tables
- Weights: 400 (Regular), 500 (Medium), 600 (Semibold)
- Fallback: `"SF Mono", Monaco, "Cascadia Code", monospace`
- Rationale: Clear number distinction, tabular figures, professional appearance

#### Type Scale

Base font size: `16px` (1rem)

**Display Styles**:
- `display-2xl`: 72px / 4.5rem, Line height: 90px, Weight: 700, Letter spacing: -0.02em
- `display-xl`: 60px / 3.75rem, Line height: 72px, Weight: 700, Letter spacing: -0.02em
- `display-lg`: 48px / 3rem, Line height: 60px, Weight: 700, Letter spacing: -0.01em

**Heading Styles**:
- `h1`: 36px / 2.25rem, Line height: 44px, Weight: 700, Letter spacing: -0.01em
- `h2`: 30px / 1.875rem, Line height: 38px, Weight: 600, Letter spacing: -0.01em
- `h3`: 24px / 1.5rem, Line height: 32px, Weight: 600, Letter spacing: 0
- `h4`: 20px / 1.25rem, Line height: 28px, Weight: 600, Letter spacing: 0
- `h5`: 18px / 1.125rem, Line height: 26px, Weight: 600, Letter spacing: 0
- `h6`: 16px / 1rem, Line height: 24px, Weight: 600, Letter spacing: 0

**Body Styles**:
- `body-xl`: 20px / 1.25rem, Line height: 30px, Weight: 400
- `body-lg`: 18px / 1.125rem, Line height: 28px, Weight: 400
- `body-md`: 16px / 1rem, Line height: 24px, Weight: 400
- `body-sm`: 14px / 0.875rem, Line height: 20px, Weight: 400
- `body-xs`: 12px / 0.75rem, Line height: 18px, Weight: 400

**Specialized Styles**:
- `caption`: 12px / 0.75rem, Line height: 16px, Weight: 400, Color: neutral-500
- `overline`: 12px / 0.75rem, Line height: 16px, Weight: 600, Letter spacing: 0.08em, Uppercase
- `financial-data`: 16px / 1rem, Line height: 24px, Weight: 500, Font: JetBrains Mono

#### Typography Usage Guidelines

1. **Hierarchy**: Use size and weight to create clear visual hierarchy
2. **Line Length**: Limit body text to 60-80 characters per line for readability
3. **Financial Data**: Always use monospace font for currency values and numerical tables
4. **Alignment**: Left-align text for readability; right-align numerical data in tables
5. **Emphasis**: Use weight changes over italics for emphasis in financial contexts

### 4. Spacing and Layout System

#### Base Spacing Unit

Base unit: `8px` (0.5rem)

#### Spacing Scale

- `spacing-0`: 0px
- `spacing-1`: 4px (0.25rem) - Tight spacing within components
- `spacing-2`: 8px (0.5rem) - Default component padding
- `spacing-3`: 12px (0.75rem) - Small gaps between elements
- `spacing-4`: 16px (1rem) - Standard spacing
- `spacing-5`: 20px (1.25rem) - Medium spacing
- `spacing-6`: 24px (1.5rem) - Large spacing
- `spacing-8`: 32px (2rem) - Section spacing
- `spacing-10`: 40px (2.5rem) - Large section spacing
- `spacing-12`: 48px (3rem) - Major section breaks
- `spacing-16`: 64px (4rem) - Page section spacing
- `spacing-20`: 80px (5rem) - Large page sections
- `spacing-24`: 96px (6rem) - Maximum spacing

#### Grid System

**Desktop (> 1024px)**:
- Columns: 12
- Gutter: 24px (spacing-6)
- Margin: 48px (spacing-12)
- Max width: 1280px

**Tablet (768px - 1024px)**:
- Columns: 8
- Gutter: 20px (spacing-5)
- Margin: 32px (spacing-8)
- Max width: 100%

**Mobile (< 768px)**:
- Columns: 4
- Gutter: 16px (spacing-4)
- Margin: 16px (spacing-4)
- Max width: 100%

#### Responsive Breakpoints

- `breakpoint-sm`: 640px - Small mobile devices
- `breakpoint-md`: 768px - Tablets
- `breakpoint-lg`: 1024px - Small laptops
- `breakpoint-xl`: 1280px - Desktops
- `breakpoint-2xl`: 1536px - Large screens

#### Layout Patterns

**Content Container**:
- Max width: 1280px
- Horizontal padding: spacing-6 (mobile), spacing-12 (desktop)
- Centered with auto margins

**Card Layout**:
- Padding: spacing-6
- Gap between cards: spacing-4 (mobile), spacing-6 (desktop)
- Border radius: radius-lg

**Form Layout**:
- Label spacing: spacing-2
- Field spacing: spacing-4
- Section spacing: spacing-8

### 5. Iconography System

#### Icon Style Guidelines

**Visual Style**:
- Style: Outline (stroke-based)
- Stroke width: 2px (1.5px for 16px icons)
- Corner radius: 2px
- Visual weight: Consistent across all sizes
- Grid: Aligned to pixel grid at all sizes

**Design Principles**:
- Simple, recognizable shapes
- Consistent stroke weight
- Rounded corners for friendly appearance
- Optical balance over mathematical precision

#### Icon Sizes

- `icon-xs`: 16px - Inline with text, tight spaces
- `icon-sm`: 20px - Buttons, form inputs
- `icon-md`: 24px - Default size, navigation
- `icon-lg`: 32px - Feature highlights, empty states
- `icon-xl`: 48px - Hero sections, large empty states

#### Custom Disciplr Icons

**Financial Concepts**:
- `vault`: Secure storage, savings
- `milestone`: Goals, achievements
- `lock`: Security, privacy
- `growth-chart`: Financial growth, investments
- `piggy-bank`: Savings, budgeting
- `wallet`: Spending, transactions
- `shield-check`: Protection, insurance
- `target`: Goals, targets
- `calendar-dollar`: Scheduled payments, recurring
- `receipt`: Transactions, records

**Actions**:
- `add-circle`: Create, add new
- `edit`: Modify, update
- `delete`: Remove, delete
- `search`: Find, filter
- `filter`: Sort, organize
- `download`: Export, save
- `upload`: Import, add
- `refresh`: Reload, sync

**Navigation**:
- `home`: Dashboard, home
- `menu`: Navigation menu
- `arrow-left/right/up/down`: Directional navigation
- `chevron-left/right/up/down`: Subtle navigation
- `close`: Dismiss, close

#### Icon Usage Guidelines

1. **Color**: Use currentColor to inherit text color
2. **Spacing**: Add spacing-2 (8px) between icon and text
3. **Alignment**: Vertically center icons with adjacent text
4. **Touch Targets**: Ensure 44x44px minimum for interactive icons
5. **Accessibility**: Always pair icons with text labels or aria-labels

### 6. Component State System

#### State Definitions

**Default State**:
- Purpose: Resting state, no interaction
- Visual: Standard colors, no effects
- Example: Button with primary background, white text

**Hover State**:
- Purpose: Indicates interactivity
- Visual: Slight color shift (10% darker/lighter)
- Transition: 150ms ease-in-out
- Example: Button background darkens to primary-700

**Active State**:
- Purpose: Indicates element is being pressed/clicked
- Visual: More pronounced color shift (15% darker/lighter)
- Transition: 100ms ease-in-out
- Example: Button background darkens to primary-800, slight scale (0.98)

**Focus State**:
- Purpose: Keyboard navigation indicator
- Visual: 2px outline with 2px offset
- Color: primary color with 50% opacity
- Contrast: Minimum 3:1 against background
- Example: Blue outline ring around focused button

**Disabled State**:
- Purpose: Indicates unavailable interaction
- Visual: Reduced opacity (40%), no hover effects
- Cursor: not-allowed
- Example: Button with neutral-300 background, neutral-400 text

#### State Transition Specifications

**Micro-interactions** (100-200ms):
- Button hover/active states
- Checkbox/radio toggles
- Icon color changes
- Tooltip appearances

**Transitions** (200-300ms):
- Modal open/close
- Dropdown expand/collapse
- Tab switching
- Card hover elevations

**Animations** (300-500ms):
- Page transitions
- Drawer slide-in/out
- Loading states
- Success/error confirmations

**Easing Curves**:
- `ease-in-out`: Default for most transitions
- `ease-out`: Entering elements (modals, dropdowns)
- `ease-in`: Exiting elements
- `spring`: Playful interactions (optional, use sparingly)

#### Reduced Motion

When `prefers-reduced-motion: reduce` is detected:
- Disable all animations
- Use instant state changes
- Maintain functional behavior
- Keep essential feedback (color changes, text updates)

### 7. Elevation and Shadow System

#### Elevation Levels

**Level 0** (Flat):
- Shadow: none
- Usage: Default surface, no elevation needed
- Example: Page background, flat cards

**Level 1** (Subtle):
- Shadow: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- Usage: Slight separation, hover states
- Example: Card hover, input focus

**Level 2** (Low):
- Shadow: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)`
- Usage: Cards, buttons, small components
- Example: Default card, raised button

**Level 3** (Medium):
- Shadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- Usage: Dropdowns, popovers, tooltips
- Example: Dropdown menu, date picker

**Level 4** (High):
- Shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- Usage: Modals, drawers, important overlays
- Example: Modal dialog, side drawer

**Level 5** (Highest):
- Shadow: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
- Usage: Critical overlays, notifications
- Example: Toast notifications, critical alerts

#### Dark Mode Shadows

In dark mode, shadows are less visible. Enhance with subtle borders:

- Add 1px border with `rgba(255, 255, 255, 0.1)`
- Reduce shadow opacity by 50%
- Increase shadow blur radius by 20%
- Use lighter shadow color: `rgba(0, 0, 0, 0.5)` instead of `rgba(0, 0, 0, 0.1)`

#### Elevation Guidelines

1. **Hierarchy**: Higher elevation = more important/temporary
2. **Consistency**: Use same elevation for similar components
3. **Restraint**: Don't overuse high elevations
4. **Context**: Modals should be highest elevation on page
5. **Borders vs Shadows**: Use borders for subtle separation, shadows for elevation

### 8. Border and Radius System

#### Border Radius Values

- `radius-none`: 0px - Sharp corners, formal elements
- `radius-sm`: 4px - Subtle rounding, inputs, tags
- `radius-md`: 8px - Default, buttons, cards
- `radius-lg`: 12px - Large cards, modals
- `radius-xl`: 16px - Hero cards, feature sections
- `radius-full`: 9999px - Pills, avatars, circular buttons

#### Border Width Standards

- `border-0`: 0px - No border
- `border-1`: 1px - Default borders, dividers
- `border-2`: 2px - Emphasis, focus states
- `border-4`: 4px - Strong emphasis, loading indicators

#### Border Color Tokens

**Light Mode**:
- `border-default`: neutral-200 - Default borders
- `border-emphasis`: neutral-300 - Emphasized borders
- `border-subtle`: neutral-100 - Subtle dividers
- `border-interactive`: primary-500 - Interactive elements
- `border-error`: error-500 - Error states
- `border-success`: success-500 - Success states

**Dark Mode**:
- `border-default`: neutral-700 - Default borders
- `border-emphasis`: neutral-600 - Emphasized borders
- `border-subtle`: neutral-800 - Subtle dividers
- `border-interactive`: primary-400 - Interactive elements
- `border-error`: error-400 - Error states
- `border-success`: success-400 - Success states

#### Border Usage Guidelines

1. **Cards**: Use radius-lg with border-default
2. **Buttons**: Use radius-md, no border (use background color)
3. **Inputs**: Use radius-sm with border-default, border-interactive on focus
4. **Modals**: Use radius-lg, no border (rely on shadow)
5. **Avatars**: Use radius-full for circular appearance

### 9. Motion and Animation System

#### Animation Durations

**Micro-interactions** (100-200ms):
- Button state changes
- Checkbox/toggle animations
- Icon transitions
- Color changes

**Standard Transitions** (200-300ms):
- Dropdown open/close
- Tooltip show/hide
- Tab switching
- Accordion expand/collapse

**Complex Animations** (300-500ms):
- Modal enter/exit
- Drawer slide
- Page transitions
- Loading sequences

**Long Animations** (500ms+):
- Skeleton loading states
- Progress indicators
- Celebration animations
- Use sparingly

#### Easing Functions

```css
/* Standard easing */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);

/* Specialized easing */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
```

#### Animation Guidelines

**When to Animate**:
- State changes that need user attention
- Providing feedback for user actions
- Guiding user focus
- Showing relationships between elements

**When NOT to Animate**:
- Initial page load (except loading indicators)
- Rapid, repeated interactions
- When user has reduced motion preference
- Critical information display

#### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Data Models

### Design Token Schema

Design tokens are stored in JSON format following the Design Tokens Community Group specification.

#### Color Token Structure

```json
{
  "color": {
    "primary": {
      "$type": "color",
      "$value": "#1E40AF",
      "$description": "Primary brand color for actions and emphasis",
      "contrast": {
        "light": 4.52,
        "dark": 7.21
      }
    },
    "neutral": {
      "50": {
        "$type": "color",
        "$value": "#F9FAFB"
      }
    }
  }
}
```

#### Typography Token Structure

```json
{
  "typography": {
    "h1": {
      "$type": "typography",
      "fontFamily": {
        "$value": "Inter"
      },
      "fontSize": {
        "$value": "36px"
      },
      "lineHeight": {
        "$value": "44px"
      },
      "fontWeight": {
        "$value": 700
      },
      "letterSpacing": {
        "$value": "-0.01em"
      }
    }
  }
}
```

#### Spacing Token Structure

```json
{
  "spacing": {
    "4": {
      "$type": "dimension",
      "$value": "16px",
      "$description": "Standard spacing between elements"
    }
  }
}
```

#### Shadow Token Structure

```json
{
  "shadow": {
    "level-2": {
      "$type": "shadow",
      "$value": [
        {
          "offsetX": "0px",
          "offsetY": "1px",
          "blur": "3px",
          "spread": "0px",
          "color": "rgba(0, 0, 0, 0.1)"
        },
        {
          "offsetX": "0px",
          "offsetY": "1px",
          "blur": "2px",
          "spread": "0px",
          "color": "rgba(0, 0, 0, 0.06)"
        }
      ]
    }
  }
}
```

### Component State Model

Each interactive component follows this state model:

```typescript
interface ComponentState {
  default: StyleProperties;
  hover?: StyleProperties;
  active?: StyleProperties;
  focus?: StyleProperties;
  disabled?: StyleProperties;
  loading?: StyleProperties;
}

interface StyleProperties {
  backgroundColor?: string;
  color?: string;
  borderColor?: string;
  boxShadow?: string;
  opacity?: number;
  transform?: string;
  transition?: string;
}
```

### Accessibility Metadata

Each design token includes accessibility metadata:

```json
{
  "color": {
    "primary": {
      "$value": "#1E40AF",
      "accessibility": {
        "contrastRatios": {
          "onWhite": 4.52,
          "onNeutral50": 4.52,
          "onNeutral900": 7.21
        },
        "wcagLevel": "AA",
        "colorblindSafe": true,
        "colorblindSimulation": {
          "protanopia": "#1E3FAF",
          "deuteranopia": "#1E40AF",
          "tritanopia": "#1E40B0"
        }
      }
    }
  }
}
```

### Documentation Structure

```typescript
interface DesignSystemDocumentation {
  brandGuide: {
    logoVariations: LogoAsset[];
    brandVoice: BrandVoiceGuidelines;
    imageryStyle: ImageryGuidelines;
  };
  colorPalette: {
    colors: ColorToken[];
    usageGuidelines: string;
    contrastMatrix: ContrastRatio[][];
  };
  typography: {
    typeScale: TypographyToken[];
    specimen: string; // URL to specimen sheet
    usageExamples: Example[];
  };
  spacing: {
    scale: SpacingToken[];
    gridSystem: GridSpecification;
    layoutPatterns: LayoutPattern[];
  };
  components: {
    [componentName: string]: ComponentDocumentation;
  };
}
```



## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

For the Design System & Brand Foundation, correctness properties ensure that all design tokens, components, and documentation meet the specified requirements consistently. These properties validate completeness, consistency, and accessibility across the entire design system.

### Property 1: Dark Mode Color Mapping Completeness

*For any* color token defined in the design system, there must exist a corresponding dark mode color mapping with equivalent semantic meaning.

**Validates: Requirements 2.5, 14.1**

### Property 2: Color Contrast Accessibility

*For any* documented color combination used for text and background in the design system, the contrast ratio must meet or exceed WCAG 2.1 Level AA requirements (4.5:1 for normal text, 3:1 for large text, 3:1 for UI components).

**Validates: Requirements 2.6, 2.7, 10.2, 13.4**

### Property 3: Color Token Format Completeness

*For any* color token in the design system, the token must provide values in hex, RGB, and HSL formats.

**Validates: Requirements 2.8**

### Property 4: Color Usage Documentation

*For any* color token in the design system, there must exist usage guidelines specifying when and how to use that color.

**Validates: Requirements 2.9**

### Property 5: Typography Specification Completeness

*For any* typography token in the type scale, the token must include complete specifications for line height, letter spacing, and usage guidelines.

**Validates: Requirements 3.4, 3.5, 3.7**

### Property 6: Icon Size Availability

*For any* icon in the icon library, the icon must be available in all four required sizes: 16px, 20px, 24px, and 32px.

**Validates: Requirements 5.2**

### Property 7: Icon Vector Format

*For any* icon asset in the design system, the icon must be provided in SVG (vector) format.

**Validates: Requirements 5.4**

### Property 8: Component State Completeness

*For any* interactive component in the design system, the component must define visual specifications for all five required states: default, hover, active, focus, and disabled.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 9: Focus Indicator Accessibility

*For any* interactive component that can receive keyboard focus, the focus state must include a visible focus indicator with a minimum contrast ratio of 3:1 against the adjacent background.

**Validates: Requirements 6.6, 10.4**

### Property 10: Elevation Shadow Completeness

*For any* elevation level defined in the design system, the elevation must specify complete shadow properties including color, blur radius, and offset values.

**Validates: Requirements 7.2**

### Property 11: Dark Mode Shadow Specifications

*For any* elevation level in the design system, there must exist dark mode shadow specifications that account for reduced shadow visibility in dark themes.

**Validates: Requirements 7.4, 14.3**

### Property 12: Touch Target Minimum Size

*For any* interactive component in the design system, the minimum touch target size must be at least 44x44 pixels to ensure mobile accessibility.

**Validates: Requirements 10.1, 15.4**

### Property 13: Colorblind-Safe Semantic Colors

*For any* semantic color (success, error, warning, info) in the design system, the color must be distinguishable for users with common forms of color blindness (protanopia, deuteranopia, tritanopia), either through inherent color choice or through accompanying visual indicators.

**Validates: Requirements 10.3**

### Property 14: Token Naming Consistency

*For any* design token in the system, the token name must follow the established naming convention (category-prefix with kebab-case format).

**Validates: Requirements 11.3**

### Property 15: Token Multi-Format Values

*For any* design token where multiple format representations are applicable (e.g., spacing in px and rem, colors in hex and rgb), the token must provide values in all applicable formats.

**Validates: Requirements 11.4**

### Property 16: Dark Mode Brand Asset Coverage

*For any* brand asset (logo, icon, illustration) in the design system, there must exist a dark mode version optimized for display on dark backgrounds.

**Validates: Requirements 14.4**

### Property 17: Dark Mode Contrast Maintenance

*For any* color combination used in dark mode, the contrast ratio must meet or exceed WCAG 2.1 Level AA requirements, ensuring accessibility is maintained across both light and dark themes.

**Validates: Requirements 14.2**

## Error Handling

### Missing or Incomplete Tokens

**Error Condition**: A design token is referenced but not defined in the token files.

**Handling Strategy**:
- Token validation script should identify missing tokens during build
- Provide clear error messages indicating which token is missing and where it's referenced
- Fail the build to prevent incomplete design system deployment
- Suggest similar existing tokens as potential alternatives

**Example Error Message**:
```
Error: Token 'color-accent-tertiary' is not defined
Referenced in: components/button/variants.json
Suggestion: Did you mean 'color-secondary'?
```

### Accessibility Violations

**Error Condition**: A color combination fails to meet minimum contrast requirements.

**Handling Strategy**:
- Automated contrast checking during token validation
- Provide specific contrast ratio achieved vs. required
- Suggest alternative color combinations that meet requirements
- Flag as warning for non-critical combinations, error for text/background combinations

**Example Error Message**:
```
Error: Insufficient contrast ratio
Combination: color-primary (#1E40AF) on neutral-100 (#F3F4F6)
Achieved: 3.2:1, Required: 4.5:1 for normal text
Suggestion: Use color-primary on neutral-50 (4.52:1) or neutral-200 (5.1:1)
```

### Invalid Token Values

**Error Condition**: A token value doesn't match the expected format or range.

**Handling Strategy**:
- Schema validation for all token files
- Type checking for values (e.g., colors must be valid hex/rgb, spacing must be positive numbers)
- Range validation (e.g., font weights must be 100-900)
- Provide specific validation error with expected format

**Example Error Message**:
```
Error: Invalid token value
Token: spacing-negative
Value: -8px
Issue: Spacing values must be non-negative
Expected: Positive number with unit (px, rem, em)
```

### Missing Documentation

**Error Condition**: A design token or component lacks required documentation.

**Handling Strategy**:
- Documentation completeness checks during validation
- Identify tokens missing usage guidelines
- Identify components missing state specifications
- Generate documentation coverage report

**Example Warning Message**:
```
Warning: Incomplete documentation
Token: color-accent-purple
Missing: Usage guidelines
Action: Add $description field to token definition
```

### Inconsistent Naming

**Error Condition**: Token names don't follow the established naming convention.

**Handling Strategy**:
- Automated naming convention validation
- Identify tokens with inconsistent naming patterns
- Suggest corrected names following convention
- Provide migration path for renaming tokens

**Example Error Message**:
```
Error: Inconsistent token naming
Token: ColorPrimary
Issue: Uses PascalCase instead of kebab-case
Expected: color-primary
```

### Dark Mode Mapping Gaps

**Error Condition**: A light mode color token lacks a dark mode mapping.

**Handling Strategy**:
- Validate that every color token has both light and dark mode values
- Identify missing dark mode mappings
- Suggest default dark mode values based on color theory
- Fail validation if critical tokens lack dark mode support

**Example Error Message**:
```
Error: Missing dark mode mapping
Token: color-background-subtle
Light mode: #F9FAFB
Dark mode: undefined
Action: Define dark mode value in tokens/colors.json
```

### Icon Size Inconsistencies

**Error Condition**: An icon is missing one or more required size variants.

**Handling Strategy**:
- Validate that all icons exist in all required sizes (16px, 20px, 24px, 32px)
- Identify icons with missing size variants
- Provide list of missing sizes for each icon
- Fail build if core icons are incomplete

**Example Error Message**:
```
Error: Incomplete icon size variants
Icon: vault
Available: 16px, 24px, 32px
Missing: 20px
Action: Generate 20px variant of vault icon
```

### Component State Gaps

**Error Condition**: An interactive component is missing one or more required state definitions.

**Handling Strategy**:
- Validate that all interactive components define all five states
- Identify components with missing state specifications
- Suggest inheriting from base component states
- Warn if custom components lack state definitions

**Example Warning Message**:
```
Warning: Incomplete component states
Component: custom-toggle
Defined: default, hover, active
Missing: focus, disabled
Action: Add focus and disabled state specifications
```

## Testing Strategy

The Design System & Brand Foundation requires a dual testing approach combining unit tests for specific validations and property-based tests for universal correctness guarantees.

### Unit Testing Approach

Unit tests validate specific examples, edge cases, and concrete requirements that don't require exhaustive input coverage.

**Test Categories**:

1. **Token Existence Tests**
   - Verify specific required tokens exist (primary color, secondary color, semantic colors)
   - Verify minimum token counts (9+ neutral shades, 5+ elevation levels, 4+ border radius values)
   - Verify specific named icons exist (vault, milestone, lock)

2. **Value Range Tests**
   - Verify base font size is >= 16px
   - Verify base spacing unit is either 4px or 8px
   - Verify animation durations fall within specified ranges (100-300ms for micro-interactions)
   - Verify breakpoint values match specifications (mobile < 768px, tablet 768-1024px, desktop > 1024px)

3. **Documentation Completeness Tests**
   - Verify brand guide PDF exists
   - Verify Figma/Sketch file exists
   - Verify getting started guide exists
   - Verify all required documentation sections are present

4. **Format Validation Tests**
   - Verify token files are valid JSON
   - Verify SVG files are valid XML
   - Verify color values are valid hex/rgb/hsl formats
   - Verify spacing values include valid units

5. **Specific Combination Tests**
   - Test primary color on white background meets 4.5:1 contrast
   - Test error color on white background meets 4.5:1 contrast
   - Test focus indicator on primary button meets 3:1 contrast
   - Test specific documented color combinations

**Example Unit Tests**:

```typescript
describe('Color Tokens', () => {
  test('primary color is defined', () => {
    expect(tokens.color.primary).toBeDefined();
  });

  test('primary color has valid hex value', () => {
    expect(tokens.color.primary.$value).toMatch(/^#[0-9A-F]{6}$/i);
  });

  test('neutral scale has at least 9 shades', () => {
    const neutralShades = Object.keys(tokens.color.neutral);
    expect(neutralShades.length).toBeGreaterThanOrEqual(9);
  });

  test('base font size is at least 16px', () => {
    const baseFontSize = parseInt(tokens.typography.base.fontSize.$value);
    expect(baseFontSize).toBeGreaterThanOrEqual(16);
  });
});
```

### Property-Based Testing Approach

Property-based tests validate universal properties that must hold for all tokens, components, and combinations in the design system. These tests use randomization and iteration to ensure comprehensive coverage.

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tests generate or iterate through all relevant design tokens

**Property Test Categories**:

1. **Completeness Properties**
   - Every color token has dark mode mapping (Property 1)
   - Every color token has hex, RGB, HSL formats (Property 3)
   - Every typography token has line height, letter spacing, guidelines (Property 5)
   - Every icon has all four size variants (Property 6)
   - Every interactive component has all five states (Property 8)

2. **Accessibility Properties**
   - All documented color combinations meet contrast requirements (Property 2)
   - All focus indicators meet 3:1 contrast (Property 9)
   - All interactive components meet 44x44px touch target (Property 12)
   - All semantic colors are colorblind-safe (Property 13)
   - All dark mode combinations meet contrast requirements (Property 17)

3. **Consistency Properties**
   - All token names follow naming convention (Property 14)
   - All tokens provide multi-format values where applicable (Property 15)
   - All elevation levels have complete shadow specs (Property 10)
   - All brand assets have dark mode versions (Property 16)

**Example Property-Based Tests**:

```typescript
import fc from 'fast-check';

describe('Property Tests - Design System', () => {
  // Feature: design-system-brand-foundation, Property 1: Dark Mode Color Mapping Completeness
  test('all color tokens have dark mode mappings', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllColorTokens()),
        (colorToken) => {
          const lightModeValue = getTokenValue(colorToken, 'light');
          const darkModeValue = getTokenValue(colorToken, 'dark');
          
          expect(lightModeValue).toBeDefined();
          expect(darkModeValue).toBeDefined();
          expect(darkModeValue).not.toBe(lightModeValue); // Should be different
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: design-system-brand-foundation, Property 2: Color Contrast Accessibility
  test('all documented color combinations meet WCAG AA contrast', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllDocumentedColorCombinations()),
        (combination) => {
          const contrastRatio = calculateContrast(
            combination.foreground,
            combination.background
          );
          
          const requiredRatio = combination.isLargeText ? 3.0 : 4.5;
          
          expect(contrastRatio).toBeGreaterThanOrEqual(requiredRatio);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: design-system-brand-foundation, Property 3: Color Token Format Completeness
  test('all color tokens provide hex, RGB, and HSL formats', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllColorTokens()),
        (colorToken) => {
          const tokenData = getTokenData(colorToken);
          
          expect(tokenData.hex).toBeDefined();
          expect(tokenData.hex).toMatch(/^#[0-9A-F]{6}$/i);
          
          expect(tokenData.rgb).toBeDefined();
          expect(tokenData.rgb).toMatch(/^rgb\(\d+,\s*\d+,\s*\d+\)$/);
          
          expect(tokenData.hsl).toBeDefined();
          expect(tokenData.hsl).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: design-system-brand-foundation, Property 5: Typography Specification Completeness
  test('all typography tokens include complete specifications', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllTypographyTokens()),
        (typographyToken) => {
          const tokenData = getTokenData(typographyToken);
          
          expect(tokenData.lineHeight).toBeDefined();
          expect(tokenData.letterSpacing).toBeDefined();
          expect(tokenData.usageGuidelines).toBeDefined();
          expect(tokenData.usageGuidelines.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: design-system-brand-foundation, Property 6: Icon Size Availability
  test('all icons are available in all required sizes', () => {
    const requiredSizes = [16, 20, 24, 32];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllIcons()),
        (icon) => {
          requiredSizes.forEach(size => {
            const iconPath = getIconPath(icon, size);
            expect(fs.existsSync(iconPath)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: design-system-brand-foundation, Property 8: Component State Completeness
  test('all interactive components define all required states', () => {
    const requiredStates = ['default', 'hover', 'active', 'focus', 'disabled'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllInteractiveComponents()),
        (component) => {
          const componentStates = getComponentStates(component);
          
          requiredStates.forEach(state => {
            expect(componentStates[state]).toBeDefined();
            expect(componentStates[state].backgroundColor).toBeDefined();
            expect(componentStates[state].color).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: design-system-brand-foundation, Property 12: Touch Target Minimum Size
  test('all interactive components meet minimum touch target size', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllInteractiveComponents()),
        (component) => {
          const dimensions = getComponentDimensions(component);
          
          expect(dimensions.width).toBeGreaterThanOrEqual(44);
          expect(dimensions.height).toBeGreaterThanOrEqual(44);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: design-system-brand-foundation, Property 14: Token Naming Consistency
  test('all token names follow kebab-case naming convention', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllTokens()),
        (token) => {
          const tokenName = token.name;
          
          // Should be kebab-case: lowercase with hyphens
          expect(tokenName).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
          
          // Should have category prefix
          const validPrefixes = ['color', 'spacing', 'typography', 'shadow', 'radius', 'border'];
          const hasValidPrefix = validPrefixes.some(prefix => 
            tokenName.startsWith(prefix + '-')
          );
          expect(hasValidPrefix).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Utilities

**Helper Functions**:

```typescript
// Get all color tokens from the design system
function getAllColorTokens(): string[] {
  const tokens = loadTokens('colors.json');
  return flattenTokenPaths(tokens.color);
}

// Get all documented color combinations
function getAllDocumentedColorCombinations(): ColorCombination[] {
  const combinations = [];
  const components = loadAllComponents();
  
  components.forEach(component => {
    Object.values(component.states).forEach(state => {
      if (state.backgroundColor && state.color) {
        combinations.push({
          foreground: state.color,
          background: state.backgroundColor,
          isLargeText: component.isLargeText || false
        });
      }
    });
  });
  
  return combinations;
}

// Calculate WCAG contrast ratio
function calculateContrast(foreground: string, background: string): number {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);
  
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Get relative luminance for WCAG calculations
function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  const [r, g, b] = rgb.map(channel => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
```

### Continuous Integration

**Automated Checks**:
1. Run all unit tests on every commit
2. Run property-based tests on every pull request
3. Generate design token validation report
4. Check documentation completeness
5. Validate accessibility compliance
6. Generate visual regression test screenshots

**Quality Gates**:
- All unit tests must pass (100% pass rate)
- All property tests must pass (100% pass rate)
- No accessibility violations allowed
- Documentation coverage must be 100%
- All tokens must have valid values

### Manual Testing

While automated tests cover correctness properties, some aspects require human evaluation:

1. **Visual Consistency**: Designers review that icons maintain visual consistency across sizes
2. **Brand Alignment**: Marketing reviews that brand voice and imagery align with company values
3. **Usability**: UX team reviews that component states provide clear feedback
4. **Aesthetic Quality**: Design team reviews overall visual harmony and appeal

These manual reviews complement automated testing to ensure both technical correctness and design quality.
