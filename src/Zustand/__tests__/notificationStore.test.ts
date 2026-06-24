import { beforeEach, describe, expect, it } from "vitest";
import {
  getUnreadCount,
  type NotificationList,
  useNotification,
} from "../Store";

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

describe("useNotification read state", () => {
  beforeEach(() => {
    resetNotificationStore();
  });

  it("derives unreadCount from the notification list when replacing data", () => {
    const nextNotifications = cloneNotifications([
      { ...seedNotifications[0], id: "unread-a", isRead: false },
      { ...seedNotifications[1], id: "unread-b", isRead: false },
      { ...seedNotifications[2], id: "read-c", isRead: true },
    ]);

    useNotification.getState().setNotification(nextNotifications);

    expect(useNotification.getState().notification).toEqual(nextNotifications);
    expect(useNotification.getState().unreadCount).toBe(2);
  });

  it("marks one unread notification read without mutating the existing list", () => {
    const previousState = useNotification.getState();
    const previousList = previousState.notification;
    const untouchedItem = previousList[1];

    previousState.markRead("unread-vault");

    const nextState = useNotification.getState();
    expect(nextState.notification).not.toBe(previousList);
    expect(nextState.notification[0]).toMatchObject({
      id: "unread-vault",
      isRead: true,
    });
    expect(nextState.notification[1]).toBe(untouchedItem);
    expect(nextState.unreadCount).toBe(1);
  });

  it("keeps state stable when marking an unknown or already-read id", () => {
    const beforeUnknown = useNotification.getState();
    beforeUnknown.markRead("missing-id");
    expect(useNotification.getState()).toBe(beforeUnknown);

    const beforeAlreadyRead = useNotification.getState();
    beforeAlreadyRead.markRead("read-funds");
    expect(useNotification.getState()).toBe(beforeAlreadyRead);
    expect(useNotification.getState().unreadCount).toBe(2);
  });

  it("marks every unread notification read and clears unreadCount", () => {
    useNotification.getState().markAllRead();

    const state = useNotification.getState();
    expect(state.notification.every((item) => item.isRead)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it("handles empty notification lists", () => {
    resetNotificationStore([]);

    useNotification.getState().markAllRead();
    useNotification.getState().markRead("missing-id");

    expect(useNotification.getState().notification).toEqual([]);
    expect(useNotification.getState().unreadCount).toBe(0);
  });
});
