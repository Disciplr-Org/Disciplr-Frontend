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

export function Pagination({
  pagination,
  onPageChange,
  ariaLabel = "Pagination",
  className = "",
}: PaginationProps) {
  const { currentPage, pageCount, totalItems } = pagination;
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= pageCount;
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

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
          className="inline-flex items-center gap-1 rounded bg-[#121a2a] px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Go to previous page"
        >
          <ChevronLeft aria-hidden="true" size={16} />
          Previous
        </button>

        <div className="flex flex-wrap justify-center gap-1">
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              className={`h-9 min-w-9 rounded px-3 text-sm font-medium ${
                page === currentPage
                  ? "bg-[#00c389] text-[#121a2a]"
                  : "bg-white text-[#121a2a] ring-1 ring-gray-300 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={isLastPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 rounded bg-[#00c389] px-3 py-2 text-sm text-[#121a2a] disabled:cursor-not-allowed disabled:opacity-50"
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
