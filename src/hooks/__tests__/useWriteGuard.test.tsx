import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WalletNetwork, WalletStatus } from '../../context/WalletContext';

const walletValue = vi.hoisted(() => {
  return {
    current: undefined as
      | {
          status?: WalletStatus;
          isConnecting?: boolean;
          address?: string | null;
          network?: WalletNetwork | null;
        }
      | undefined,
  };
});

// The guard is built on useOptionalWallet, so a direct module mock reproduces
// every wallet state without mounting the real Freighter provider.
vi.mock('../../context/WalletContext', () => ({
  useOptionalWallet: () => walletValue.current,
}));

import { useWriteGuard } from '../useWriteGuard';
import { ACCOUNT_A } from '@/__tests__/fixtures/stellarAddresses';

function setWallet(state: (typeof walletValue)['current']) {
  walletValue.current = state;
}

function renderGuard() {
  const { result } = renderHook(() => useWriteGuard());
  return result.current;
}

describe('useWriteGuard', () => {
  beforeEach(() => {
    setWallet(undefined);
  });

  it('refuses when no wallet context is available at all (fail closed)', () => {
    setWallet(undefined);

    const guard = renderGuard();

    expect(guard.canWrite).toBe(false);
    expect(guard.reason).toMatch(/connect your wallet/i);
  });

  it('refuses when the wallet is disconnected', () => {
    setWallet({ status: 'disconnected', address: null, network: null });

    const guard = renderGuard();

    expect(guard.canWrite).toBe(false);
    expect(guard.reason).toMatch(/connect your wallet/i);
  });

  it('refuses while the session is restoring without treating the unknown network as a mismatch', () => {
    // network is null while restoring: "not yet known", not "wrong network".
    setWallet({ status: 'restoring', address: ACCOUNT_A, network: null });

    const guard = renderGuard();

    expect(guard.canWrite).toBe(false);
    expect(guard.reason).toMatch(/verifying your wallet session/i);
    expect(guard.reason?.toLowerCase()).not.toContain('wrong wallet network');
  });

  it('refuses while the wallet is connecting', () => {
    setWallet({ status: 'connecting', address: null, network: null });

    const guard = renderGuard();

    expect(guard.canWrite).toBe(false);
    expect(guard.reason).toMatch(/verifying your wallet session/i);
  });

  it('refuses when the address is missing or fails checksum validation', () => {
    setWallet({ status: 'connected', address: 'GBAD-WRONG', network: 'TESTNET' });

    const guard = renderGuard();

    expect(guard.canWrite).toBe(false);
    expect(guard.reason).toMatch(/address is invalid|reconnect/i);
  });

  it('refuses while the network has not been resolved yet (null, connected)', () => {
    setWallet({ status: 'connected', address: ACCOUNT_A, network: null });

    const guard = renderGuard();

    expect(guard.canWrite).toBe(false);
    expect(guard.reason).toMatch(/not yet known/i);
    expect(guard.reason?.toLowerCase()).not.toContain('wrong wallet network');
  });

  it('refuses on a network mismatch and names both networks', () => {
    setWallet({ status: 'connected', address: ACCOUNT_A, network: 'PUBLIC' });

    const guard = renderGuard();

    expect(guard.canWrite).toBe(false);
    expect(guard.reason).toMatch(/Mainnet/);
    expect(guard.reason).toMatch(/Testnet/);
    expect(guard.reason).toMatch(/switch the freighter network/i);
  });

  it('refuses an unknown network string as a mismatch', () => {
    setWallet({ status: 'connected', address: ACCOUNT_A, network: 'FUTURENET' });

    const guard = renderGuard();

    expect(guard.canWrite).toBe(false);
    expect(guard.reason).toMatch(/unknown network/i);
  });

  it('allows writes when the connected wallet matches the expected TESTNET network', () => {
    setWallet({ status: 'connected', address: ACCOUNT_A, network: 'TESTNET' });

    const guard = renderGuard();

    expect(guard.canWrite).toBe(true);
    expect(guard.reason).toBeNull();
  });

  it('allows demo mode (TESTNET wallet) when the app expects TESTNET', () => {
    setWallet({
      status: 'connected',
      address: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
      network: 'TESTNET',
    });

    const guard = renderGuard();

    expect(guard.canWrite).toBe(true);
    expect(guard.reason).toBeNull();
  });

  it('reflects wallet state changes across renders', () => {
    setWallet({ status: 'connected', address: ACCOUNT_A, network: 'PUBLIC' });
    let guard = renderGuard();
    expect(guard.canWrite).toBe(false);

    setWallet({ status: 'connected', address: ACCOUNT_A, network: 'TESTNET' });
    guard = renderGuard();
    expect(guard.canWrite).toBe(true);
    expect(guard.reason).toBeNull();
  });
});
