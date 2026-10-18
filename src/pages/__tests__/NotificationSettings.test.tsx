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
    pattern: /\.peer:checked \+ \.notification-settings-toggle[\s\S]*background:\s*var\(--accent\)/,
  },
];

export function assertNotificationSettingsSource(source: string) {
  const missing = sourceAssertions
    .filter(({ pattern }) => !pattern.test(source))
    .map(({ name }) => name);

  if (missing.length > 0) {
    throw new Error(`NotificationSettings theming assertions failed: ${missing.join(", ")}`);
  }
}

export const notificationSettingsThemeTestCases = sourceAssertions.map(({ name }) => name);
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotificationSettings from "../NotificationSettings";

describe("NotificationSettings", () => {
  it("renders notification preferences and vault settings", () => {
    render(<NotificationSettings />);

    expect(screen.getByRole("heading", { name: "Notification Settings" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Email Notification" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Push Notification" })).not.toBeChecked();
    expect(screen.getByRole("heading", { name: "Vault Notifications" })).toBeInTheDocument();
    expect(screen.getByText("First Vault")).toBeInTheDocument();
  });

  it("updates controlled notification toggles", () => {
    render(<NotificationSettings />);

    const emailToggle = screen.getByRole("checkbox", { name: "Email Notification" });
    const pushToggle = screen.getByRole("checkbox", { name: "Push Notification" });

    fireEvent.click(emailToggle);
    fireEvent.click(pushToggle);

    expect(emailToggle).not.toBeChecked();
    expect(pushToggle).toBeChecked();
  });
});
