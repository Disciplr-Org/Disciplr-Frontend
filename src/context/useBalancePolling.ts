/**
 * useBalancePolling
 *
 * Encapsulates the 30-second USDC balance refresh interval.
 * - Pauses when the document is hidden (visibilitychange).
 * - Runs only while a wallet address is present.
 * - Accepts an injected clock (setInterval / clearInterval) for deterministic
 *   testing with fake timers.
 */

import { useEffect, useRef } from 'react';
import { BALANCE_REFRESH_INTERVAL } from './WalletContext';

interface UseBalancePollingOptions {
  address: string | null;
  onTick: () => void;
  setIntervalFn?: typeof setInterval;
  clearIntervalFn?: typeof clearInterval;
}

export function useBalancePolling({
  address,
  onTick,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
}: UseBalancePollingOptions): void {
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    if (!address) return;

    const tick = () => {
      if (document.hidden) return;
      onTickRef.current();
    };

    const id = setIntervalFn(tick, BALANCE_REFRESH_INTERVAL);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        onTickRef.current();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearIntervalFn(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [address, setIntervalFn, clearIntervalFn]);
}
