import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "../Pagination";
import { paginate } from "@/utils/paginate";

const items = Array.from({ length: 12 }, (_, index) => index);

describe("Pagination", () => {
  it("renders page status and numbered controls", () => {
    render(
      <Pagination
        pagination={paginate(items, 2, 5)}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Go to page 1" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Go to page 3" })).toBeEnabled();
  });

  it("calls onPageChange for previous, next, and numbered pages", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        pagination={paginate(items, 2, 5)}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Go to previous page" }));
    fireEvent.click(screen.getByRole("button", { name: "Go to next page" }));
    fireEvent.click(screen.getByRole("button", { name: "Go to page 3" }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(3, 3);
  });

  it("disables previous on the first page and next on the last page", () => {
    const { rerender } = render(
      <Pagination
        pagination={paginate(items, 1, 5)}
        onPageChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Go to previous page" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Go to next page" })).toBeEnabled();

    rerender(
      <Pagination
        pagination={paginate(items, 3, 5)}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Go to previous page" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Go to next page" })).toBeDisabled();
  });

  it("keeps controls bounded for empty and single-page results", () => {
    render(
      <Pagination
        pagination={paginate([], 10, 5)}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to previous page" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Go to next page" })).toBeDisabled();
    expect(screen.getByText("0 total items")).toBeInTheDocument();
  });

  it("renders a bounded window for large page counts", () => {
    render(
      <Pagination
        pagination={{ currentPage: 100, pageCount: 200, totalItems: 4000 }}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Go to page 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to page 200" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Go to page 50" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Go to page/ })).toHaveLength(5);
    expect(screen.getAllByText("…")).toHaveLength(2);
  });
});
