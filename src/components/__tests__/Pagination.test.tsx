import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Pagination from "../Pagination";
import { paginate } from "@/utils/paginate";

describe("Pagination", () => {
  it("renders page controls from paginate results", () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        pagination={paginate(["a", "b", "c", "d", "e", "f"], 2, 2)}
        onPageChange={onPageChange}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Pagination" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to page 2" }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
  });

  it("moves to previous, next, and numbered pages", () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        pagination={paginate(["a", "b", "c", "d", "e", "f"], 2, 2)}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Go to previous page" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Go to next page" }));
    fireEvent.click(screen.getByRole("button", { name: "Go to page 3" }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(3, 3);
  });

  it("disables previous and next controls on a single page", () => {
    render(
      <Pagination pagination={paginate(["a"], 1, 5)} onPageChange={vi.fn()} />,
    );

    expect(
      screen.getByRole("button", { name: "Go to previous page" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Go to next page" }),
    ).toBeDisabled();
  });

  it("handles an empty item set", () => {
    render(
      <Pagination pagination={paginate([], 1, 5)} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText("Page 1 of 1 (0 items)")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Go to page 1" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("supports a custom navigation label", () => {
    render(
      <Pagination
        pagination={paginate(["a", "b"], 1, 1)}
        onPageChange={vi.fn()}
        label="Notifications pagination"
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Notifications pagination" }),
    ).toBeInTheDocument();
  });
});
