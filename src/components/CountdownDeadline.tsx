import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

export type CountdownUrgency = 'neutral' | 'warning' | 'expired';

export interface TimeRemainingResult {
  label: string;
  urgency: CountdownUrgency;
  millisecondsRemaining: number;
  days: number;
  hours: number;
  minutes: number;
}

interface CountdownDeadlineProps {
  deadline: string;
  className?: string;
  labelPrefix?: string;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function nowMs(now: Date | number): number {
  return now instanceof Date ? now.getTime() : now;
}

function absoluteDeadline(deadline: string): string {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return deadline;

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeRemaining(deadline: string, now: Date | number = Date.now()): TimeRemainingResult {
  const deadlineMs = new Date(deadline).getTime();
  const diff = Number.isNaN(deadlineMs) ? 0 : deadlineMs - nowMs(now);

  if (diff <= 0) {
    return {
      label: 'Expired',
      urgency: 'expired',
      millisecondsRemaining: 0,
      days: 0,
      hours: 0,
      minutes: 0,
    };
  }

  const days = Math.floor(diff / DAY_MS);
  const hours = Math.floor((diff % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((diff % HOUR_MS) / MINUTE_MS);
  const urgency: CountdownUrgency = diff < DAY_MS ? 'warning' : 'neutral';

  let label: string;
  if (days > 0) {
    label = `${days}d ${hours}h left`;
  } else if (hours > 0) {
    label = `${hours}h ${minutes}m left`;
  } else if (minutes > 0) {
    label = `${minutes}m left`;
  } else {
    label = '<1m left';
  }

  return {
    label,
    urgency,
    millisecondsRemaining: diff,
    days,
    hours,
    minutes,
  };
}

function urgencyStyles(urgency: CountdownUrgency): CSSProperties {
  const token = {
    neutral: 'var(--muted)',
    warning: 'var(--warning)',
    expired: 'var(--danger)',
  }[urgency];

  return {
    color: token,
    borderColor: token,
    background: 'var(--surface)',
  };
}

export function CountdownDeadline({ deadline, className, labelPrefix = 'Deadline' }: CountdownDeadlineProps) {
  const [now, setNow] = useState(() => Date.now());
  const remaining = useMemo(() => timeRemaining(deadline, now), [deadline, now]);
  const absolute = useMemo(() => absoluteDeadline(deadline), [deadline]);

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), MINUTE_MS);
    return () => window.clearInterval(interval);
  }, [deadline]);

  return (
    <span
      aria-label={`${labelPrefix} ${absolute}: ${remaining.label}`}
      aria-live="off"
      className={className}
      title={`${labelPrefix} ${absolute}`}
      style={{
        ...urgencyStyles(remaining.urgency),
        border: '1px solid',
        borderRadius: 'var(--radius-full)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.4,
        padding: '2px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {remaining.label}
    </span>
  );
}
