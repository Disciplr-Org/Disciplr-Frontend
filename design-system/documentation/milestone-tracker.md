# MilestoneTracker

`MilestoneTracker` renders the ordered milestone progression for a vault in a
single reusable component.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `milestones` | `Milestone[]` | Ordered milestone records from `VaultDetail`. |

## States

| State | Behavior |
| --- | --- |
| Empty array | Renders a short empty state instead of an empty list shell. |
| `validated` | Uses the semantic success color token and shows the validation timestamp when present. |
| `pending` | Uses the warning token and is treated as the current step when it is the first pending milestone after the validated steps. |
| `failed` | Uses the danger token and is rendered as a terminal failed step. |

## Token Usage

- `var(--success)` for validated milestones.
- `var(--warning)` for pending milestones.
- `var(--danger)` for failed milestones.
- `var(--muted)`, `var(--border)`, `var(--bg)`, and `var(--accent)` for supporting text, borders, and links.

## Accessibility

- The current pending step is exposed with `aria-current="step"`.
- Evidence links remain native anchors and are keyboard reachable.

## Integration

- `src/pages/VaultDetail.tsx`
