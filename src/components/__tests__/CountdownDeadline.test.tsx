import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CountdownDeadline, timeRemaining } from '../CountdownDeadline';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('timeRemaining', () => {
  it('returns a multi-day neutral countdown', () => {
    const result = timeRemaining('2024-07-15T10:00:00Z', new Date('2024-07-01T00:00:00Z'));

    expect(result).toMatchObject({
      label: '14d 10h left',
      urgency: 'neutral',
      days: 14,
      hours: 10,
      minutes: 0,
    });
  });

  it('escalates deadlines under 24 hours to warning', () => {
    const result = timeRemaining('2024-07-02T00:30:00Z', new Date('2024-07-01T04:00:00Z'));

    expect(result).toMatchObject({
      label: '20h 30m left',
      urgency: 'warning',
      days: 0,
      hours: 20,
      minutes: 30,
    });
  });

  it('handles expired and sub-minute deadlines', () => {
    expect(timeRemaining('2024-07-01T00:00:00Z', new Date('2024-07-01T00:00:00Z'))).toMatchObject({
      label: 'Expired',
      urgency: 'expired',
    });

    expect(timeRemaining('2024-07-01T00:00:30Z', new Date('2024-07-01T00:00:00Z'))).toMatchObject({
      label: '<1m left',
      urgency: 'warning',
    });
  });
});

describe('CountdownDeadline', () => {
  it('renders an accessible neutral countdown', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-01T00:00:00Z'));

    render(<CountdownDeadline deadline="2024-07-15T10:00:00Z" labelPrefix="Vault deadline" />);

    const countdown = screen.getByText('14d 10h left');
    expect(countdown).toHaveAttribute('aria-live', 'off');
    expect(countdown).toHaveAttribute('aria-label', expect.stringContaining('Vault deadline'));
    expect(countdown).toHaveAttribute('title', expect.stringContaining('Vault deadline'));
    expect(countdown).toHaveStyle({ color: 'var(--muted)' });
  });

  it('updates on an interval and cleans it up on unmount', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-15T09:58:00Z'));
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const setIntervalSpy = vi.spyOn(window, 'setInterval');

    const { unmount } = render(<CountdownDeadline deadline="2024-07-15T10:00:00Z" />);

    expect(screen.getByText('2m left')).toHaveStyle({ color: 'var(--warning)' });
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(screen.getByText('1m left')).toBeInTheDocument();

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it('renders expired deadlines with danger styling', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-02T00:00:00Z'));

    render(<CountdownDeadline deadline="2024-07-01T00:00:00Z" />);

    expect(screen.getByText('Expired')).toHaveStyle({ color: 'var(--danger)' });
  });

  it('falls back safely for invalid deadlines', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-01T00:00:00Z'));

    render(<CountdownDeadline deadline="not-a-valid-date" labelPrefix="Broken deadline" />);

    const countdown = screen.getByText('Expired');
    expect(countdown).toHaveAttribute('title', 'Broken deadline not-a-valid-date');
    expect(countdown).toHaveAttribute('aria-label', 'Broken deadline not-a-valid-date: Expired');
    expect(countdown).toHaveStyle({ color: 'var(--danger)' });
  });
});
