import { describe, expect, test } from 'vitest'
import {
  hasCreateVaultErrors,
  isFutureDeadline,
  isValidStellarAddress,
  isValidUsdcAmount,
  validateCreateVault,
} from '../vaultValidation'

const VALID_ADDRESS = `G${'A'.repeat(55)}`
const OTHER_VALID_ADDRESS = `G${'B'.repeat(55)}`
const NOW = new Date('2026-01-01T00:00:00Z')

describe('vault validation helpers', () => {
  test('validates Stellar public key format', () => {
    expect(isValidStellarAddress(VALID_ADDRESS)).toBe(true)
    expect(isValidStellarAddress(`g${'A'.repeat(55)}`)).toBe(false)
    expect(isValidStellarAddress(`G${'A'.repeat(54)}`)).toBe(false)
    expect(isValidStellarAddress(`G${'0'.repeat(55)}`)).toBe(false)
  })

  test('validates positive USDC amounts with seven decimal places', () => {
    expect(isValidUsdcAmount('1')).toBe(true)
    expect(isValidUsdcAmount('0.0000001')).toBe(true)
    expect(isValidUsdcAmount('1000.1234567')).toBe(true)
    expect(isValidUsdcAmount('0')).toBe(false)
    expect(isValidUsdcAmount('-1')).toBe(false)
    expect(isValidUsdcAmount('1.12345678')).toBe(false)
    expect(isValidUsdcAmount('1e3')).toBe(false)
  })

  test('requires a future deadline', () => {
    expect(isFutureDeadline('2026-01-02T00:00', NOW)).toBe(true)
    expect(isFutureDeadline('2025-12-31T23:59', NOW)).toBe(false)
    expect(isFutureDeadline('not-a-date', NOW)).toBe(false)
  })

  test('returns no errors for a valid create-vault form', () => {
    const errors = validateCreateVault(
      {
        amount: '25.5',
        deadline: '2026-01-02T00:00',
        successAddress: VALID_ADDRESS,
        failureAddress: OTHER_VALID_ADDRESS,
      },
      NOW,
    )

    expect(errors).toEqual({})
    expect(hasCreateVaultErrors(errors)).toBe(false)
  })

  test('rejects invalid form values and identical destinations', () => {
    const errors = validateCreateVault(
      {
        amount: '0',
        deadline: '2025-12-31T23:59',
        successAddress: VALID_ADDRESS,
        failureAddress: VALID_ADDRESS,
      },
      NOW,
    )

    expect(errors.amount).toMatch(/positive USDC amount/i)
    expect(errors.deadline).toMatch(/future deadline/i)
    expect(errors.failureAddress).toMatch(/different failure destination/i)
    expect(hasCreateVaultErrors(errors)).toBe(true)
  })
})
