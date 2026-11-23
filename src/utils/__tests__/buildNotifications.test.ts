// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildNotifications } from "../buildNotifications";
import {
  loadNotificationState,
  MAX_PERSISTED_NOTIFICATION_IDS,
  saveNotificationState,
} from "../notificationPersistence";
import { isQuietHoursActive } from "../quietHours";

const now = new Date("2026-11-23T12:00:00.000Z");
const vault = (deadline: string) => ({ id: "v-1", name: "Alpha", deadline, currency: "USDC" });
const activity = (type: string, id = "a-1") => ({ id, type, vault: "Alpha", amount: 10, timestamp: now });

describe("buildNotifications", () => {
  it("deduplicates repeated activity records", () => {
    const result = buildNotifications([activity("create"), activity("create")], [vault("2026-12-01T12:00:00Z")], now);
    expect(result.filter((item) => item.id === "activity:a-1")).toHaveLength(1);
  });

  it("creates a 24-hour deadline notification for a vault due in 23 hours", () => {
    const result = buildNotifications([], [vault("2026-11-24T11:00:00.000Z")], now);
    expect(result.map((item) => item.id)).toContain("deadline:v-1:24h");
  });

  it("does not create a 24-hour notification for a vault due in 10 days", () => {
    const result = buildNotifications([], [vault("2026-12-03T12:00:00.000Z")], now);
    expect(result).toEqual([]);
  });

  it("respects disabled categories and exact deadline boundaries", () => {
    expect(buildNotifications([activity("create")], [vault("2026-12-01T12:00:00Z")], now, { disabledCategories: ["vault"] })).toEqual([]);
    expect(buildNotifications([], [vault("2026-11-24T11:00:00.000Z")], now, { vaultOverrides: { "v-1": false } })).toEqual([]);
    expect(buildNotifications([], [vault("2026-11-24T12:00:00.000Z")], now)).toHaveLength(1);
    expect(buildNotifications([], [vault("2026-11-24T12:00:00.001Z")], now)).toEqual([]);
  });

  it.each([
    ["create", "vault_created_successfully", "vault"],
    ["validate", "milestone_validated", "milestone"],
    ["release", "funds_released", "funds"],
    ["redirect", "funds_redirected", "funds"],
  ])("maps %s activity to its notification type and category", (type, expectedType, category) => {
    const [item] = buildNotifications([activity(type)], [vault("2026-12-01T12:00:00Z")], now);
    expect(item).toMatchObject({ type: expectedType, category });
  });

  it("ignores malformed records and expired deadlines", () => {
    expect(buildNotifications([null, {}, { id: "x", type: "unknown", vault: "Alpha" }], [{ id: "v-1", name: "Alpha", deadline: "bad" }], now)).toEqual([]);
  });

  it("keeps list entries during quiet hours; delivery decides suppression separately", () => {
    const result = buildNotifications([activity("create")], [vault("2026-12-01T12:00:00Z")], now);
    expect(result).toHaveLength(1);
    expect(isQuietHoursActive(new Date("2026-11-23T23:00:00"), "22:00", "07:00")).toBe(true);
  });
});

describe("notification persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps read and dismissed state isolated per wallet", () => {
    saveNotificationState("wallet-a", { read: ["activity:a"], dismissed: ["deadline:v:24h"] });
    saveNotificationState("wallet-b", { read: ["activity:b"], dismissed: [] });

    expect(loadNotificationState("wallet-a")).toEqual({
      read: ["activity:a"],
      dismissed: ["deadline:v:24h"],
    });
    expect(loadNotificationState("wallet-b")).toEqual({ read: ["activity:b"], dismissed: [] });
    expect(loadNotificationState(null)).toEqual({ read: [], dismissed: [] });
  });

  it("caps persisted identifiers and survives storage failures", () => {
    const ids = Array.from({ length: MAX_PERSISTED_NOTIFICATION_IDS + 10 }, (_, index) => `id-${index}`);
    saveNotificationState("wallet-a", { read: ids, dismissed: ids });
    expect(loadNotificationState("wallet-a").read).toHaveLength(MAX_PERSISTED_NOTIFICATION_IDS);

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    expect(() => saveNotificationState("wallet-a", { read: ["x"], dismissed: [] })).not.toThrow();
    expect(() => loadNotificationState("wallet-a")).not.toThrow();
    vi.restoreAllMocks();
  });
});
