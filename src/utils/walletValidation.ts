/**
 * walletValidation.ts
 *
 * Enforces explicit authorization and validation boundaries for wallet
 * selection, network mismatch, and connection lifecycle operations.
 *
 * Invariants
 * ---------
 * 1. Addresses are always validated against the Stellar base32 spec before use.
 * 2. Network values are restricted to the known set ('TESTNET' | 'PUBLIC').
 * 3. Server responses are shape-checked before properties are read.
 * 4. Authorization is checked explicitly, not assumed from UI state.
 * 5. Error messages are sanitized to prevent injection into UI state.
 */

import { isValidStellarAddress } from './stellarAddress';
import type { WalletNetwork } from '../context/WalletContext';

// ────────────────────────────────────────────────────────────────────
// Address validation
// ────────────────────────────────────────────────────────────────────

/**
 * Validates a wallet address for use in sensitive operations.
 * Rejects empty, malformed, non-56-char, or injection-attempt strings.
 */
export function validateWalletAddress(address: unknown): {
  valid: boolean;
  error?: string;
} {
  if (address == null || typeof address !== 'string') {
    return { valid: false, error: 'Address is required.' };
  }

  const trimmed = address.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Address must not be empty.' };
  }

  if (trimmed.length !== 56) {
    return { valid: false, error: `Invalid address length: expected 56, got ${trimmed.length}.` };
  }

  const prefix = trimmed[0];
  if (prefix !== 'G' && prefix !== 'C') {
    return { valid: false, error: 'Address must start with G or C.' };
  }

  if (!isValidStellarAddress(trimmed)) {
    return { valid: false, error: 'Address failed Stellar base32 validation.' };
  }

  return { valid: true };
}

// ────────────────────────────────────────────────────────────────────
// Network validation
// ────────────────────────────────────────────────────────────────────

const KNOWN_NETWORKS: readonly WalletNetwork[] = ['TESTNET', 'PUBLIC'];

/**
 * Validates and normalizes a network string.
 * Unknown values are rejected rather than silently coerced.
 */
export function validateNetwork(network: unknown): {
  valid: boolean;
  value?: WalletNetwork;
  error?: string;
} {
  if (network == null || typeof network !== 'string') {
    return { valid: false, error: 'Network is required.' };
  }

  const trimmed = network.trim() as WalletNetwork;
  if ((KNOWN_NETWORKS as readonly string[]).includes(trimmed)) {
    return { valid: true, value: trimmed };
  }

  return {
    valid: false,
    error: `Unknown network "${network}". Expected one of: ${KNOWN_NETWORKS.join(', ')}.`,
  };
}

// ────────────────────────────────────────────────────────────────────
// Server response validation
// ────────────────────────────────────────────────────────────────────

/**
 * Type guard for Freighter getNetworkDetails response shape.
 */
export interface ValidatedNetworkDetails {
  network: string;
}

export function isValidNetworkDetailsResponse(
  data: unknown,
): data is ValidatedNetworkDetails {
  if (data == null || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.network === 'string' && obj.network.trim().length > 0;
}

/**
 * Type guard for Freighter getAddress response shape.
 */
export function isValidAddressResponse(
  data: unknown,
): data is { address: string; error?: string } {
  if (data == null || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.address === 'string';
}

/**
 * Type guard for Freighter isAllowed response shape.
 */
export function isValidAllowedResponse(
  data: unknown,
): data is { isAllowed: boolean } {
  if (data == null || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.isAllowed === 'boolean';
}

// ────────────────────────────────────────────────────────────────────
// Authorization boundary
// ────────────────────────────────────────────────────────────────────

/**
 * Checks that a connected wallet address matches the expected address.
 */
export function assertOwnershipMatch(
  connectedAddress: string | null,
  expectedAddress: string | null,
): { authorized: boolean; error?: string } {
  if (connectedAddress == null) {
    return { authorized: false, error: 'No wallet connected.' };
  }
  if (expectedAddress == null) {
    return { authorized: false, error: 'No expected address to verify against.' };
  }
  if (connectedAddress !== expectedAddress) {
    return {
      authorized: false,
      error: 'Connected address does not match expected address.',
    };
  }
  return { authorized: true };
}

/**
 * Checks that the wallet's current network matches the expected network.
 */
export function assertNetworkMatch(
  walletNetwork: WalletNetwork | null,
  expectedNetwork: WalletNetwork,
): { authorized: boolean; error?: string } {
  if (walletNetwork == null) {
    return { authorized: false, error: 'No network reported by wallet.' };
  }
  if (walletNetwork !== expectedNetwork) {
    return {
      authorized: false,
      error: `Network mismatch: wallet is on ${walletNetwork}, expected ${expectedNetwork}.`,
    };
  }
  return { authorized: true };
}

// ────────────────────────────────────────────────────────────────────
// Replay / tamper detection helpers
// ────────────────────────────────────────────────────────────────────

/**
 * Maximum age (ms) for a connection attempt token before it is considered stale.
 */
export const CONNECTION_TOKEN_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Validates that a connection attempt timestamp is within the acceptable window.
 */
export function isConnectionTokenFresh(
  timestamp: number,
  now: number = Date.now(),
): boolean {
  if (!Number.isFinite(timestamp)) return false;
  if (timestamp <= 0) return false;
  return now - timestamp <= CONNECTION_TOKEN_MAX_AGE_MS;
}

// ────────────────────────────────────────────────────────────────────
// Error sanitization
// ────────────────────────────────────────────────────────────────────

/**
 * Maximum allowed length for an error message from the wallet.
 */
export const MAX_ERROR_LENGTH = 500;

/**
 * Sanitizes an error message: truncates and strips potentially harmful content.
 */
export function sanitizeWalletError(raw: unknown): string {
  if (raw == null) return 'An unknown wallet error occurred.';

  const text = typeof raw === 'string' ? raw : String(raw);
  const trimmed = text.trim();
  if (trimmed.length === 0) return 'An unknown wallet error occurred.';

  if (trimmed.length > MAX_ERROR_LENGTH) {
    return trimmed.slice(0, MAX_ERROR_LENGTH) + '…';
  }

  return trimmed;
}

// ────────────────────────────────────────────────────────────────────
// Mismatch key generation (for NetworkMismatchBanner)
// ────────────────────────────────────────────────────────────────────

/**
 * Generates a stable, tamper-resistant key for mismatch dismiss state.
 * Encodes address, network, and expected network so dismissed state
 * cannot persist across different wallet/network combinations.
 */
export function buildMismatchKey(
  address: string | null,
  network: WalletNetwork | null,
  expectedNetwork: WalletNetwork,
): string {
  const safeAddr = address != null && validateWalletAddress(address).valid ? address : 'invalid';
  const safeNet = validateNetwork(network).valid ? network : 'unknown';
  return `${safeAddr}:${safeNet}:${expectedNetwork}`;
}
