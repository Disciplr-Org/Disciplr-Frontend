# CountdownDeadline

`CountdownDeadline` renders a live, accessible countdown for vault deadlines. It exports both the component and a pure `timeRemaining(deadline, now)` helper so vault surfaces can share the same urgency thresholds.

## Thresholds

| State | Threshold | Tone | Color token |
| --- | --- | --- | --- |
| Normal | More than 24 hours remaining | `normal` | `--muted` |
| Urgent | More than 0 and less than 24 hours remaining | `urgent` | `--warning` |
| Expired / Overdue | Deadline is now or in the past | `expired` | `--danger` |
| Invalid | Deadline cannot be parsed as a date | `invalid` | `--danger` |

The component sets `title` and `aria-label` to include the absolute deadline and uses `aria-live="off"` so the interval updates do not create noisy announcements for assistive technology users.

## Expired / Overdue state

When the deadline has passed, the component renders an **"Overdue"** label styled with `--danger` tokens and `data-tone="expired"`.

```tsx
// deadline already in the past — renders "Overdue" in danger color
<CountdownDeadline deadline="2026-01-01T00:00:00Z" />
```

## `onExpire` callback

Use the optional `onExpire` prop to react when a countdown crosses zero **during the component's lifetime**.

```tsx
<CountdownDeadline
  deadline={vault.deadline}
  onExpire={() => refetchVerifierQueue()}
/>
```

**Behaviour guarantees:**

- Fired **at most once** per mount — repeated ticks after expiry do not re-fire.
- **Not** fired when the component mounts with a deadline already in the past (no retroactive callbacks). This prevents spurious side-effects when a page loads with stale data.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `deadline` | `string` | — | ISO 8601 date string |
| `intervalMs` | `number` | `60000` | Polling interval in milliseconds |
| `prefix` | `string` | — | Optional text prepended to the label, e.g. `"Due:"` |
| `style` | `CSSProperties` | — | Inline styles forwarded to the inner `<span>` |
| `onExpire` | `() => void` | — | Called once when countdown crosses zero mid-session |

## Usage

```tsx
<CountdownDeadline deadline={vault.deadline} />
```

Use the helper in tests or non-React logic:

```ts
timeRemaining(vault.deadline, new Date())
```
