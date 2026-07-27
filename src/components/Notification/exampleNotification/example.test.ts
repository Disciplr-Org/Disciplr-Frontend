import { describe, it, expect } from "vitest";
import { getNotifications } from "./example";
import { NOTIFICATION_TYPE_MAP } from "../notificationType";

describe("getNotifications", () => {
  it("should return notifications with valid types", () => {
    const notifications = getNotifications();
    const validKeys = Object.keys(NOTIFICATION_TYPE_MAP);

    notifications.forEach((notification) => {
      expect(validKeys).toContain(notification.type);
    });
  });

  it("should return notifications with unique ids", () => {
    const notifications = getNotifications();
    const ids = notifications.map(n => n.id);
    const uniqueIds = new Set(ids);

    expect(ids.length).toBe(uniqueIds.size);
  });
});
