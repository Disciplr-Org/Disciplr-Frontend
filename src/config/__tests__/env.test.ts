import { describe, expect, it } from 'vitest'
import { buildEnvReport, type EnvWarning } from '../env'

describe('env config warnings', () => {
  it('returns a warning with field when insecure default secret is present', () => {
    const report = buildEnvReport({ SECRET_KEY: 'default' })

    expect(report.warnings).toHaveLength(1)
    expect(report.warnings[0]).toEqual({
      field: 'SECRET_KEY',
      message: 'Insecure default secret set for SECRET_KEY',
    })
  })

  it('returns warnings with field for missing Soroban configuration', () => {
    const report = buildEnvReport({ SOROBAN_RPC_URL: 'https://rpc.testnet' })

    expect(report.warnings).toContainEqual({
      field: 'SOROBAN_NETWORK',
      message: 'Partial Soroban configuration detected: SOROBAN_NETWORK is missing',
    })
  })
})
