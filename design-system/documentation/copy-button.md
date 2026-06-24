# Copy Button

`CopyButton` in `src/components/CopyButton.tsx` copies full addresses and
transaction hashes while the surrounding UI may keep displaying truncated text.

- Pass the full `value` and a specific accessible `label`, such as `Copy address`.
- Tests can inject a `ClipboardAdapter` from `src/components/copyClipboard.ts`
  with `writeText(value)`; production uses `navigator.clipboard.writeText`.
- Clipboard rejection and missing browser clipboard support show `Copy failed`
  through an `aria-live="polite"` status instead of throwing.
- Successful copies announce `Copied` and reset after the configured timeout.
- Empty values disable the control so no empty clipboard write is attempted.
