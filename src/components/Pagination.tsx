import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationResult } from "@/utils/paginate";

interface PaginationProps {
  pagination: Pick<
    PaginationResult<unknown>,
    "currentPage" | "pageCount" | "totalItems"
  >;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
  className?: string;
}

type PageControl = number | "ellipsis";

function getPageControls(currentPage: number, pageCount: number): PageControl[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const leftSibling = Math.max(currentPage - 1, 2);
  const rightSibling = Math.min(currentPage + 1, pageCount - 1);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < pageCount - 1;

  if (!showLeftDots && showRightDots) {
    return [1, 2, 3, 4, 5, "ellipsis", pageCount];
  }

  if (showLeftDots && !showRightDots) {
    return [1, "ellipsis", pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", pageCount];
}

export function Pagination({
  pagination,
  onPageChange,
  ariaLabel = "Pagination",
  className = "",
}: PaginationProps) {
  const { currentPage, pageCount, totalItems } = pagination;
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= pageCount;
  const pages = getPageControls(currentPage, pageCount);

  return (
    <nav
      aria-label={ariaLabel}
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <p className="text-sm text-gray-600" aria-live="polite">
        Page {currentPage} of {pageCount}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={isFirstPage}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center gap-1 rounded bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Go to previous page"
        >
          <ChevronLeft aria-hidden="true" size={16} />
          Previous
        </button>

        <div className="flex flex-wrap justify-center gap-1">
          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded px-3 text-sm text-gray-500"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
                className={`h-9 min-w-9 rounded px-3 text-sm font-medium ${
                  page === currentPage
                    ? "bg-[var(--accent)] text-[var(--bg)]"
                    : "bg-[var(--surface)] text-[var(--text)] ring-1 ring-gray-300 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          disabled={isLastPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 rounded bg-[var(--accent)] px-3 py-2 text-sm text-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Go to next page"
        >
          Next
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      </div>

      <span className="sr-only">{totalItems} total items</span>
    </nav>
  );
}
