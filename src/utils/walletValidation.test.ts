import { describe, it, expect } from 'vitest';
import {
    validateWalletAddress,
    validateNetwork,
    isValidNetworkDetailsResponse,
    isValidAddressResponse,
    isValidAllowedResponse,
    assertOwnershipMatch,
    assertNetworkMatch,
    isConnectionTokenFresh,
    sanitizeWalletError,
    buildMismatchKey,
    CONNECTION_TOKEN_MAX_AGE_MS,
    MAX_ERROR_LENGTH,
} from './walletValidation';

// ────────────────────────────────────────────────────────────────────
// validateWalletAddress
// ────────────────────────────────────────────────────────────────────
describe('validateWalletAddress', () => {
    const VALID_G = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    const VALID_C = 'CAAFBFRSQV5A3YQJYBIKWNODW4Y7RZIH2FP3VK2WJCSCFUXNIQW3C7OY';

    it('accepts a valid G-prefixed address', () => {
        expect(validateWalletAddress(VALID_G)).toEqual({ valid: true });
    });

    it('accepts a valid C-prefixed address', () => {
        expect(validateWalletAddress(VALID_C)).toEqual({ valid: true });
    });

    it('trims whitespace before validation', () => {
        expect(validateWalletAddress(`  ${VALID_G}  `)).toEqual({ valid: true });
    });

    it('rejects null', () => {
        const result = validateWalletAddress(null);
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/required/i);
    });

    it('rejects undefined', () => {
        expect(validateWalletAddress(undefined).valid).toBe(false);
    });

    it('rejects empty string', () => {
        const result = validateWalletAddress('');
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/empty/i);
    });

    it('rejects non-string type', () => {
        expect(validateWalletAddress(12345).valid).toBe(false);
    });

    it('rejects address with wrong length', () => {
        const result = validateWalletAddress('GBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/length/i);
    });

    it('rejects address with wrong prefix', () => {
        const result = validateWalletAddress('ABBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
        expect(result.valid).toBe(false);
    });

    it('rejects lowercase letters', () => {
        const result = validateWalletAddress('gbBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFL');
        expect(result.valid).toBe(false);
    });

    it('rejects strings with injection characters', () => {
        const result = validateWalletAddress(VALID_G + '\n<script>alert(1)</script>');
        expect(result.valid).toBe(false);
    });
});

// ────────────────────────────────────────────────────────────────────
// validateNetwork
// ────────────────────────────────────────────────────────────────────
describe('validateNetwork', () => {
    it('accepts TESTNET', () => {
        const result = validateNetwork('TESTNET');
        expect(result.valid).toBe(true);
        expect(result.value).toBe('TESTNET');
    });

    it('accepts PUBLIC', () => {
        const result = validateNetwork('PUBLIC');
        expect(result.valid).toBe(true);
        expect(result.value).toBe('PUBLIC');
    });

    it('rejects unknown network string', () => {
        const result = validateNetwork('STANDALONE');
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/Unknown network/i);
    });

    it('rejects null', () => {
        expect(validateNetwork(null).valid).toBe(false);
    });

    it('rejects undefined', () => {
        expect(validateNetwork(undefined).valid).toBe(false);
    });

    it('rejects lowercase variant', () => {
        expect(validateNetwork('testnet').valid).toBe(false);
    });

    it('rejects mixed case', () => {
        expect(validateNetwork('Public').valid).toBe(false);
    });

    it('trims whitespace before checking', () => {
        const result = validateNetwork('  PUBLIC  ');
        expect(result.valid).toBe(true);
        expect(result.value).toBe('PUBLIC');
    });
});

// ────────────────────────────────────────────────────────────────────
// Response shape validators
// ────────────────────────────────────────────────────────────────────
describe('isValidNetworkDetailsResponse', () => {
    it('accepts valid network details', () => {
        expect(isValidNetworkDetailsResponse({ network: 'TESTNET' })).toBe(true);
    });

    it('rejects null', () => {
        expect(isValidNetworkDetailsResponse(null)).toBe(false);
    });

    it('rejects missing network', () => {
        expect(isValidNetworkDetailsResponse({})).toBe(false);
    });

    it('rejects empty network string', () => {
        expect(isValidNetworkDetailsResponse({ network: '' })).toBe(false);
    });

    it('rejects non-string network', () => {
        expect(isValidNetworkDetailsResponse({ network: 123 })).toBe(false);
    });
});

describe('isValidAddressResponse', () => {
    it('accepts valid address response', () => {
        expect(isValidAddressResponse({ address: 'GBBD...' })).toBe(true);
    });

    it('rejects null', () => {
        expect(isValidAddressResponse(null)).toBe(false);
    });

    it('rejects missing address', () => {
        expect(isValidAddressResponse({ error: 'no addr' })).toBe(false);
    });

    it('rejects non-string address', () => {
        expect(isValidAddressResponse({ address: 123 })).toBe(false);
    });
});

describe('isValidAllowedResponse', () => {
    it('accepts valid isAllowed response', () => {
        expect(isValidAllowedResponse({ isAllowed: true })).toBe(true);
        expect(isValidAllowedResponse({ isAllowed: false })).toBe(true);
    });

    it('rejects null', () => {
        expect(isValidAllowedResponse(null)).toBe(false);
    });

    it('rejects non-boolean isAllowed', () => {
        expect(isValidAllowedResponse({ isAllowed: 'yes' })).toBe(false);
    });
});

// ────────────────────────────────────────────────────────────────────
// Authorization boundary
// ────────────────────────────────────────────────────────────────────
describe('assertOwnershipMatch', () => {
    const addr = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

    it('authorizes when addresses match', () => {
        expect(assertOwnershipMatch(addr, addr)).toEqual({ authorized: true });
    });

    it('rejects when connected address is null', () => {
        const result = assertOwnershipMatch(null, addr);
        expect(result.authorized).toBe(false);
    });

    it('rejects when expected address is null', () => {
        const result = assertOwnershipMatch(addr, null);
        expect(result.authorized).toBe(false);
    });

    it('rejects when addresses differ', () => {
        const result = assertOwnershipMatch(addr, 'CAAFBFRSQV5A3YQJYBIKWNODW4Y7RZIH2FP3VK2WJCSCFUXNIQW3C7OY');
        expect(result.authorized).toBe(false);
    });
});

describe('assertNetworkMatch', () => {
    it('authorizes when networks match', () => {
        expect(assertNetworkMatch('TESTNET', 'TESTNET')).toEqual({ authorized: true });
    });

    it('rejects when wallet network is null', () => {
        const result = assertNetworkMatch(null, 'TESTNET');
        expect(result.authorized).toBe(false);
    });

    it('rejects on mismatch', () => {
        const result = assertNetworkMatch('PUBLIC', 'TESTNET');
        expect(result.authorized).toBe(false);
        expect(result.error).toMatch(/mismatch/i);
    });
});

// ────────────────────────────────────────────────────────────────────
// Replay / token freshness
// ────────────────────────────────────────────────────────────────────
describe('isConnectionTokenFresh', () => {
    it('accepts a recent timestamp', () => {
        expect(isConnectionTokenFresh(Date.now() - 1000, Date.now())).toBe(true);
    });

    it('rejects a timestamp older than max age', () => {
        const now = Date.now();
        expect(isConnectionTokenFresh(now - CONNECTION_TOKEN_MAX_AGE_MS - 1, now)).toBe(false);
    });

    it('accepts a timestamp at the boundary', () => {
        const now = Date.now();
        expect(isConnectionTokenFresh(now - CONNECTION_TOKEN_MAX_AGE_MS, now)).toBe(true);
    });

    it('rejects zero', () => {
        expect(isConnectionTokenFresh(0)).toBe(false);
    });

    it('rejects NaN', () => {
        expect(isConnectionTokenFresh(NaN)).toBe(false);
    });
});

// ────────────────────────────────────────────────────────────────────
// Error sanitization
// ────────────────────────────────────────────────────────────────────
describe('sanitizeWalletError', () => {
    it('returns the string when valid', () => {
        expect(sanitizeWalletError('Something went wrong')).toBe('Something went wrong');
    });

    it('trims whitespace', () => {
        expect(sanitizeWalletError('  error  ')).toBe('error');
    });

    it('returns default for null', () => {
        expect(sanitizeWalletError(null)).toMatch(/unknown wallet error/i);
    });

    it('returns default for undefined', () => {
        expect(sanitizeWalletError(undefined)).toMatch(/unknown wallet error/i);
    });

    it('returns default for empty string', () => {
        expect(sanitizeWalletError('')).toMatch(/unknown wallet error/i);
    });

    it('truncates extremely long messages', () => {
        const long = 'x'.repeat(MAX_ERROR_LENGTH + 100);
        const result = sanitizeWalletError(long);
        expect(result.length).toBeLessThanOrEqual(MAX_ERROR_LENGTH + 1);
        expect(result).toMatch(/…$/);
    });

    it('converts non-string to string', () => {
        expect(sanitizeWalletError(42)).toBe('42');
    });
});

// ────────────────────────────────────────────────────────────────────
// Mismatch key generation
// ────────────────────────────────────────────────────────────────────
describe('buildMismatchKey', () => {
    const VALID_ADDR = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

    it('builds key from valid inputs', () => {
        expect(buildMismatchKey(VALID_ADDR, 'TESTNET', 'PUBLIC'))
            .toBe(`${VALID_ADDR}:TESTNET:PUBLIC`);
    });

    it('uses "invalid" for invalid address', () => {
        expect(buildMismatchKey('not-valid', 'TESTNET', 'PUBLIC'))
            .toBe('invalid:TESTNET:PUBLIC');
    });

    it('uses "unknown" for invalid network', () => {
        expect(buildMismatchKey(VALID_ADDR, 'STANDALONE', 'TESTNET'))
            .toBe(`${VALID_ADDR}:unknown:TESTNET`);
    });

    it('handles null address and network', () => {
        expect(buildMismatchKey(null, null, 'TESTNET'))
            .toBe('invalid:unknown:TESTNET');
    });

    it('produces consistent keys for same inputs', () => {
        const key1 = buildMismatchKey(VALID_ADDR, 'PUBLIC', 'TESTNET');
        const key2 = buildMismatchKey(VALID_ADDR, 'PUBLIC', 'TESTNET');
        expect(key1).toBe(key2);
    });

    it('produces different keys for different inputs', () => {
        const key1 = buildMismatchKey(VALID_ADDR, 'TESTNET', 'PUBLIC');
        const key2 = buildMismatchKey(VALID_ADDR, 'PUBLIC', 'TESTNET');
        expect(key1).not.toBe(key2);
    });
});
