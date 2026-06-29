type SourceAssertion = {
  name: string;
  pattern: RegExp;
};

const sourceAssertions: SourceAssertion[] = [
  {
    name: "uses checked state for email notifications",
    pattern: /checked=\{emailNotification(?:\s*\?\?\s*false)?\}/,
  },
  {
    name: "uses checked state for push notifications",
    pattern: /checked=\{pushNotification(?:\s*\?\?\s*false)?\}/,
  },
  {
    name: "uses tokenized surface and text colors",
    pattern: /background:\s*var\(--surface\)[\s\S]*color:\s*var\(--text\)/,
  },
  {
    name: "adopts Switch component for email toggle",
    pattern: /<Switch[\s\S]*label="Email Notification"/,
  },
  {
    name: "adopts Switch component for push toggle",
    pattern: /<Switch[\s\S]*label="Push Notification"/,
  },
];

export function assertNotificationSettingsSource(source: string) {
  const missing = sourceAssertions
    .filter(({ pattern }) => !pattern.test(source))
    .map(({ name }) => name);

  if (missing.length > 0) {
    throw new Error(`NotificationSettings assertions failed: ${missing.join(", ")}`);
  }
}

export const notificationSettingsThemeTestCases = sourceAssertions.map(
  ({ name }) => name,
);

describe('NotificationSettings source assertions', () => {
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

    const emailSwitch = screen.getByRole('switch', { name: 'Email Notification' });
    const pushSwitch = screen.getByRole('switch', { name: 'Push Notification' });
    const frequencySelect = screen.getByLabelText('Notification Frequency') as HTMLSelectElement;
    const quietHoursInput = screen.getByLabelText('Quiet Hours') as HTMLInputElement;

    expect(emailSwitch).toHaveAttribute('aria-checked', 'true');
    expect(pushSwitch).toHaveAttribute('aria-checked', 'false');
    expect(frequencySelect.value).toBe('1');
    expect(quietHoursInput.value).toBe('12:00');
  });

  it("updates the store when email notification toggle is clicked", () => {
    render(<NotificationSettings />);

    const emailSwitch = screen.getByRole('switch', { name: 'Email Notification' });
    fireEvent.click(emailSwitch);

    expect(useNotificationPreferences.getState().email).toBe(false);
    expect(emailSwitch).toHaveAttribute('aria-checked', 'false');
  });

  it("updates the store when push notification toggle is clicked", () => {
    render(<NotificationSettings />);

    const pushSwitch = screen.getByRole('switch', { name: 'Push Notification' });
    fireEvent.click(pushSwitch);

    expect(useNotificationPreferences.getState().push).toBe(true);
    expect(pushSwitch).toHaveAttribute('aria-checked', 'true');
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

    const emailSwitch = screen.getByRole('switch', { name: 'Email Notification' });
    const pushSwitch = screen.getByRole('switch', { name: 'Push Notification' });
    const frequencySelect = screen.getByLabelText('Notification Frequency') as HTMLSelectElement;
    const quietHoursInput = screen.getByLabelText('Quiet Hours') as HTMLInputElement;

    expect(emailSwitch).toHaveAttribute('aria-checked', 'false');
    expect(pushSwitch).toHaveAttribute('aria-checked', 'true');
    expect(frequencySelect.value).toBe('3');
    expect(quietHoursInput.value).toBe('09:45');
  });

  it("resets all preferences to default values when reset button is clicked", () => {
    render(<NotificationSettings />);

    const emailSwitch = screen.getByRole('switch', { name: 'Email Notification' });
    const pushSwitch = screen.getByRole('switch', { name: 'Push Notification' });
    const frequencySelect = screen.getByLabelText('Notification Frequency') as HTMLSelectElement;
    const quietHoursInput = screen.getByLabelText('Quiet Hours') as HTMLInputElement;

    fireEvent.click(emailSwitch);
    fireEvent.click(pushSwitch);
    fireEvent.change(frequencySelect, { target: { value: '4' } });
    fireEvent.change(quietHoursInput, { target: { value: '23:00' } });

    expect(emailSwitch).toHaveAttribute('aria-checked', 'false');
    expect(pushSwitch).toHaveAttribute('aria-checked', 'true');
    expect(frequencySelect.value).toBe('4');
    expect(quietHoursInput.value).toBe('23:00');

    const resetButton = screen.getByRole("button", {
      name: /Reset Preferences/i,
    });
    fireEvent.click(resetButton);

    expect(emailSwitch).toHaveAttribute('aria-checked', 'true');
    expect(pushSwitch).toHaveAttribute('aria-checked', 'false');
    expect(frequencySelect.value).toBe('1');
    expect(quietHoursInput.value).toBe('12:00');

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
