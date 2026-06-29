import type { PaginationResult } from "@/utils/paginate";

interface PaginationProps {
  pagination: PaginationResult<unknown>;
  onPageChange: (page: number) => void;
  label?: string;
}

function buildPages(pageCount: number): number[] {
  return Array.from({ length: pageCount }, (_, index) => index + 1);
}

export function Pagination({
  pagination,
  onPageChange,
  label = "Pagination",
}: PaginationProps) {
  const { currentPage, pageCount, totalItems } = pagination;
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= pageCount;

  return (
    <nav
      aria-label={label}
      className="flex flex-wrap items-center justify-center gap-3 mt-8"
    >
      <button
        type="button"
        disabled={isFirstPage}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Go to previous page"
        className="px-4 py-2 bg-[#121a2a] rounded disabled:opacity-50 text-white"
      >
        Previous
      </button>

      <ol className="flex flex-wrap items-center justify-center gap-2">
        {buildPages(pageCount).map((page) => (
          <li key={page}>
            <button
              type="button"
              onClick={() => onPageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              className={`min-w-10 rounded px-3 py-2 ${
                page === currentPage
                  ? "bg-[#00c389] text-[#07111f]"
                  : "bg-[#121a2a] text-white"
              }`}
            >
              {page}
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        disabled={isLastPage}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Go to next page"
        className="px-4 py-2 bg-[#00c389] rounded disabled:opacity-50"
      >
        Next
      </button>

      <span className="basis-full text-center text-sm" aria-live="polite">
        Page {currentPage} of {pageCount}
        {totalItems === 0 ? " (0 items)" : ""}
      </span>
    </nav>
  );
}

export default Pagination;
