import { describe, expect, it } from "vitest";
import {
  getNotifications,
  notificationTypeColors,
  notificationTypeIcons,
  vaults,
} from "./example";

describe("notification example data", () => {
  it("returns the same complete fixture on every call", () => {
    const first = getNotifications();
    const second = getNotifications();

    expect(first).toHaveLength(20);
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second[0]).not.toBe(first[0]);
  });

  it("keeps fixture identifiers unique and records complete", () => {
    const notifications = getNotifications();
    const ids = notifications.map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(
      notifications.every(
        ({ id, type, isUrgent, title, message, timestamp, timeAgo, isRead, category }) =>
          id.length > 0 &&
          type.length > 0 &&
          typeof isUrgent === "boolean" &&
          title.length > 0 &&
          message.length > 0 &&
          timestamp.length > 0 &&
          timeAgo.length > 0 &&
          typeof isRead === "boolean" &&
          category.length > 0,
      ),
    ).toBe(true);
  });

  it("uses valid UTC timestamps and known type/category combinations", () => {
    const expectedCategories = {
      vault_deadline_approaching: "vault",
      funds_released: "funds",
      verification_requested: "verification",
      vault_created_successfully: "vault",
      milestone_validated: "milestone",
      funds_redirected: "funds",
      system_announcement: "system",
    } as const;

    for (const notification of getNotifications()) {
      const date = new Date(notification.timestamp);

      expect(Number.isNaN(date.getTime())).toBe(false);
      expect(notification.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
      );
      expect(notification.category).toBe(expectedCategories[notification.type]);
    }
  });

  it("provides icon and color metadata for every notification type", () => {
    const notificationTypes = [
      ...new Set(getNotifications().map(({ type }) => type)),
    ].sort();

    expect(Object.keys(notificationTypeIcons).sort()).toEqual(notificationTypes);
    expect(Object.keys(notificationTypeColors).sort()).toEqual(notificationTypes);

    for (const type of notificationTypes) {
      expect(notificationTypeIcons[type]).toBeDefined();
      expect(notificationTypeColors[type].length).toBeGreaterThan(0);
    }
  });

  it("isolates returned records from mutations made by consumers", () => {
    const firstRead = getNotifications();
    firstRead[0].title = "corrupted";
    firstRead.pop();

    const nextRead = getNotifications();

    expect(nextRead).toHaveLength(20);
    expect(nextRead[0].title).not.toBe("corrupted");
  });

  it("provides non-empty, uniquely named vault settings", () => {
    expect(vaults.length).toBeGreaterThan(0);
    expect(vaults.every(({ name }) => name.trim().length > 0)).toBe(true);
    expect(new Set(vaults.map(({ name }) => name)).size).toBe(vaults.length);
  });
});
