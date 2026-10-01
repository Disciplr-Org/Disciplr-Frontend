import { describe, expect, it } from "vitest";
import {
  isQuietHoursActive,
  isValidQuietHoursRange,
  isValidQuietTime,
} from "../quietHours";

const at = (hours: number, minutes = 0) => new Date(2026, 0, 1, hours, minutes);

describe("quietHours utilities", () => {
  it("validates HH:MM quiet time strings", () => {
    expect(isValidQuietTime("00:00")).toBe(true);
    expect(isValidQuietTime("23:59")).toBe(true);
    expect(isValidQuietTime("24:00")).toBe(false);
    expect(isValidQuietTime("9:00")).toBe(false);
    expect(isValidQuietTime("12:60")).toBe(false);
  });

  it("rejects equal start and end times", () => {
    expect(isValidQuietHoursRange("22:00", "07:00")).toBe(true);
    expect(isValidQuietHoursRange("09:00", "09:00")).toBe(false);
  });

  it("detects active time inside a same-day window", () => {
    expect(isQuietHoursActive(at(13), "12:00", "18:00")).toBe(true);
    expect(isQuietHoursActive(at(18), "12:00", "18:00")).toBe(false);
    expect(isQuietHoursActive(at(11, 59), "12:00", "18:00")).toBe(false);
  });

  it("detects active time inside a wrap-around window", () => {
    expect(isQuietHoursActive(at(23), "22:00", "07:00")).toBe(true);
    expect(isQuietHoursActive(at(6, 59), "22:00", "07:00")).toBe(true);
    expect(isQuietHoursActive(at(7), "22:00", "07:00")).toBe(false);
    expect(isQuietHoursActive(at(12), "22:00", "07:00")).toBe(false);
  });

  it("returns false for invalid ranges", () => {
    expect(isQuietHoursActive(at(12), "bad", "07:00")).toBe(false);
    expect(isQuietHoursActive(at(12), "10:00", "10:00")).toBe(false);
  });
});
