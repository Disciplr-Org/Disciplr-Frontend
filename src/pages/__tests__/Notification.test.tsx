import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotificationIcon from "../../components/Notification/NotificationIcon";
import {
  getUnreadCount,
  type NotificationList,
  useNotification,
} from "../../Zustand/Store";
import Notification from "../Notification";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...props
    }: ComponentPropsWithoutRef<"div"> & {
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
    }) => {
      void _initial;
      void _animate;
      void _exit;
      void _transition;

      return <div {...props}>{children}</div>;
    },
  },
}));

const seedNotifications: NotificationList = [
  {
    id: "unread-vault",
    type: "vault_deadline_approaching",
    isUrgent: true,
    title: "Unread Vault",
    message: "Vault deadline is approaching.",
    timestamp: "2026-04-24T08:00:00Z",
    timeAgo: "2m ago",
    isRead: false,
    category: "vault",
  },
  {
    id: "read-funds",
    type: "funds_released",
    isUrgent: false,
    title: "Read Funds",
    message: "Funds were released.",
    timestamp: "2026-04-24T07:45:00Z",
    timeAgo: "17m ago",
    isRead: true,
    category: "funds",
  },
  {
    id: "unread-system",
    type: "system_announcement",
    isUrgent: false,
    title: "Unread System",
    message: "A new feature is available.",
    timestamp: "2026-04-23T20:00:00Z",
    timeAgo: "Yesterday",
    isRead: false,
    category: "system",
  },
];

function cloneNotifications(notifications: NotificationList = seedNotifications) {
  return notifications.map((item) => ({ ...item }));
}

function resetNotificationStore(notifications: NotificationList = seedNotifications) {
  const notification = cloneNotifications(notifications);
  useNotification.setState({
    notification,
    unreadCount: getUnreadCount(notification),
  });
}

function renderNotificationPage() {
  return render(
    <MemoryRouter>
      <Notification />
    </MemoryRouter>,
  );
}

function openFilterMenu() {
  fireEvent.click(screen.getByRole("button", { name: /filter/i }));
}

describe("Notification page read state", () => {
  beforeEach(() => {
    resetNotificationStore();
  });

  it("keeps read and unread filtering backed by the store list", () => {
    renderNotificationPage();

    expect(screen.getByText("Unread Vault")).toBeInTheDocument();
    expect(screen.getByText("Read Funds")).toBeInTheDocument();

    openFilterMenu();
    fireEvent.change(screen.getByLabelText(/filter by read status/i), {
      target: { value: "0" },
    });

    expect(screen.getByText("Unread Vault")).toBeInTheDocument();
    expect(screen.getByText("Unread System")).toBeInTheDocument();
    expect(screen.queryByText("Read Funds")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/filter by read status/i), {
      target: { value: "1" },
    });

    expect(screen.getByText("Read Funds")).toBeInTheDocument();
    expect(screen.queryByText("Unread Vault")).not.toBeInTheDocument();
  });

  it("marks all notifications read from the page and leaves unread filtering empty", async () => {
    renderNotificationPage();

    fireEvent.click(screen.getByRole("button", { name: /mark all as read/i }));

    await waitFor(() => {
      expect(useNotification.getState().unreadCount).toBe(0);
    });

    openFilterMenu();
    fireEvent.change(screen.getByLabelText(/filter by read status/i), {
      target: { value: "0" },
    });

    expect(screen.getByText(/no notifications found/i)).toBeInTheDocument();
  });

  it("marks a clicked notification read through the shared store", async () => {
    renderNotificationPage();

    fireEvent.click(screen.getByText("Unread Vault"));

    await waitFor(() => {
      const marked = useNotification
        .getState()
        .notification.find((item) => item.id === "unread-vault");
      expect(marked?.isRead).toBe(true);
    });
    expect(useNotification.getState().unreadCount).toBe(1);
  });
});

describe("NotificationIcon badge", () => {
  beforeEach(() => {
    resetNotificationStore();
  });

  it("reacts to unreadCount when all notifications are marked read", async () => {
    render(
      <MemoryRouter>
        <NotificationIcon />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: /open notifications, 2 unread/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /open notifications, 2 unread/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /mark all as read/i }));

    await waitFor(() => {
      expect(useNotification.getState().unreadCount).toBe(0);
    });
    expect(screen.queryByText("2")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /open notifications, no unread/i }),
    ).toBeInTheDocument();
  });
});
