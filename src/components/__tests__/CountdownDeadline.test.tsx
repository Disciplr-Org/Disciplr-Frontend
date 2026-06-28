import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CountdownDeadline, timeRemaining } from '../CountdownDeadline';

describe('timeRemaining', () => {
  const now = new Date('2026-06-18T12:00:00Z');

  it('formats multi-day deadlines as normal', () => {
    expect(timeRemaining('2026-06-20T15:30:00Z', now)).toMatchObject({
      tone: 'normal',
      label: '2d 3h remaining',
    });
  });

  it('formats deadlines under 24 hours as urgent', () => {
    expect(timeRemaining('2026-06-18T23:45:00Z', now)).toMatchObject({
      tone: 'urgent',
      label: '11h 45m remaining',
    });
  });

  it('marks exactly-now and past deadlines as overdue', () => {
    expect(timeRemaining('2026-06-18T12:00:00Z', now).tone).toBe('expired');
    expect(timeRemaining('2026-06-18T11:59:00Z', now).label).toBe('Overdue');
  });

  it('handles invalid deadline strings', () => {
    expect(timeRemaining('not-a-date', now)).toMatchObject({
      tone: 'invalid',
      label: 'Invalid deadline',
    });
  });
});

describe('CountdownDeadline', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders an accessible absolute deadline without a noisy live region', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00Z'));

    render(<CountdownDeadline deadline="2026-06-19T00:00:00Z" />);

    const countdown = screen.getByLabelText(/Deadline Jun 19, 2026/);
    expect(countdown).toHaveTextContent('12h 0m remaining');
    expect(countdown).toHaveAttribute('aria-live', 'off');
    expect(countdown).toHaveAttribute('data-tone', 'urgent');
    expect(countdown).toHaveStyle({ color: 'var(--warning)' });
  });

  it('renders an optional prefix before the countdown label', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00Z'));

    render(<CountdownDeadline deadline="2026-06-20T12:00:00Z" prefix="Deadline:" />);

    expect(screen.getByText('Deadline: 2d 0h remaining')).toBeInTheDocument();
  });

  it('updates on an interval and cleans up when unmounted', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00Z'));
    const clearSpy = vi.spyOn(window, 'clearInterval');

    const { unmount } = render(
      <CountdownDeadline deadline="2026-06-18T12:02:00Z" intervalMs={60000} />
    );

    expect(screen.getByText('2m remaining')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(screen.getByText('1m remaining')).toBeInTheDocument();

    unmount();

    expect(clearSpy).toHaveBeenCalled();
  });

  it('shows "Overdue" label with danger color when deadline has passed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00Z'));

    render(<CountdownDeadline deadline="2026-06-17T00:00:00Z" />);

    const el = screen.getByText('Overdue');
    expect(el).toHaveAttribute('data-tone', 'expired');
    expect(el).toHaveStyle({ color: 'var(--danger)' });
  });

  it('does not fire onExpire when already expired on mount', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00Z'));
    const onExpire = vi.fn();

    render(<CountdownDeadline deadline="2026-06-17T00:00:00Z" onExpire={onExpire} />);

    expect(onExpire).not.toHaveBeenCalled();
  });

  it('fires onExpire exactly once when countdown crosses zero', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00Z'));
    const onExpire = vi.fn();

    render(
      <CountdownDeadline
        deadline="2026-06-18T12:01:00Z"
        intervalMs={60000}
        onExpire={onExpire}
      />
    );

    expect(onExpire).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(60000); });
    expect(onExpire).toHaveBeenCalledTimes(1);

    act(() => { vi.advanceTimersByTime(60000); });
    expect(onExpire).toHaveBeenCalledTimes(1); // still once
  });

  it('handles an invalid deadline without crashing', () => {
    vi.useFakeTimers();
    render(<CountdownDeadline deadline="not-a-date" />);
    expect(screen.getByText('Invalid deadline')).toBeInTheDocument();
  });
});
