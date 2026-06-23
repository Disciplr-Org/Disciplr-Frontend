# Token Authoring Guide

Use this guide when adding or editing JSON tokens under `design-system/tokens/`.
Disciplr tokens follow the Design Tokens Community Group (DTCG) shape where it
fits the existing runtime mappings:

- Every token file starts with the DTCG `$schema` URL.
- Leaf tokens use `$type`, `$value`, and an optional `$description`.
- Mode-specific colors are grouped as `light` and `dark` leaf tokens.
- Composite tokens, such as typography, keep each nested value in a
  `{ "$value": ... }` object so tooling can read the parts independently.

## Naming

Token names should flatten to lowercase kebab-case. For example,
`color.action.review.light` becomes `color-action-review-light` when validating
names or generating runtime variables.

The current name validators require one of these flattened prefixes:

| Prefix | Token files |
| --- | --- |
| `color-` | `colors.json`, including chart colors |
| `spacing-` | `spacing.json` |
| `typography-` | `typography.json` |
| `shadow-` | `shadows.json` |
| `radius-` | `borders.json` radius entries |
| `border-` | `borders.json` width and color entries |
| `motion-` | `motion.json` |

Valid examples:

- `color-action-review`
- `color-chart-categorical-step-1`
- `spacing-container-wide`
- `typography-title-sm`
- `shadow-level-2`
- `radius-md`
- `border-default`
- `motion-duration-fast`

Invalid examples:

- `Color-action-review` uses uppercase.
- `color--action` has an empty segment.
- `chart-categorical-step-1` is missing the `color-` prefix used by chart
  color tokens.
- `color` has no token name after the prefix.

## Color Tokens

Use `$type: "color"` and a supported `$value` string:

- Six-digit hex: `#2563EB`
- RGB: `rgb(37, 99, 235)`
- HSL: `hsl(221, 83%, 53%)`

Accessibility metadata is optional, but use it whenever a token is consumed by
text, icons, focus rings, charts, status badges, or controls. The validator
currently accepts `wcagLevel` values of `AA` or `AAA`, a boolean
`colorblindSafe`, and `colorblindSimulation` values for `protanopia`,
`deuteranopia`, and `tritanopia`.

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format.json",
  "color": {
    "action": {
      "review": {
        "light": {
          "$type": "color",
          "$value": "#2563EB",
          "$description": "Review action color in light mode",
          "accessibility": {
            "wcagLevel": "AA",
            "colorblindSafe": true,
            "colorblindSimulation": {
              "protanopia": "#2564EB",
              "deuteranopia": "#2563EB",
              "tritanopia": "#2563EC"
            }
          }
        },
        "dark": {
          "$type": "color",
          "$value": "#60A5FA",
          "$description": "Review action color in dark mode",
          "accessibility": {
            "wcagLevel": "AA",
            "colorblindSafe": true
          }
        }
      }
    }
  }
}
```

## Chart Tokens

Chart tokens live in `colors.json` under the `color.chart` group and should
flatten with the `color-` prefix, for example `color-chart-axis-light`.

The chart validator requires these surface keys:

- `axis`
- `grid`
- `tooltipBg`
- `tooltipBorder`
- `tooltipText`
- `tooltipLabel`

It also requires `categorical` and `sequential` ramps with at least five steps
each. Every surface token and ramp step must contain both `light` and `dark`
color tokens.

```json
{
  "axis": {
    "light": { "$type": "color", "$value": "#334155" },
    "dark": { "$type": "color", "$value": "#CBD5E1" }
  },
  "grid": {
    "light": { "$type": "color", "$value": "#E2E8F0" },
    "dark": { "$type": "color", "$value": "#334155" }
  },
  "tooltipBg": {
    "light": { "$type": "color", "$value": "#FFFFFF" },
    "dark": { "$type": "color", "$value": "#0F172A" }
  },
  "tooltipBorder": {
    "light": { "$type": "color", "$value": "#CBD5E1" },
    "dark": { "$type": "color", "$value": "#475569" }
  },
  "tooltipText": {
    "light": { "$type": "color", "$value": "#0F172A" },
    "dark": { "$type": "color", "$value": "#F8FAFC" }
  },
  "tooltipLabel": {
    "light": { "$type": "color", "$value": "#475569" },
    "dark": { "$type": "color", "$value": "#CBD5E1" }
  },
  "categorical": {
    "step-1": {
      "light": { "$type": "color", "$value": "#2563EB" },
      "dark": { "$type": "color", "$value": "#60A5FA" }
    },
    "step-2": {
      "light": { "$type": "color", "$value": "#0D9488" },
      "dark": { "$type": "color", "$value": "#2DD4BF" }
    },
    "step-3": {
      "light": { "$type": "color", "$value": "#7C3AED" },
      "dark": { "$type": "color", "$value": "#A78BFA" }
    },
    "step-4": {
      "light": { "$type": "color", "$value": "#EA580C" },
      "dark": { "$type": "color", "$value": "#FDBA74" }
    },
    "step-5": {
      "light": { "$type": "color", "$value": "#DC2626" },
      "dark": { "$type": "color", "$value": "#FCA5A5" }
    }
  },
  "sequential": {
    "step-1": {
      "light": { "$type": "color", "$value": "#EFF6FF" },
      "dark": { "$type": "color", "$value": "#172554" }
    },
    "step-2": {
      "light": { "$type": "color", "$value": "#BFDBFE" },
      "dark": { "$type": "color", "$value": "#1E3A8A" }
    },
    "step-3": {
      "light": { "$type": "color", "$value": "#60A5FA" },
      "dark": { "$type": "color", "$value": "#1D4ED8" }
    },
    "step-4": {
      "light": { "$type": "color", "$value": "#2563EB" },
      "dark": { "$type": "color", "$value": "#3B82F6" }
    },
    "step-5": {
      "light": { "$type": "color", "$value": "#1E40AF" },
      "dark": { "$type": "color", "$value": "#93C5FD" }
    }
  }
}
```

## Spacing, Breakpoints, Borders, And Radius

Use `$type: "dimension"` for lengths that compile to CSS or Tailwind values.
Prefer explicit pixel values such as `"16px"` for spacing, radius, border
widths, breakpoint minimum widths, container widths, gaps, and touch targets.

Keep semantic groups separate:

- `spacing.*` numeric keys and `spacing.base` for reusable spacing increments.
- `spacing.container.*` for layout max widths.
- `breakpoint.*` for responsive thresholds.
- `grid.*` for column, gutter, and margin tokens.
- `border.radius.*` and `border.width.*` for shape and stroke sizing.
- `border.color.*` for light/dark border colors.

The current TypeScript validators do not enforce dimension tokens directly.
They are authoring conventions backed by `tokens/spacing.json`,
`tokens/borders.json`, runtime CSS variables, and documentation such as
`breakpoints.md`.

## Typography Tokens

Use the existing DTCG-like typography shape:

- `fontFamily` leaf tokens use `$type: "fontFamily"`.
- `fontWeight` leaf tokens use `$type: "fontWeight"`.
- Responsive text styles use `$type: "typography"` and nested values for
  `fontSize`, `lineHeight`, `fontWeight`, and `letterSpacing`.

Each object key in JSON must be unique. When adding responsive styles, check for
duplicate keys such as a repeated `display` block because JSON parsers keep only
the last value.

```json
{
  "$type": "typography",
  "fontSize": { "$value": "20px" },
  "lineHeight": { "$value": "28px" },
  "fontWeight": { "$value": 600 },
  "letterSpacing": { "$value": "0" },
  "$description": "Compact title text"
}
```

## Shadows And Motion

Shadow tokens use `$type: "shadow"` and may set `$value` to `"none"` or to an
array of shadow layers. Each layer should keep offset, blur, spread, and color
explicit so downstream CSS generation stays deterministic.

Motion tokens use the existing groups in `motion.json`:

- Duration tokens use `$type: "duration"` and millisecond values such as
  `"150ms"`.
- Easing tokens use `$type: "cubicBezier"` and four-number arrays.
- Reduced-motion preferences use boolean `$value` entries.

The current validators do not enforce shadow or motion shapes directly. Keep
their JSON structure aligned with the existing files and update runtime utilities
when the token names or value shapes change.

## Authoring Checklist

- Add or edit tokens in the relevant file under `tokens/`.
- Keep token names lowercase, kebab-case when flattened, and under a supported
  prefix.
- Use `$type`, `$value`, and `$description` on every leaf token.
- Provide `light` and `dark` variants for color tokens consumed in UI surfaces.
- Add accessibility metadata for UI colors with contrast or colorblind-safety
  requirements.
- Keep chart ramps to at least five `light`/`dark` steps.
- Update runtime CSS variables or utility maps when token names or value shapes
  change.
- Update `documentation/token-catalog.md` and any focused docs that consume the
  changed token group.
- Run the design-system Jest tests before opening a PR.

## Current Validation Coverage

`src/utils/validators.ts` currently enforces raw color strings, flattened token
name syntax, supported token prefixes, color token shape, optional color
accessibility metadata, and complete chart token groups.

Spacing, typography, border, radius, shadow, and motion sections in this guide
are authoring conventions until matching validators are added.
