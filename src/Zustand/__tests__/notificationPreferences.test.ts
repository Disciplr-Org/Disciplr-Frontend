// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { useNotificationPreferences } from "../notificationPreferences";

describe("useNotificationPreferences store", () => {
  beforeEach(() => {
    localStorage.clear();
    useNotificationPreferences.getState().reset();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should have correct initial state", () => {
    const state = useNotificationPreferences.getState();
    expect(state.email).toBe(true);
    expect(state.push).toBe(false);
    expect(state.frequency).toBe("");
    expect(state.quietHours).toBe("12:00");
  });

  it("should update email preference", () => {
    useNotificationPreferences.getState().setEmail(false);
    expect(useNotificationPreferences.getState().email).toBe(false);

    useNotificationPreferences.getState().setEmail(true);
    expect(useNotificationPreferences.getState().email).toBe(true);
  });

  it("should update push preference", () => {
    useNotificationPreferences.getState().setPush(true);
    expect(useNotificationPreferences.getState().push).toBe(true);

    useNotificationPreferences.getState().setPush(false);
    expect(useNotificationPreferences.getState().push).toBe(false);
  });

  it("should update frequency preference", () => {
    useNotificationPreferences.getState().setFrequency("3");
    expect(useNotificationPreferences.getState().frequency).toBe("3");
  });

  it("should update quietHours preference", () => {
    useNotificationPreferences.getState().setQuietHours("22:00");
    expect(useNotificationPreferences.getState().quietHours).toBe("22:00");
  });

  it("should reset to default state", () => {
    useNotificationPreferences.getState().setEmail(false);
    useNotificationPreferences.getState().setPush(true);
    useNotificationPreferences.getState().setFrequency("2");
    useNotificationPreferences.getState().setQuietHours("09:00");

    useNotificationPreferences.getState().reset();

    const state = useNotificationPreferences.getState();
    expect(state.email).toBe(true);
    expect(state.push).toBe(false);
    expect(state.frequency).toBe("");
    expect(state.quietHours).toBe("12:00");
  });

  it("should persist state to localStorage", () => {
    useNotificationPreferences.getState().setEmail(false);
    useNotificationPreferences.getState().setPush(true);
    useNotificationPreferences.getState().setFrequency("3");
    useNotificationPreferences.getState().setQuietHours("08:30");

    const stored = localStorage.getItem("notification-preferences");
    expect(stored).not.toBeNull();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.state.email).toBe(false);
    expect(parsed.state.push).toBe(true);
    expect(parsed.state.frequency).toBe("3");
    expect(parsed.state.quietHours).toBe("08:30");
  });
});
