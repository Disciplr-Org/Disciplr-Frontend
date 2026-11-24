# Switch / Toggle

A fully accessible Switch primitive that implements the
[WAI-ARIA switch role](https://www.w3.org/WAI/ARIA/apg/patterns/switch/).

## Usage

```tsx
import { Switch } from '@/components/Switch';

<Switch
  label="Email Notification"
  checked={enabled}
  onChange={(checked) => setEnabled(checked)}
/>
```

## Props

| Prop       | Type                       | Default     | Description                                    |
|------------|----------------------------|-------------|------------------------------------------------|
| `checked`  | `boolean`                  | —           | Controlled checked state (required)            |
| `onChange` | `(checked: boolean) => void` | —         | Called with the new value when toggled (required) |
| `label`    | `string`                   | —           | Accessible label exposed as `aria-label` (required) |
| `disabled` | `boolean`                  | `false`     | Prevents interaction and applies muted styling |
| `id`       | `string`                   | `undefined` | Optional id forwarded to the button element    |

## Accessibility

- Uses `role="switch"` and `aria-checked` to communicate state to assistive technology.
- Keyboard activation: **Space** and **Enter** both toggle the switch.
- Focus ring uses the `--accent-transparent` design token (4 px box-shadow).
- The `disabled` attribute blocks all interaction and signals the disabled state
  to screen readers.

## Design Tokens

| Token                  | Usage                                     |
|------------------------|-------------------------------------------|
| `--accent`             | Track background when checked             |
| `--surface-raised`     | Track background when unchecked           |
| `--border`             | Track and thumb border                    |
| `--surface`            | Thumb background when checked             |
| `--bg`                 | Thumb background when unchecked           |
| `--accent-transparent` | Focus ring shadow                         |
| `--radius-full`        | Track and thumb border-radius             |

## Examples

### Controlled toggle

```tsx
const [on, setOn] = useState(false);

<Switch label="Push Notification" checked={on} onChange={setOn} />
```

### Disabled state

```tsx
<Switch label="Locked Setting" checked={true} onChange={() => {}} disabled />
```

## Adoption in NotificationSettings

`NotificationSettings` uses `Switch` for the Email and Push preference toggles,
replacing the earlier ad-hoc checkbox pattern. The component receives the
boolean state directly from the `useNotificationPreferences` Zustand store and
calls the corresponding store setter on change.
