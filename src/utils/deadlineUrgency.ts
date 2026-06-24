export type DeadlineUrgencyTier = 'safe' | 'soon' | 'critical';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const CRITICAL_DEADLINE_MS = DAY_MS;
export const SOON_DEADLINE_MS = 7 * DAY_MS;

// Thresholds: >7d is safe, 24h-7d is soon, <=24h/past/invalid is critical.
export function deadlineUrgency(
  deadline: string,
  now: Date | number = Date.now(),
): DeadlineUrgencyTier {
  const deadlineMs = new Date(deadline).getTime();

  if (Number.isNaN(deadlineMs)) {
    return 'critical';
  }

  const nowMs = typeof now === 'number' ? now : now.getTime();
  const msRemaining = deadlineMs - nowMs;

  if (msRemaining <= CRITICAL_DEADLINE_MS) {
    return 'critical';
  }

  if (msRemaining <= SOON_DEADLINE_MS) {
    return 'soon';
  }

  return 'safe';
}
