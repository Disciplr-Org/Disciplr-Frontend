# Pagination

Use `Pagination` when a view shows a bounded list and already has a
`paginate(...)` result from `src/utils/paginate.ts`.

```tsx
const pagination = paginate(items, currentPage, pageSize);

<Pagination
  pagination={pagination}
  onPageChange={setCurrentPage}
  ariaLabel="Notifications pagination"
/>
```

## Accessibility

- The wrapper is a `nav` landmark with a configurable `aria-label`.
- Previous and next controls expose action-specific labels.
- Numbered page buttons expose `aria-label="Go to page N"`.
- The active page uses `aria-current="page"`.
- Boundary controls are disabled on the first and last pages.

`paginate` clamps empty lists and out-of-range page requests to page `1`, so
consumers can safely reuse stale page state after filters or deletions.
