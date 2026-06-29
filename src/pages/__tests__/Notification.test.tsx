import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Notification from "../Notification";
import { useNotification } from "@/Zustand/Store";
import { getNotifications } from "@/components/Notification/exampleNotification/example";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock("focus-trap-react", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const initialNotifications = getNotifications();

function resetStore() {
  useNotification.setState({
    notification: initialNotifications,
    unreadCount: initialNotifications.filter((n) => !n.isRead).length,
  });
}

function renderNotification() {
  return render(
    <MemoryRouter>
      <Notification />
    </MemoryRouter>,
  );
}

describe("Notification page", () => {
  beforeEach(() => {
    resetStore();
  });

  it("renders the first page of notifications", () => {
    renderNotification();
    const items = screen.getAllByText(/\.\.\./);
    expect(items.length).toBeLessThanOrEqual(5);
  });

  it("displays pagination info", () => {
    renderNotification();
    const totalPages = Math.ceil(initialNotifications.length / 5);
    expect(
      screen.getByText(`Page 1 of ${totalPages}`),
    ).toBeInTheDocument();
  });

  it("navigates to the next page", () => {
    renderNotification();
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);
    const totalPages = Math.ceil(initialNotifications.length / 5);
    expect(
      screen.getByText(`Page 2 of ${totalPages}`),
    ).toBeInTheDocument();
  });

  it("disables previous button on first page", () => {
    renderNotification();
    const prevButton = screen.getByText("Previous");
    expect(prevButton).toBeDisabled();
  });

  it("filters by unread via the read filter dropdown", () => {
    renderNotification();

    const filterButton = screen.getByText("Filter");
    fireEvent.click(filterButton);

    const readSelect = document.querySelector(
      'select[name="filter_by_read"]',
    ) as HTMLSelectElement;
    fireEvent.change(readSelect, { target: { value: "0" } });

    const unreadCount = initialNotifications.filter((n) => !n.isRead).length;
    const expectedItems = Math.min(unreadCount, 5);
    const items = screen.getAllByText(/\.\.\./);
    expect(items.length).toBe(expectedItems);
  });

  it("shows empty state when no notifications match filter", () => {
    useNotification.setState({
      notification: initialNotifications.map((n) => ({
        ...n,
        isRead: true,
      })),
      unreadCount: 0,
    });
    renderNotification();

    const filterButton = screen.getByText("Filter");
    fireEvent.click(filterButton);

    const readSelect = document.querySelector(
      'select[name="filter_by_read"]',
    ) as HTMLSelectElement;
    fireEvent.change(readSelect, { target: { value: "0" } });

    expect(screen.getByText("No notifications found.")).toBeInTheDocument();
  });

  it("marks a notification as read via the store", () => {
    const unreadNotification = initialNotifications.find((n) => !n.isRead)!;

    useNotification.getState().markRead(unreadNotification.id);

    const state = useNotification.getState();
    const updated = state.notification.find(
      (n) => n.id === unreadNotification.id,
    );
    expect(updated!.isRead).toBe(true);
  });

  it("resets to page 1 when filter changes", () => {
    renderNotification();

    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);
    const totalPages = Math.ceil(initialNotifications.length / 5);
    expect(
      screen.getByText(`Page 2 of ${totalPages}`),
    ).toBeInTheDocument();

    const filterButton = screen.getByText("Filter");
    fireEvent.click(filterButton);

    const readSelect = document.querySelector(
      'select[name="filter_by_read"]',
    ) as HTMLSelectElement;
    fireEvent.change(readSelect, { target: { value: "0" } });

    expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
  });
  it("resets to page 1 when filter changes", () => {
    renderNotification();

    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);
    const totalPages = Math.ceil(initialNotifications.length / 5);
    expect(
      screen.getByText(`Page 2 of ${totalPages}`),
    ).toBeInTheDocument();

    const filterButton = screen.getByText("Filter");
    fireEvent.click(filterButton);

    const readSelect = document.querySelector(
      'select[name="filter_by_read"]',
    ) as HTMLSelectElement;
    fireEvent.change(readSelect, { target: { value: "0" } });

    expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
  });

  it("shows Clear all button when notifications exist", () => {
    renderNotification();
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("dismisses a single notification when the dismiss button is clicked", () => {
    renderNotification();
    const firstId = initialNotifications[0].id;
    const dismissButton = screen.getByLabelText(
      `Dismiss notification ${firstId}`,
    );
    fireEvent.click(dismissButton);
    const state = useNotification.getState();
    expect(state.notification.find((n) => n.id === firstId)).toBeUndefined();
    expect(state.notification.length).toBe(initialNotifications.length - 1);
  });

  it("opens the clear-all confirmation modal when Clear all is clicked", () => {
    renderNotification();
    const clearButton = screen.getByText("Clear all");
    fireEvent.click(clearButton);
    expect(
      screen.getByText("Clear all notifications"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Are you sure you want to clear all ${initialNotifications.length} notifications? This action cannot be undone.`,
      ),
    ).toBeInTheDocument();
  });

  it("clears all notifications when confirmed in the modal", () => {
    renderNotification();
    const clearButton = screen.getByText("Clear all");
    fireEvent.click(clearButton);

    // Both the trigger button and modal confirm button say "Clear all"
    const confirmButton = screen.getAllByText("Clear all")[1];
    fireEvent.click(confirmButton);

    const state = useNotification.getState();
    expect(state.notification).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(screen.getByText("No notifications found.")).toBeInTheDocument();
  });

  it("cancels clear-all when Cancel is clicked in the modal — notifications remain", () => {
    renderNotification();
    const clearButton = screen.getByText("Clear all");
    fireEvent.click(clearButton);

    const cancelButton = screen.getAllByText("Cancel")[0];
    fireEvent.click(cancelButton);

    const state = useNotification.getState();
    expect(state.notification.length).toBe(initialNotifications.length);
  });

  it("resets to page 1 when dismissing the last item on the current page", () => {
    // Set up a small list so page 2 exists with 1 item
    const smallList = initialNotifications.slice(0, 6);
    useNotification.setState({
      notification: smallList,
      unreadCount: smallList.filter((n) => !n.isRead).length,
    });
    renderNotification();

    // Go to page 2
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();

    // Dismiss the only item on page 2 (item at index 5)
    const lastItemId = smallList[5].id;
    const dismissButton = screen.getByLabelText(
      `Dismiss notification ${lastItemId}`,
    );
    fireEvent.click(dismissButton);

    // Should reset to page 1
    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
  });
});
