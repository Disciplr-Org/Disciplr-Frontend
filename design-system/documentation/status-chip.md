# StatusChip

The `StatusChip` component is the single source of truth for rendering status badges across the application. It normalizes all validation and vault states to an accessible badge driven purely by design system semantic tokens.

## Usage

```tsx
import { StatusChip } from '../components/StatusChip';
import { Badge } from '../components/Badge';

// Default rendering (uses pre-configured label and semantic token)
<StatusChip status="pending_validation" />

// Overriding label text while preserving semantic meaning
<StatusChip status="pending_validation" label="Pending" size="sm" />

// Generic count or tier label
<Badge tone="warning" size="sm">Due soon</Badge>
<Badge tone="info" aria-label="3 unread notifications">3</Badge>
```

## Props

### StatusChip

- `status` (`ChipStatus`): The current status. Maps directly to a semantic token and default label.
  - Allowed values: `'active'`, `'pending_validation'`, `'completed'`, `'failed'`, `'cancelled'`, `'approved'`, `'rejected'`.
- `label` (`string`, optional): An optional override for the default text label.
- `size` (`'sm' | 'md' | 'lg'`, optional): Controls the padding and font size of the chip. Defaults to `'md'`.
- `className` (`string`, optional): Additional classes to apply to the chip.

### Badge

- `tone` (`'neutral' | 'info' | 'success' | 'warning' | 'danger'`, optional): Maps generic badge emphasis to semantic color tokens. Defaults to `'neutral'`.
- `size` (`'sm' | 'md' | 'lg'`, optional): Controls compact, default, and large badge density. Defaults to `'md'`.
- `children` (`React.ReactNode`): The visible count, tier, or label.
- Standard span attributes including `aria-label`, `className`, and `style`.

## Status to Token Mapping

The chip uses `color-mix` to automatically generate transparent background colors based on existing root tokens. No new hex values are introduced.

| Status | Default Label | Color Token | Background Generation |
| :--- | :--- | :--- | :--- |
| `active` | Active | `var(--accent)` | `var(--accent-transparent)` |
| `completed` | Completed | `var(--success)` | `color-mix(in srgb, var(--success) 10%, transparent)` |
| `failed` | Failed | `var(--danger)` | `color-mix(in srgb, var(--danger) 10%, transparent)` |
| `cancelled` | Cancelled | `var(--muted)` | `color-mix(in srgb, var(--muted) 10%, transparent)` |
| `pending_validation` | Pending Validation | `var(--warning)` | `color-mix(in srgb, var(--warning) 10%, transparent)` |
| `approved` | Approved | `var(--success)` | `color-mix(in srgb, var(--success) 10%, transparent)` |
| `rejected` | Rejected | `var(--danger)` | `color-mix(in srgb, var(--danger) 10%, transparent)` |

## Badge Tone Mapping

`Badge` is for generic counts and tier labels, not workflow statuses. It uses the
same semantic token palette as `StatusChip`.

| Tone | Color Token | Background Generation |
| :--- | :--- | :--- |
| `neutral` | `var(--muted)` | `color-mix(in srgb, var(--muted) 10%, transparent)` |
| `info` | `var(--info)` | `color-mix(in srgb, var(--info) 10%, transparent)` |
| `success` | `var(--success)` | `var(--success-transparent)` |
| `warning` | `var(--warning)` | `var(--warning-transparent)` |
| `danger` | `var(--danger)` | `var(--danger-transparent)` |

## Accessibility

- The component exposes its status using an implicit `role="status"` and includes an accessible `aria-label` covering the underlying meaning, regardless of whether a custom `label` string is passed in or not.
- Semantic colors match contrast minimums since the root tokens (`--danger`, `--success`, etc.) have already been vetted, and the background uses a 10% opacity multiplier against white/black.
- Numeric `Badge` content receives a default `aria-label` such as `Count: 3`. Callers should pass a more specific label, for example `aria-label="3 overdue validations"`, when the surrounding text does not already describe the count.
