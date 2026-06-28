import { describe, it, expect } from 'vitest';
import { isValidStellarAddress } from '../stellarAddress';

describe('isValidStellarAddress', () => {
    it('returns true for a valid G key (account)', () => {
        expect(isValidStellarAddress('GA2C5RFPE6G6KXHEIRHZXSNBR3CJRBGUPTAOOVHRF4AFPS5YUMVSWH7B')).toBe(true);
    });

    it('returns true for a valid C key (contract)', () => {
        expect(isValidStellarAddress('CA2C5RFPE6G6KXHEIRHZXSNBR3CJRBGUPTAOOVHRF4AFPS5YUMVSWH7B')).toBe(true);
    });

    it('returns false for wrong prefix', () => {
        expect(isValidStellarAddress('XA2C5RFPE6G6KXHEIRHZXSNBR3CJRBGUPTAOOVHRF4AFPS5YUMVSWH7B')).toBe(false);
    });

    it('returns false for wrong length', () => {
        expect(isValidStellarAddress('GA2C5RFPE6G6KXHEIRHZXSNBR3CJRBGUPTAOOVHRF4AFPS5YUMVSWH7')).toBe(false);
        expect(isValidStellarAddress('GA2C5RFPE6G6KXHEIRHZXSNBR3CJRBGUPTAOOVHRF4AFPS5YUMVSWH7B2')).toBe(false);
    });

    it('returns false for invalid base32 chars', () => {
        expect(isValidStellarAddress('GA2C5RFPE6G6KXHEIRHZXSNBR3CJRBGUPTAOOVHRF4AFPS5YUMVSWH70')).toBe(false);
        expect(isValidStellarAddress('GA2C5RFPE6G6KXHEIRHZXSNBR3CJRBGUPTAOOVHRF4AFPS5YUMVSWH71')).toBe(false);
        expect(isValidStellarAddress('Ga2c5rfpe6g6kxheirhzxsnbr3cjrbguptaoovhrf4afps5yumvswh7b')).toBe(false);
    });

    it('returns false for empty string or non-strings', () => {
        expect(isValidStellarAddress('')).toBe(false);
        expect(isValidStellarAddress(null as unknown as string)).toBe(false);
        expect(isValidStellarAddress(undefined as unknown as string)).toBe(false);
    });
});
