import { formatRelativeTime, setTestLocale } from "../relativeTime";

// Fixed reference point: 2025-01-15 12:00:00 UTC
const NOW = Date.UTC(2025, 0, 15, 12);

beforeEach(() => {
  setTestLocale("en-US");
});

afterEach(() => {
  setTestLocale("en");
});

describe("formatRelativeTime", () => {
  describe("past dates", () => {
    it('should return "just now" for very recent timestamps', () => {
      expect(formatRelativeTime(NOW - 5000, NOW)).toBe("just now");
      expect(formatRelativeTime(NOW - 9000, NOW)).toBe("just now");
    });

    it("should format seconds correctly", () => {
      // -30s
      expect(formatRelativeTime(NOW - 30_000, NOW)).toBe("30 seconds ago");
    });

    it("should format minutes correctly", () => {
      expect(formatRelativeTime(NOW - 60_000, NOW)).toBe("1 minute ago");
      expect(formatRelativeTime(NOW - 120_000, NOW)).toBe("2 minutes ago");
      expect(formatRelativeTime(NOW - 1_800_000, NOW)).toBe("30 minutes ago");
    });

    it("should format hours correctly", () => {
      // -2h
      expect(formatRelativeTime(NOW - 2 * 3600_000, NOW)).toBe("2 hours ago");
      expect(formatRelativeTime(NOW - 3600_000, NOW)).toBe("1 hour ago");
      expect(formatRelativeTime(NOW - 82_800_000, NOW)).toBe("23 hours ago");
    });

    it("should format days correctly", () => {
      // -3d
      expect(formatRelativeTime(NOW - 3 * 86_400_000, NOW)).toBe("3 days ago");
      expect(formatRelativeTime(NOW - 86_400_000, NOW)).toBe("1 day ago");
      expect(formatRelativeTime(NOW - 172_800_000, NOW)).toBe("2 days ago");
    });

    it("should format weeks correctly", () => {
      expect(formatRelativeTime(NOW - 604_800_000, NOW)).toBe("1 week ago");
      expect(formatRelativeTime(NOW - 1_209_600_000, NOW)).toBe("2 weeks ago");
    });
  });

  describe("future dates", () => {
    it('should return "in a moment" for very near future timestamps', () => {
      expect(formatRelativeTime(NOW + 5000, NOW)).toBe("in a moment");
      expect(formatRelativeTime(NOW + 9000, NOW)).toBe("in a moment");
    });

    it("should format future hours correctly", () => {
      // +3h
      expect(formatRelativeTime(NOW + 3 * 3600_000, NOW)).toBe("in 3 hours");
      expect(formatRelativeTime(NOW + 3600_000, NOW)).toBe("in 1 hour");
    });

    it("should format future days correctly", () => {
      // +1d
      expect(formatRelativeTime(NOW + 86_400_000, NOW)).toBe("in 1 day");
      expect(formatRelativeTime(NOW + 172_800_000, NOW)).toBe("in 2 days");
    });

    it("should format future weeks correctly", () => {
      expect(formatRelativeTime(NOW + 604_800_000, NOW)).toBe("in 1 week");
      expect(formatRelativeTime(NOW + 1_209_600_000, NOW)).toBe("in 2 weeks");
    });
  });

  describe("invalid inputs return 'Invalid date'", () => {
    it("returns 'Invalid date' for a garbage string", () => {
      expect(formatRelativeTime("nope", NOW)).toBe("Invalid date");
    });

    it("returns 'Invalid date' for NaN", () => {
      expect(formatRelativeTime(NaN, NOW)).toBe("Invalid date");
    });

    it("returns 'Invalid date' for new Date('x')", () => {
      expect(formatRelativeTime(new Date("x"), NOW)).toBe("Invalid date");
    });
  });

  describe("input format parity", () => {
    const OFFSET = -2 * 3600_000; // -2h, expected: "2 hours ago"

    it("accepts a numeric timestamp", () => {
      expect(formatRelativeTime(NOW + OFFSET, NOW)).toBe("2 hours ago");
    });

    it("accepts an ISO string", () => {
      expect(formatRelativeTime(new Date(NOW + OFFSET).toISOString(), NOW)).toBe("2 hours ago");
    });

    it("accepts a Date object", () => {
      expect(formatRelativeTime(new Date(NOW + OFFSET), NOW)).toBe("2 hours ago");
    });
  });

  describe("table-driven offsets", () => {
    it.each([
      [-30_000,          "30 seconds ago"],
      [-2 * 3600_000,    "2 hours ago"],
      [-3 * 86_400_000,  "3 days ago"],
      [+86_400_000,      "in 1 day"],
      [+3 * 3600_000,    "in 3 hours"],
    ])("offset %dms → %s", (offset, expected) => {
      expect(formatRelativeTime(NOW + offset, NOW)).toBe(expected);
    });
  });
});
