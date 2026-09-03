import { describe, it, expect } from 'vitest';
import {
    validateWalletAddress,
    validateNetwork,
    validateNumericString,
    isValidHorizonBalanceLine,
    isValidHorizonAccountResponse,
    isValidNetworkDetailsResponse,
    assertOwnershipMatch,
    assertNetworkMatch,
    isConnectionTokenFresh,
    sanitizeWalletError,
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
        const result = validateWalletAddress(undefined);
        expect(result.valid).toBe(false);
    });

    it('rejects empty string', () => {
        const result = validateWalletAddress('');
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/empty/i);
    });

    it('rejects non-string type', () => {
        const result = validateWalletAddress(12345);
        expect(result.valid).toBe(false);
    });

    it('rejects address with wrong length', () => {
        const result = validateWalletAddress('GBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/length/i);
    });

    it('rejects address with wrong prefix (non-G, non-C)', () => {
        const result = validateWalletAddress('ABBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/start with G or C/i);
    });

    it('rejects address with lowercase letters', () => {
        const result = validateWalletAddress('gbBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA');
        expect(result.valid).toBe(false);
    });

    it('rejects address with invalid base32 characters (0, 1, 8, 9)', () => {
        const result = validateWalletAddress('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFL' + '0');
        expect(result.valid).toBe(false);
    });

    it('rejects strings with injection characters', () => {
        const result = validateWalletAddress(VALID_G + '\n<script>alert(1)</script>');
        expect(result.valid).toBe(false);
    });

    it('rejects a string of random characters', () => {
        const result = validateWalletAddress('not-a-valid-address-at-all!!!');
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
        const result = validateNetwork(null);
        expect(result.valid).toBe(false);
    });

    it('rejects undefined', () => {
        const result = validateNetwork(undefined);
        expect(result.valid).toBe(false);
    });

    it('rejects lowercase variant (must be exact)', () => {
        const result = validateNetwork('testnet');
        expect(result.valid).toBe(false);
    });

    it('rejects mixed case', () => {
        const result = validateNetwork('Public');
        expect(result.valid).toBe(false);
    });

    it('trims whitespace before checking', () => {
        const result = validateNetwork('  PUBLIC  ');
        expect(result.valid).toBe(true);
        expect(result.value).toBe('PUBLIC');
    });
});

// ────────────────────────────────────────────────────────────────────
// validateNumericString
// ────────────────────────────────────────────────────────────────────
describe('validateNumericString', () => {
    it('accepts a positive integer', () => {
        expect(validateNumericString('100')).toEqual({ valid: true });
    });

    it('accepts a decimal string', () => {
        expect(validateNumericString('1.5')).toEqual({ valid: true });
    });

    it('accepts zero', () => {
        expect(validateNumericString('0')).toEqual({ valid: true });
    });

    it('accepts a leading-dot decimal', () => {
        expect(validateNumericString('.5')).toEqual({ valid: true });
    });

    it('accepts a large number', () => {
        expect(validateNumericString('999999999999')).toEqual({ valid: true });
    });

    it('rejects negative number', () => {
        const result = validateNumericString('-1');
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/negative/i);
    });

    it('rejects empty string', () => {
        expect(validateNumericString('').valid).toBe(false);
    });

    it('rejects non-numeric string', () => {
        expect(validateNumericString('abc').valid).toBe(false);
    });

    it('rejects Infinity', () => {
        expect(validateNumericString('Infinity').valid).toBe(false);
    });

    it('rejects NaN representation', () => {
        expect(validateNumericString('NaN').valid).toBe(false);
    });

    it('rejects null', () => {
        expect(validateNumericString(null).valid).toBe(false);
    });

    it('rejects a string with multiple dots', () => {
        expect(validateNumericString('1.2.3').valid).toBe(false);
    });
});

// ────────────────────────────────────────────────────────────────────
// Horizon response shape validators
// ────────────────────────────────────────────────────────────────────
describe('isValidHorizonBalanceLine', () => {
    it('accepts a valid balance line', () => {
        expect(isValidHorizonBalanceLine({
            asset_type: 'credit_alphanum4',
            asset_code: 'USDC',
            asset_issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
            balance: '10.5',
        })).toBe(true);
    });

    it('accepts a line without optional fields', () => {
        expect(isValidHorizonBalanceLine({ asset_type: 'native', balance: '100' })).toBe(true);
    });

    it('accepts null balance (Horizon may omit it)', () => {
        expect(isValidHorizonBalanceLine({ asset_type: 'native' })).toBe(true);
    });

    it('rejects null', () => {
        expect(isValidHorizonBalanceLine(null)).toBe(false);
    });

    it('rejects non-object', () => {
        expect(isValidHorizonBalanceLine('string')).toBe(false);
    });

    it('rejects missing asset_type', () => {
        expect(isValidHorizonBalanceLine({ balance: '10' })).toBe(false);
    });

    it('rejects non-string balance', () => {
        expect(isValidHorizonBalanceLine({ asset_type: 'native', balance: 10 })).toBe(false);
    });
});

describe('isValidHorizonAccountResponse', () => {
    it('accepts a valid account with balance lines', () => {
        expect(isValidHorizonAccountResponse({
            balances: [
                { asset_type: 'native', balance: '100' },
                { asset_type: 'credit_alphanum4', asset_code: 'USDC', balance: '50' },
            ],
        })).toBe(true);
    });

    it('accepts empty balances array', () => {
        expect(isValidHorizonAccountResponse({ balances: [] })).toBe(true);
    });

    it('rejects null', () => {
        expect(isValidHorizonAccountResponse(null)).toBe(false);
    });

    it('rejects missing balances', () => {
        expect(isValidHorizonAccountResponse({})).toBe(false);
    });

    it('rejects non-array balances', () => {
        expect(isValidHorizonAccountResponse({ balances: 'not-array' })).toBe(false);
    });

    it('rejects array with invalid line', () => {
        expect(isValidHorizonAccountResponse({
            balances: [{ not_asset_type: true }],
        })).toBe(false);
    });

    it('rejects tampered/non-object response', () => {
        expect(isValidHorizonAccountResponse('tampered')).toBe(false);
    });
});

describe('isValidNetworkDetailsResponse', () => {
    it('accepts a valid network details', () => {
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

    it('rejects non-object', () => {
        expect(isValidNetworkDetailsResponse('string')).toBe(false);
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
        expect(result.error).toMatch(/No wallet connected/i);
    });

    it('rejects when expected address is null', () => {
        const result = assertOwnershipMatch(addr, null);
        expect(result.authorized).toBe(false);
        expect(result.error).toMatch(/No expected/i);
    });

    it('rejects when addresses differ', () => {
        const result = assertOwnershipMatch(addr, 'CAAFBFRSQV5A3YQJYBIKWNODW4Y7RZIH2FP3VK2WJCSCFUXNIQW3C7OY');
        expect(result.authorized).toBe(false);
        expect(result.error).toMatch(/does not match/i);
    });

    it('rejects when both are null', () => {
        expect(assertOwnershipMatch(null, null).authorized).toBe(false);
    });
});

describe('assertNetworkMatch', () => {
    it('authorizes when networks match', () => {
        expect(assertNetworkMatch('TESTNET', 'TESTNET')).toEqual({ authorized: true });
    });

    it('authorizes when PUBLIC matches PUBLIC', () => {
        expect(assertNetworkMatch('PUBLIC', 'PUBLIC')).toEqual({ authorized: true });
    });

    it('rejects when wallet network is null', () => {
        const result = assertNetworkMatch(null, 'TESTNET');
        expect(result.authorized).toBe(false);
        expect(result.error).toMatch(/No network/i);
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
        const now = Date.now();
        expect(isConnectionTokenFresh(now - 1000, now)).toBe(true);
    });

    it('rejects a timestamp older than the max age', () => {
        const now = Date.now();
        expect(isConnectionTokenFresh(now - CONNECTION_TOKEN_MAX_AGE_MS - 1, now)).toBe(false);
    });

    it('accepts a timestamp exactly at the boundary', () => {
        const now = Date.now();
        expect(isConnectionTokenFresh(now - CONNECTION_TOKEN_MAX_AGE_MS, now)).toBe(true);
    });

    it('rejects zero', () => {
        expect(isConnectionTokenFresh(0)).toBe(false);
    });

    it('rejects NaN', () => {
        expect(isConnectionTokenFresh(NaN)).toBe(false);
    });

    it('rejects Infinity', () => {
        expect(isConnectionTokenFresh(Infinity)).toBe(false);
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

    it('converts object to string', () => {
        expect(sanitizeWalletError({ msg: 'error' })).toBe('[object Object]');
    });

    it('preserves messages at exactly the max length', () => {
        const exact = 'x'.repeat(MAX_ERROR_LENGTH);
        expect(sanitizeWalletError(exact)).toBe(exact);
    });
});
