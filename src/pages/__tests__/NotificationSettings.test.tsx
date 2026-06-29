type SourceAssertion = {
  name: string;
  pattern: RegExp;
};

const sourceAssertions: SourceAssertion[] = [
  {
    name: "uses checked state for email notifications",
    pattern: /checked=\{emailNotification\}/,
  },
  {
    name: "uses checked state for push notifications",
    pattern: /checked=\{pushNotification\}/,
  },
  {
    name: "uses tokenized surface and text colors",
    pattern: /background:\s*var\(--surface\)[\s\S]*color:\s*var\(--text\)/,
  },
  {
    name: "themes toggle focus rings with the accent token",
    pattern: /peer-focus:ring-\[var\(--accent-transparent\)\]/,
  },
  {
    name: "themes checked toggle tracks with the accent token",
    pattern:
      /\.peer:checked \+ \.notification-settings-toggle[\s\S]*background:\s*var\(--accent\)/,
  },
];

export function assertNotificationSettingsSource(source: string) {
  const missing = sourceAssertions
    .filter(({ pattern }) => !pattern.test(source))
    .map(({ name }) => name);

  if (missing.length > 0) {
    throw new Error(
      `NotificationSettings theming assertions failed: ${missing.join(", ")}`,
    );
  }
}

export const notificationSettingsThemeTestCases = sourceAssertions.map(
  ({ name }) => name,
);

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen, fireEvent } from "@testing-library/react";
import NotificationSettings from "../NotificationSettings";
import { useNotificationPreferences } from "../../Zustand/Store";

const source = readFileSync(
  resolve(__dirname, "../NotificationSettings.tsx"),
  "utf8",
);

describe("NotificationSettings theming", () => {
  notificationSettingsThemeTestCases.forEach((name) => {
    it(name, () => {
      expect(() => assertNotificationSettingsSource(source)).not.toThrow();
    });
  });
});

describe("NotificationSettings component behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 23, 15));
    localStorage.clear();
    useNotificationPreferences.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("renders default notification preferences from store", () => {
    render(<NotificationSettings />);

    const emailToggle = screen.getByLabelText(
      "Email Notification",
    ) as HTMLInputElement;
    const pushToggle = screen.getByLabelText(
      "Push Notification",
    ) as HTMLInputElement;
    const frequencySelect = screen.getByLabelText(
      "Notification Frequency",
    ) as HTMLSelectElement;
    const quietStartInput = screen.getByLabelText(
      "Quiet Hours Start",
    ) as HTMLInputElement;
    const quietEndInput = screen.getByLabelText(
      "Quiet Hours End",
    ) as HTMLInputElement;

    expect(emailToggle.checked).toBe(true);
    expect(pushToggle.checked).toBe(false);
    expect(frequencySelect.value).toBe("1");
    expect(quietStartInput.value).toBe("22:00");
    expect(quietEndInput.value).toBe("07:00");
    expect(screen.getByText("Quiet hours active now")).toBeInTheDocument();
  });

  it("updates the store when email notification toggle is clicked", () => {
    render(<NotificationSettings />);

    const emailToggle = screen.getByLabelText("Email Notification");
    fireEvent.click(emailToggle);

    expect(useNotificationPreferences.getState().email).toBe(false);
    expect(emailToggle).not.toBeChecked();
  });

  it("updates the store when push notification toggle is clicked", () => {
    render(<NotificationSettings />);

    const pushToggle = screen.getByLabelText("Push Notification");
    fireEvent.click(pushToggle);

    expect(useNotificationPreferences.getState().push).toBe(true);
    expect(pushToggle).toBeChecked();
  });

  it("updates the store when frequency select is changed", () => {
    render(<NotificationSettings />);

    const frequencySelect = screen.getByLabelText("Notification Frequency");
    fireEvent.change(frequencySelect, { target: { value: "2" } });

    expect(useNotificationPreferences.getState().frequency).toBe("2");
    expect(frequencySelect).toHaveValue("2");
  });

  it("updates the store when quiet hours range inputs are changed", () => {
    render(<NotificationSettings />);

    const quietStartInput = screen.getByLabelText("Quiet Hours Start");
    const quietEndInput = screen.getByLabelText("Quiet Hours End");
    fireEvent.change(quietStartInput, { target: { value: "18:30" } });
    fireEvent.change(quietEndInput, { target: { value: "23:30" } });

    expect(useNotificationPreferences.getState().quietStart).toBe("18:30");
    expect(useNotificationPreferences.getState().quietEnd).toBe("23:30");
    expect(useNotificationPreferences.getState().quietHours).toBe("18:30");
    expect(quietStartInput).toHaveValue("18:30");
    expect(quietEndInput).toHaveValue("23:30");
  });

  it("reflects values from the store when store values are updated elsewhere (remount / external state update)", () => {
    useNotificationPreferences.getState().setEmail(false);
    useNotificationPreferences.getState().setPush(true);
    useNotificationPreferences.getState().setFrequency("3");
    useNotificationPreferences.getState().setQuietRange("09:45", "17:30");

    render(<NotificationSettings />);

    const emailToggle = screen.getByLabelText(
      "Email Notification",
    ) as HTMLInputElement;
    const pushToggle = screen.getByLabelText(
      "Push Notification",
    ) as HTMLInputElement;
    const frequencySelect = screen.getByLabelText(
      "Notification Frequency",
    ) as HTMLSelectElement;
    const quietStartInput = screen.getByLabelText(
      "Quiet Hours Start",
    ) as HTMLInputElement;
    const quietEndInput = screen.getByLabelText(
      "Quiet Hours End",
    ) as HTMLInputElement;

    expect(emailToggle.checked).toBe(false);
    expect(pushToggle.checked).toBe(true);
    expect(frequencySelect.value).toBe("3");
    expect(quietStartInput.value).toBe("09:45");
    expect(quietEndInput.value).toBe("17:30");
  });

  it("resets all preferences to default values when reset button is clicked", () => {
    render(<NotificationSettings />);

    const emailToggle = screen.getByLabelText(
      "Email Notification",
    ) as HTMLInputElement;
    const pushToggle = screen.getByLabelText(
      "Push Notification",
    ) as HTMLInputElement;
    const frequencySelect = screen.getByLabelText(
      "Notification Frequency",
    ) as HTMLSelectElement;
    const quietStartInput = screen.getByLabelText(
      "Quiet Hours Start",
    ) as HTMLInputElement;
    const quietEndInput = screen.getByLabelText(
      "Quiet Hours End",
    ) as HTMLInputElement;

    fireEvent.click(emailToggle);
    fireEvent.click(pushToggle);
    fireEvent.change(frequencySelect, { target: { value: "4" } });
    fireEvent.change(quietStartInput, { target: { value: "23:00" } });
    fireEvent.change(quietEndInput, { target: { value: "08:00" } });

    expect(emailToggle.checked).toBe(false);
    expect(pushToggle.checked).toBe(true);
    expect(frequencySelect.value).toBe("4");
    expect(quietStartInput.value).toBe("23:00");
    expect(quietEndInput.value).toBe("08:00");

    const resetButton = screen.getByRole("button", {
      name: /Reset Preferences/i,
    });
    fireEvent.click(resetButton);

    expect(emailToggle.checked).toBe(true);
    expect(pushToggle.checked).toBe(false);
    expect(frequencySelect.value).toBe("1");
    expect(quietStartInput.value).toBe("22:00");
    expect(quietEndInput.value).toBe("07:00");

    const storeState = useNotificationPreferences.getState();
    expect(storeState.email).toBe(true);
    expect(storeState.push).toBe(false);
    expect(storeState.frequency).toBe("");
    expect(storeState.quietHours).toBe("12:00");
    expect(storeState.quietStart).toBe("22:00");
    expect(storeState.quietEnd).toBe("07:00");
  });

  it("shows validation feedback when quiet hours start and end are equal", () => {
    render(<NotificationSettings />);

    fireEvent.change(screen.getByLabelText("Quiet Hours End"), {
      target: { value: "22:00" },
    });

    expect(
      screen.getByText(/Quiet hours need a valid start and end time/i),
    ).toBeInTheDocument();
  });

  it("shows the inactive badge outside the quiet-hours range", () => {
    vi.setSystemTime(new Date(2026, 0, 1, 12, 0));

    render(<NotificationSettings />);

    expect(screen.getByText("Quiet hours inactive")).toBeInTheDocument();
  });
});
