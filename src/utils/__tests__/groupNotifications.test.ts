import { describe, it, expect } from "vitest";
import { dateBucket, groupNotificationsByDate } from "../groupNotifications";

describe("groupNotifications", () => {
  describe("dateBucket", () => {
    it("classifies a timestamp at midnight of the current local day as Today", () => {
      const now = new Date(2024, 4, 10, 12, 30, 0);
      const todayMidnight = new Date(2024, 4, 10, 0, 0, 0);

      expect(dateBucket(todayMidnight.toISOString(), now)).toBe("Today");
    });

    it('returns "Today" for a timestamp exactly at midnight of "today" (UTC)', () => {
      const now = new Date('2023-10-15T12:00:00Z');
      const midnightToday = new Date('2023-10-15T00:00:00Z').toISOString();
      expect(dateBucket(midnightToday, now)).toBe('Today');
    });

    it("classifies a timestamp from exactly 24 hours ago as Yesterday", () => {
      const now = new Date(2024, 4, 10, 12, 0, 0);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(dateBucket(twentyFourHoursAgo.toISOString(), now)).toBe("Yesterday");
    });

    it('returns "Yesterday" for a timestamp exactly 24 hours ago (UTC)', () => {
      const now = new Date('2023-10-15T00:00:00Z');
      const yesterday = new Date('2023-10-14T00:00:00Z').toISOString();
      expect(dateBucket(yesterday, now)).toBe('Yesterday');
    });

    it("classifies older timestamps as Earlier", () => {
      const now = new Date(2024, 4, 10, 12, 0, 0);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      expect(dateBucket(threeDaysAgo.toISOString(), now)).toBe("Earlier");
    });

    it('returns "Earlier" for a timestamp several days old (UTC)', () => {
      const now = new Date('2023-10-15T10:00:00Z');
      const earlier = new Date('2023-10-10T10:00:00Z').toISOString();
      expect(dateBucket(earlier, now)).toBe('Earlier');
    });
  });

  describe("groupNotificationsByDate", () => {
    it("omits empty buckets and preserves item order within each bucket", () => {
      const now = new Date(2024, 4, 10, 12, 0, 0);
      const items = [
        { id: "today-1", timestamp: new Date(2024, 4, 10, 10, 0, 0).toISOString() },
        { id: "today-2", timestamp: new Date(2024, 4, 10, 11, 0, 0).toISOString() },
        { id: "earlier-1", timestamp: new Date(2024, 4, 4, 8, 0, 0).toISOString() },
      ];

      const result = groupNotificationsByDate(items, now);

      expect(result.map((group) => group.bucket)).toEqual(["Today", "Earlier"]);
      expect(result[0].items.map((item) => item.id)).toEqual(["today-1", "today-2"]);
      expect(result[1].items.map((item) => item.id)).toEqual(["earlier-1"]);
    });

    it("omits empty buckets from the result with numeric item ids", () => {
      const now = new Date('2023-10-15T12:00:00Z');
      const items = [
        { id: 1, timestamp: new Date('2023-10-15T10:00:00Z').toISOString() },
        { id: 2, timestamp: new Date('2023-10-10T10:00:00Z').toISOString() }
      ];

      const result = groupNotificationsByDate(items, now);

      expect(result).toHaveLength(2);
      expect(result[0].bucket).toBe('Today');
      expect(result[1].bucket).toBe('Earlier');
      expect(result[0].items).toEqual([items[0]]);
      expect(result[1].items).toEqual([items[1]]);
    });
  });
});
