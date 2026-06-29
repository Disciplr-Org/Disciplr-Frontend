# Pagination

`src/components/Pagination.tsx` is the shared pagination control for list pages.
It renders from the existing `paginate` utility result so item slicing remains
owned by `src/utils/paginate.ts`.

## Contract

- Previous and next controls are disabled at the first and last page.
- Numbered page buttons call `onPageChange(page)`.
- The active page uses `aria-current="page"`.
- Every control has an `aria-label`.
- Empty lists still render as page `1 of 1` with a `0 items` status.

## Notification Page

`src/pages/Notification.tsx` keeps the existing `itemsPerPage = 5` behavior and
uses `Pagination` for navigation. Filtering, dismissing, and clearing
notifications continue to reset the current page to `1`.
