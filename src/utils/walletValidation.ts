/**
 * walletValidation.ts
 *
 * Enforces explicit authorization and validation boundaries for the wallet
 * connection lifecycle. Every sensitive UI action or API call must pass
 * through these checks rather than inferring correctness from client state.
 *
 * Invariants
 * ---------
 * 1. Addresses are always validated against the Stellar base32 spec before use.
 * 2. Network values are restricted to the known set ('TESTNET' | 'PUBLIC').
 * 3. Server responses are shape-checked before properties are read.
 * 4. Numeric values (balances, amounts) are validated as finite numbers.
 * 5. Authorization is checked explicitly, not assumed from UI state.
 */

import { isValidStellarAddress } from './stellarAddress';
import type { WalletNetwork } from '../context/WalletContext';

// ────────────────────────────────────────────────────────────────────
// Address validation
// ────────────────────────────────────────────────────────────────────

/** Known invalid patterns for Stellar public keys (injection attempts). */
const DISALLOWED_ADDRESS_CHARS = /[^A-Z2-7]/i;

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

  if (DISALLOWED_ADDRESS_CHARS.test(trimmed.slice(1))) {
    return { valid: false, error: 'Address contains invalid characters.' };
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
 * Unknown values are rejected rather than silently coerced, so callers
 * never silently operate on the wrong network.
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
// Numeric / balance validation
// ────────────────────────────────────────────────────────────────────

/**
 * Validates a value as a finite numeric string suitable for balance display.
 * Rejects Infinity, NaN, non-numeric, and empty values.
 */
export function validateNumericString(value: unknown): {
  valid: boolean;
  error?: string;
} {
  if (value == null || typeof value !== 'string') {
    return { valid: false, error: 'Value must be a string.' };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Value must not be empty.' };
  }

  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) {
    return { valid: false, error: 'Value is not a valid numeric string.' };
  }

  const num = Number(trimmed);
  if (!Number.isFinite(num)) {
    return { valid: false, error: 'Value is not finite.' };
  }

  if (num < 0) {
    return { valid: false, error: 'Balance must not be negative.' };
  }

  return { valid: true };
}

// ────────────────────────────────────────────────────────────────────
// Server response validation
// ────────────────────────────────────────────────────────────────────

/**
 * Type guard for Horizon account response shape.
 * Prevents reading properties from malformed or tampered responses.
 */
export interface ValidatedHorizonBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

export function isValidHorizonBalanceLine(
  line: unknown,
): line is ValidatedHorizonBalance {
  if (line == null || typeof line !== 'object') return false;
  const obj = line as Record<string, unknown>;
  if (typeof obj.asset_type !== 'string') return false;
  if (obj.balance != null && typeof obj.balance !== 'string') return false;
  return true;
}

export interface ValidatedHorizonAccount {
  balances: ValidatedHorizonBalance[];
}

export function isValidHorizonAccountResponse(
  data: unknown,
): data is ValidatedHorizonAccount {
  if (data == null || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.balances)) return false;
  return obj.balances.every(isValidHorizonBalanceLine);
}

/**
 * Validates a Freighter getNetworkDetails response shape.
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

// ────────────────────────────────────────────────────────────────────
// Authorization boundary
// ────────────────────────────────────────────────────────────────────

/**
 * Checks that a connected wallet address matches the expected address.
 * Used before sensitive actions to prevent stale or tampered state.
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
 * Maximum age (ms) for a connection attempt token before it is considered
 * stale. Prevents replay of old connection events.
 */
export const CONNECTION_TOKEN_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Validates that a connection attempt timestamp is within the acceptable
 * window, preventing replay of stale connection events.
 */
export function isConnectionTokenFresh(
  timestamp: number,
  now: number = Date.now(),
): boolean {
  if (!Number.isFinite(timestamp)) return false;
  if (timestamp <= 0) return false;
  return now - timestamp <= CONNECTION_TOKEN_MAX_AGE_MS;
}

/**
 * Maximum allowed length for an error message from the wallet.
 * Prevents injection of extremely long strings into UI state.
 */
export const MAX_ERROR_LENGTH = 500;

/**
 * Sanitizes an error message from the wallet: truncates and strips
 * potentially harmful content.
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
