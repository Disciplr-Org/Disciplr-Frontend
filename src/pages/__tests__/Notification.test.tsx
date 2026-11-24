// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Notification from "../Notification";
import { useNotification, type NotificationItem } from "@/Zustand/Store";
import {
  DEFAULT_NOTIFICATION_PAGE_SIZE,
  NOTIFICATION_PAGE_SIZE_OPTIONS,
  NOTIFICATION_PAGE_SIZE_STORAGE_KEY,
} from "../../utils/pageSizePref";

vi.mock("framer-motion", async (importOriginal) => {
  const original = await importOriginal<typeof import("framer-motion")>();
  return {
    ...original,
    useReducedMotion: vi.fn(),
  };
});

function createMockNotifications(count: number): NotificationItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ntf_${i + 1}`,
    type: "vault",
    isUrgent: false,
    title: `Notification ${i + 1}`,
    message: `Message for notification ${i + 1}`,
    timestamp: new Date(2026, 0, 1, 12, 0, count - i).toISOString(),
    isRead: false,
    category: "vault",
  }));
}

function renderNotificationPage() {
  return render(
    <MemoryRouter>
      <Notification />
    </MemoryRouter>,
  );
}

describe("Notification Page - Page Size and Pagination", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    useNotification.setState({
      notification: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders a labelled page-size selector for assistive tech with options 5, 10, 20", () => {
    useNotification.setState({ notification: createMockNotifications(5) });
    renderNotificationPage();

    const selector = screen.getByLabelText(/page size/i);
    expect(selector).toBeInTheDocument();
    expect(selector.tagName).toBe("SELECT");

    const options = Array.from(selector.querySelectorAll("option")).map((opt) =>
      Number(opt.value),
    );
    expect(options).toEqual(Array.from(NOTIFICATION_PAGE_SIZE_OPTIONS));
    expect(selector).toHaveValue(String(DEFAULT_NOTIFICATION_PAGE_SIZE));
  });

  it("changing to 10 with 12 items shows 10 rows and 2 pages; reload keeps 10", () => {
    useNotification.setState({ notification: createMockNotifications(12) });
    const { unmount } = renderNotificationPage();

    // Initially with default 5 items per page: 5 notification items shown
    expect(screen.getAllByText(/^Notification \d+$/)).toHaveLength(5);
    // Page 1 of 3
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go to page 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go to page 3/i })).toBeInTheDocument();

    // Change page size to 10
    const select = screen.getByLabelText(/page size/i);
    fireEvent.change(select, { target: { value: "10" } });

    // Shows 10 rows and 2 pages
    expect(screen.getAllByText(/^Notification \d+$/)).toHaveLength(10);
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go to page 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go to page 2/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /go to page 3/i })).not.toBeInTheDocument();

    // Check storage persistence
    expect(window.localStorage.getItem(NOTIFICATION_PAGE_SIZE_STORAGE_KEY)).toBe("10");

    // Unmount and remount (simulating reload)
    unmount();
    renderNotificationPage();

    const reloadedSelect = screen.getByLabelText(/page size/i);
    expect(reloadedSelect).toHaveValue("10");
    expect(screen.getAllByText(/^Notification \d+$/)).toHaveLength(10);
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go to page 2/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /go to page 3/i })).not.toBeInTheDocument();
  });

  it("clamps current page after a size increase", () => {
    useNotification.setState({ notification: createMockNotifications(12) });
    renderNotificationPage();

    // Navigate to page 3
    const page3Button = screen.getByRole("button", { name: /go to page 3/i });
    fireEvent.click(page3Button);

    // On page 3 with 12 items and page size 5, items 11 and 12 are visible (2 items)
    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();
    expect(screen.getAllByText(/^Notification \d+$/)).toHaveLength(2);

    // Increase page size to 10 (total pages becomes 2)
    const select = screen.getByLabelText(/page size/i);
    fireEvent.change(select, { target: { value: "10" } });

    // Page must clamp to 2
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /go to page 3/i })).not.toBeInTheDocument();

    // Now increase page size to 20 (total pages becomes 1)
    fireEvent.change(select, { target: { value: "20" } });

    // Page must clamp to 1 and show all 12 items
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    expect(screen.getAllByText(/^Notification \d+$/)).toHaveLength(12);
  });

  it("falls back to default 5 when storage fails or is invalid", () => {
    // 1. Corrupt value in storage
    window.localStorage.setItem(NOTIFICATION_PAGE_SIZE_STORAGE_KEY, "invalid-999");
    useNotification.setState({ notification: createMockNotifications(8) });
    const { unmount } = renderNotificationPage();

    const select = screen.getByLabelText(/page size/i);
    expect(select).toHaveValue("5");
    expect(screen.getAllByText(/^Notification \d+$/)).toHaveLength(5);
    unmount();

    // 2. Storage read failure throws
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Access denied");
    });
    renderNotificationPage();
    const selectAfterError = screen.getByLabelText(/page size/i);
    expect(selectAfterError).toHaveValue("5");
    expect(screen.getAllByText(/^Notification \d+$/)).toHaveLength(5);
  });

  it("handles storage write failure gracefully without breaking UI updates", () => {
    useNotification.setState({ notification: createMockNotifications(15) });
    renderNotificationPage();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage quota exceeded");
    });

    const select = screen.getByLabelText(/page size/i);
    fireEvent.change(select, { target: { value: "10" } });

    // UI still updates to 10 items
    expect(select).toHaveValue("10");
    expect(screen.getAllByText(/^Notification \d+$/)).toHaveLength(10);
  });
});
