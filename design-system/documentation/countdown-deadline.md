# CountdownDeadline Component

`CountdownDeadline` renders the live time remaining before a vault deadline. It is shared by vault cards, vault detail timelines, and verifier pending-validation queues so deadline urgency is presented consistently.

## API

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `deadline` | `string` | Yes | ISO date/time string used for the countdown target. |
| `labelPrefix` | `string` | No | Accessible prefix for `aria-label` and `title`; defaults to `Deadline`. |
| `className` | `string` | No | Optional class name for layout integration. |

The module also exports `timeRemaining(deadline, now)` for deterministic formatting and urgency calculations.

## Thresholds

| State | Condition | Token | Example label |
|-------|-----------|-------|---------------|
| Neutral | `>= 24h` remaining | `--muted` | `14d 10h left` |
| Warning | `< 24h` remaining | `--warning` | `20h 30m left` |
| Expired | `<= 0ms` remaining | `--danger` | `Expired` |

## Accessibility

- The visible countdown is concise, while `aria-label` and `title` include the absolute deadline.
- `aria-live="off"` prevents noisy announcements while the minute timer updates.
- Urgency is represented by the text label and the token color, so color is not the only signal.

## Usage

```tsx
import { CountdownDeadline } from '../components/CountdownDeadline'

<CountdownDeadline deadline={vault.deadline} labelPrefix="Vault deadline" />
```

For deterministic tests or derived calculations:

```ts
import { timeRemaining } from '../components/CountdownDeadline'

const remaining = timeRemaining(deadline, new Date('2024-07-01T00:00:00Z'))
```
