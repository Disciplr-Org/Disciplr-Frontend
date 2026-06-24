# Error Boundary

`ErrorBoundary` is a class-based render error boundary for route and feature
subtrees. The app wraps the `Routes` tree with it so a page-level render error
does not leave the shell blank.

## Behavior

- Implements `getDerivedStateFromError` to show the fallback after a render
  exception.
- Implements `componentDidCatch` and accepts an injectable `reporter(error,
  errorInfo)` callback for tests or telemetry.
- `Try again` clears the boundary state, allowing the current subtree to render
  again after the underlying error is resolved.
- `Go Home` links to `/` for route recovery.

## Fallback Tokens

- Background: `--surface`
- Border: `--border`
- Body text: `--text`
- Supporting copy: `--muted`
- Primary reset action: `--accent` on `--bg`

The fallback uses `role="alert"` and `aria-live="assertive"` so screen readers
announce the recovery state when an error is caught.

## Usage

```tsx
<ErrorBoundary reporter={reportRenderError}>
  <Routes>{/* route tree */}</Routes>
</ErrorBoundary>
```

Wrap narrower subtrees the same way when a feature needs isolated recovery
without resetting the entire route area.
