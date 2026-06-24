# Toast Feedback

Transient user feedback is handled by `useToastStore` in `src/Zustand/Store.ts`
and rendered once by `Toaster` in `Layout`.

- `push({ kind, message })` accepts `success`, `error`, or `info` and returns the toast id.
- `dismiss(id)` removes a toast and cancels its auto-dismiss timer.
- The queue keeps the four newest toasts so repeated actions cannot flood the viewport.
- Toasts auto-dismiss after five seconds; tests should use fake timers instead of real waits.
- Success and info toasts render with `aria-live="polite"` through `role="status"`.
- Error toasts render with `aria-live="assertive"` through `role="alert"`.
- Every toast includes a native button dismissal control, so keyboard users can clear feedback without waiting for the timer.
