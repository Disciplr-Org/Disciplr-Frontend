import { describe, it, expect, beforeEach } from "vitest";
import { useNotification } from "../Store";
import { getNotifications } from "@/components/Notification/exampleNotification/example";

const initialNotifications = getNotifications();

function resetStore() {
  useNotification.setState({
    notification: initialNotifications,
    unreadCount: initialNotifications.filter((n) => !n.isRead).length,
  });
}

describe("useNotification store", () => {
  beforeEach(() => {
    resetStore();
  });

  it("has correct initial state from example data", () => {
    const state = useNotification.getState();
    expect(state.notification).toEqual(initialNotifications);
    expect(state.notification.length).toBe(20);
    expect(state.unreadCount).toBe(
      initialNotifications.filter((n) => !n.isRead).length,
    );
  });

  describe("setNotification", () => {
    it("sets notifications and recomputes unreadCount", () => {
      const twoUnread = [
        { ...initialNotifications[0], isRead: false },
        { ...initialNotifications[1], isRead: true },
        { ...initialNotifications[2], isRead: false },
      ];
      useNotification.getState().setNotification(twoUnread);
      const state = useNotification.getState();
      expect(state.notification).toEqual(twoUnread);
      expect(state.unreadCount).toBe(2);
    });

    it("handles empty array", () => {
      useNotification.getState().setNotification([]);
      const state = useNotification.getState();
      expect(state.notification).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe("markRead", () => {
    it("marks a single unread notification as read", () => {
      const unreadId = initialNotifications.find((n) => !n.isRead)!.id;
      const prevUnread = useNotification.getState().unreadCount;

      useNotification.getState().markRead(unreadId);

      const state = useNotification.getState();
      const updated = state.notification.find((n) => n.id === unreadId);
      expect(updated!.isRead).toBe(true);
      expect(state.unreadCount).toBe(prevUnread - 1);
    });

    it("is idempotent — marking an already-read notification does not change unreadCount", () => {
      const readId = initialNotifications.find((n) => n.isRead)!.id;
      const prevUnread = useNotification.getState().unreadCount;

      useNotification.getState().markRead(readId);

      const state = useNotification.getState();
      expect(state.unreadCount).toBe(prevUnread);
    });

    it("does nothing for a non-existent id", () => {
      const prevState = useNotification.getState();
      useNotification.getState().markRead("non_existent_id");
      const state = useNotification.getState();
      expect(state.unreadCount).toBe(prevState.unreadCount);
      expect(state.notification.length).toBe(prevState.notification.length);
    });

    it("produces immutable state — original array is not mutated", () => {
      const before = useNotification.getState().notification;
      const unreadId = before.find((n) => !n.isRead)!.id;
      useNotification.getState().markRead(unreadId);
      const after = useNotification.getState().notification;
      expect(before).not.toBe(after);
    });
  });

  describe("markAllRead", () => {
    it("marks all notifications as read", () => {
      useNotification.getState().markAllRead();
      const state = useNotification.getState();
      expect(state.unreadCount).toBe(0);
      expect(state.notification.every((n) => n.isRead)).toBe(true);
    });

    it("is idempotent — calling on all-read list keeps unreadCount at 0", () => {
      useNotification.getState().markAllRead();
      useNotification.getState().markAllRead();
      const state = useNotification.getState();
      expect(state.unreadCount).toBe(0);
      expect(state.notification.every((n) => n.isRead)).toBe(true);
    });

    it("handles empty notification list", () => {
      useNotification.getState().setNotification([]);
      useNotification.getState().markAllRead();
      const state = useNotification.getState();
      expect(state.notification).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });

    it("produces immutable state", () => {
      const before = useNotification.getState().notification;
      useNotification.getState().markAllRead();
      const after = useNotification.getState().notification;
      expect(before).not.toBe(after);
    });
  });

  describe("dismiss", () => {
    it("removes a notification by id", () => {
      const target = initialNotifications[0];
      useNotification.getState().dismiss(target.id);
      const state = useNotification.getState();
      expect(state.notification.find((n) => n.id === target.id)).toBeUndefined();
      expect(state.notification.length).toBe(initialNotifications.length - 1);
    });

    it("recomputes unreadCount after dismissing an unread notification", () => {
      const unread = initialNotifications.find((n) => !n.isRead)!;
      const prevUnread = useNotification.getState().unreadCount;
      useNotification.getState().dismiss(unread.id);
      expect(useNotification.getState().unreadCount).toBe(prevUnread - 1);
    });

    it("does not change unreadCount when dismissing a read notification", () => {
      const read = initialNotifications.find((n) => n.isRead)!;
      const prevUnread = useNotification.getState().unreadCount;
      useNotification.getState().dismiss(read.id);
      expect(useNotification.getState().unreadCount).toBe(prevUnread);
    });

    it("does nothing for a non-existent id", () => {
      const prevState = useNotification.getState();
      useNotification.getState().dismiss("non_existent_id");
      const state = useNotification.getState();
      expect(state.notification.length).toBe(prevState.notification.length);
      expect(state.unreadCount).toBe(prevState.unreadCount);
    });

    it("produces immutable state", () => {
      const before = useNotification.getState().notification;
      useNotification.getState().dismiss(before[0].id);
      const after = useNotification.getState().notification;
      expect(before).not.toBe(after);
    });
  });

  describe("clearAll", () => {
    it("removes all notifications", () => {
      useNotification.getState().clearAll();
      const state = useNotification.getState();
      expect(state.notification).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });

    it("is idempotent — calling on empty list stays empty", () => {
      useNotification.getState().clearAll();
      useNotification.getState().clearAll();
      const state = useNotification.getState();
      expect(state.notification).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe("unreadCount consistency", () => {
    it("stays in sync after mixed operations", () => {
      const unreadIds = initialNotifications
        .filter((n) => !n.isRead)
        .map((n) => n.id);

      unreadIds.forEach((id) => {
        useNotification.getState().markRead(id);
      });

      expect(useNotification.getState().unreadCount).toBe(0);
      expect(
        useNotification.getState().notification.every((n) => n.isRead),
      ).toBe(true);
    });

    it("all-unread list produces correct count", () => {
      const allUnread = initialNotifications.map((n) => ({
        ...n,
        isRead: false,
      }));
      useNotification.getState().setNotification(allUnread);
      expect(useNotification.getState().unreadCount).toBe(allUnread.length);
    });
  });
});
