import { useEffect, useState } from 'react';

const DEFAULT_INTERVAL_MS = 60000;

export function useCurrentTime(intervalMs = DEFAULT_INTERVAL_MS): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}
