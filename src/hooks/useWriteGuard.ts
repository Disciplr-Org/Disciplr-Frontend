import { useOptionalWallet } from '../context/WalletContext';
import type { WalletNetwork, WalletStatus } from '../context/WalletContext';
import { APP_EXPECTED_NETWORK, isNetworkMismatch } from '../utils/networkMismatch';
import { isValidStellarAddress } from '../utils/stellarAddress';

/**
 * The pieces of wallet state the guard depends on. A subset is accepted so
 * partial wallet snapshots (e.g. store/test fixtures without a `status`)
 * remain usable.
 */
export interface WriteGuardWalletSnapshot {
  status?: WalletStatus;
  isConnecting?: boolean;
  address?: string | null;
  network?: WalletNetwork | null;
}

export interface WriteGuardResult {
  /** True only when the wallet is connected, the address is valid and the
   *  wallet network matches the app's expected network. */
  canWrite: boolean;
  /** Human-readable refusal for screen readers / error messages; null when
   *  writes are allowed. */
  reason: string | null;
}

/**
 * Single source of truth for "may this wallet submit a write?".
 *
 * Rules (in order):
 * 1. No wallet context at all            -> refuse (fail closed).
 * 2. Session not connected / connecting  -> refuse; a mid-flight session is
 *    "not yet known", never a mismatch.
 * 3. Missing or invalid address          -> refuse.
 * 4. Network still unknown (null)        -> refuse, but as "not yet known",
 *    not as a mismatch (matches the banner's behaviour while restoring).
 * 5. Network mismatch with APP_EXPECTED_NETWORK -> refuse with the switch
 *    instruction; unknown networks count as a mismatch.
 * 6. Demo mode is TESTNET, so it passes whenever the app expects TESTNET.
 *
 * This is a client-side precondition only; authoritative authorization stays
 * on-chain / server-side.
 */
export function evaluateWriteGuard(
  wallet: WriteGuardWalletSnapshot | undefined,
  expectedNetwork: WalletNetwork = APP_EXPECTED_NETWORK,
): WriteGuardResult {
  if (!wallet) {
    return {
      canWrite: false,
      reason: 'Connect your wallet before making changes.',
    };
  }

  const address = wallet.address ?? null;
  const network = wallet.network ?? null;

  // `status` is authoritative when present; snapshots without one fall back
  // to the connection-flow flag plus address presence.
  const connected =
    wallet.status != null
      ? wallet.status === 'connected'
      : !(wallet.isConnecting ?? false) && Boolean(address);

  if (!connected) {
    const inFlight =
      wallet.status === 'restoring' ||
      wallet.status === 'connecting' ||
      wallet.isConnecting === true;
    return {
      canWrite: false,
      reason: inFlight
        ? 'Still verifying your wallet session. Writes are disabled until the wallet is connected.'
        : 'Connect your wallet before making changes.',
    };
  }

  if (!address || !isValidStellarAddress(address)) {
    return {
      canWrite: false,
      reason:
        'The connected wallet address is invalid or unavailable. Reconnect your wallet.',
    };
  }

  if (network == null) {
    // Unknown is "not yet known", not a mismatch — but writes stay disabled
    // until the network is known.
    return {
      canWrite: false,
      reason: `The wallet network is not yet known, so writes are disabled. Disciplr expects ${expectedNetwork === 'PUBLIC' ? 'Mainnet' : 'Testnet'}.`,
    };
  }

  if (isNetworkMismatch(network, expectedNetwork)) {
    const walletNetworkLabel =
      network === 'PUBLIC' ? 'Mainnet' : network === 'TESTNET' ? 'Testnet' : 'an unknown network';
    const expectedLabel = expectedNetwork === 'PUBLIC' ? 'Mainnet' : 'Testnet';
    return {
      canWrite: false,
      reason: `Wrong wallet network: the wallet is on ${walletNetworkLabel}, but Disciplr expects ${expectedLabel}. Switch the Freighter network before making changes.`,
    };
  }

  return { canWrite: true, reason: null };
}

/**
 * Shared writes guard. Every write surface (create vault, vault actions,
 * verifier decisions, batch actions) must gate both its buttons and its
 * submit handlers on this hook's result.
 */
export function useWriteGuard(
  expectedNetwork: WalletNetwork = APP_EXPECTED_NETWORK,
): WriteGuardResult {
  const wallet = useOptionalWallet();
  return evaluateWriteGuard(
    wallet
      ? {
          status: wallet.status,
          isConnecting: wallet.isConnecting,
          address: wallet.address,
          network: wallet.network,
        }
      : undefined,
    expectedNetwork,
  );
}
