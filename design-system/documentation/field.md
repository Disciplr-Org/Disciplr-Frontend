# Field Component

A reusable form field component that bundles a label, input, hint text, and error state.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| label | string | ✅ | The field label text |
| hint | string | ❌ | Optional hint text to display below the input |
| error | string | ❌ | Optional error text to display (overrides hint) |
| required | boolean | ❌ | Whether the field is required (adds asterisk and required attribute) |
| ...inputProps | InputHTMLAttributes | ❌ | All native input props are passed through |

## Example Usage

```tsx
import { Field } from '../components/Field'

<Field
  label="Amount (USDC)"
  type="text"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  placeholder="1000"
  required
/>
```

## Validation Pattern

Pass validation messages through the `error` prop so `Field` can render an inline
message, set `aria-invalid`, and associate the input with the error text via
`aria-describedby`.

```tsx
<Field
  label="Success destination (Stellar address)"
  type="text"
  value={successAddress}
  onChange={(e) => setSuccessAddress(e.target.value)}
  error={errors.successAddress}
  required
/>
```

Form submit handlers should validate all values before calling backend or
contract code. For vault creation, reject empty or non-positive USDC amounts,
amounts with more than 7 decimal places, invalid or past deadlines, malformed
Stellar public keys, and identical success/failure destinations.
