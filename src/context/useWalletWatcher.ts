/**
 * useWalletWatcher
 *
 * Polls Freighter every ACCOUNT_POLL_INTERVAL ms to detect address or network
 * changes while a wallet is connected. Dispatches change events via the
 * provided callbacks.
 *
 * - Accepts an injected clock for deterministic testing.
 * - Accepts an injected FreighterAdapter so tests can supply a fake.
 */

import { useEffect, useRef } from 'react';
import { ACCOUNT_POLL_INTERVAL } from './WalletContext';
import type { FreighterAdapter } from './freighterAdapter';

interface UseWalletWatcherOptions {
  address: string | null;
  adapter: FreighterAdapter;
  onAddressChange: (newAddress: string) => void;
  onNetworkChange: (newNetwork: string) => void;
  setIntervalFn?: typeof setInterval;
  clearIntervalFn?: typeof clearInterval;
}

export function useWalletWatcher({
  address,
  adapter,
  onAddressChange,
  onNetworkChange,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
}: UseWalletWatcherOptions): void {
  const lastAddressRef = useRef<string | null>(address);
  const lastNetworkRef = useRef<string | null>(null);

  // Keep the ref in sync with the prop without re-subscribing the interval.
  useEffect(() => {
    lastAddressRef.current = address;
  }, [address]);

  const onAddressChangeRef = useRef(onAddressChange);
  const onNetworkChangeRef = useRef(onNetworkChange);
  onAddressChangeRef.current = onAddressChange;
  onNetworkChangeRef.current = onNetworkChange;

  useEffect(() => {
    if (!address) return;

    const tick = async () => {
      if (document.hidden) return;
      try {
        const { address: currentAddr, error: addrError } = await adapter.getAddress();
        if (currentAddr && !addrError && currentAddr !== lastAddressRef.current) {
          lastAddressRef.current = currentAddr;
          onAddressChangeRef.current(currentAddr);
        }

        const { network } = await adapter.getNetworkDetails();
        if (network && network !== lastNetworkRef.current) {
          lastNetworkRef.current = network;
          onNetworkChangeRef.current(network);
        }
      } catch {
        // Watcher errors are non-fatal; the next tick will retry.
      }
    };

    const id = setIntervalFn(tick, ACCOUNT_POLL_INTERVAL);
    return () => {
      clearIntervalFn(id);
    };
  }, [address, adapter, setIntervalFn, clearIntervalFn]);
}
