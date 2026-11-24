import { describe, expect, it } from 'vitest'
import type { Vault, VaultStatus } from '../../types/vault'
import type { VaultActivityRecord } from '../../services/vaultService'
import {
  buildAnalyticsSeries,
  buildAnalyticsSeriesForRange,
  buildPreviousAnalyticsSeries,
} from '../analyticsSeries'

const now = new Date(2025, 5, 18, 12)

function makeVault(
  id: string,
  status: VaultStatus,
  createdAt = now.toISOString(),
): Vault {
  return {
    id,
    name: `Vault ${id}`,
    status,
    amount: 100,
    currency: 'USDC',
    createdAt,
    deadline: createdAt,
    creatorAddress: 'creator',
    verifierAddress: 'verifier',
    successAddress: 'success',
    failureAddress: 'failure',
    contractAddress: `contract-${id}`,
    milestones: [],
    transactions: [],
  }
}

function makeActivity(
  id: string,
  vaultId: string,
  type: VaultActivityRecord['type'],
  timestamp = now,
): VaultActivityRecord {
  return {
    id,
    vaultId,
    type,
    vault: `Vault ${vaultId}`,
    amount: 100,
    fee: 0,
    block: 1,
    hash: id,
    status: 'confirmed',
    from: 'from',
    to: 'to',
    timestamp,
    memo: '',
  }
}

describe('buildAnalyticsSeries', () => {
  it('buckets completed and failed vaults, capital, and milestones from real records', () => {
    const vaults = [
      makeVault('1', 'completed'),
      makeVault('2', 'completed'),
      makeVault('3', 'completed'),
      makeVault('4', 'failed'),
    ]
    const activity = [
      makeActivity('release-1', '1', 'release'),
      makeActivity('release-2', '2', 'release'),
      makeActivity('release-3', '3', 'release'),
      makeActivity('redirect-4', '4', 'redirect'),
      makeActivity('validate-1', '1', 'validate'),
    ]

    const series = buildAnalyticsSeries(vaults, activity, '7d', now)
    const currentDay = series.find((point) => point.name === now.toLocaleDateString('en-US', { weekday: 'short' }))

    expect(series).toHaveLength(7)
    expect(currentDay).toMatchObject({ success: 75, failed: 25, capital: 400, milestones: 1 })
    expect(series.filter((point) => point !== currentDay).every((point) =>
      point.success === 0 && point.failed === 0 && point.capital === 0 && point.milestones === 0,
    )).toBe(true)
  })

  it('returns four weekly buckets and zero percentages for buckets with no outcomes', () => {
    const series = buildAnalyticsSeries([], [], '30d', now)

    expect(series.map((point) => point.name)).toEqual(['Wk1', 'Wk2', 'Wk3', 'Wk4'])
    expect(series).toEqual([
      { name: 'Wk1', success: 0, failed: 0, capital: 0, milestones: 0 },
      { name: 'Wk2', success: 0, failed: 0, capital: 0, milestones: 0 },
      { name: 'Wk3', success: 0, failed: 0, capital: 0, milestones: 0 },
      { name: 'Wk4', success: 0, failed: 0, capital: 0, milestones: 0 },
    ])
  })

  it('creates three monthly buckets for 90d', () => {
    expect(buildAnalyticsSeries([], [], '90d', now).map((point) => point.name))
      .toEqual(['Apr', 'May', 'Jun'])
  })

  it('derives the previous 7-day window from the same vault records', () => {
    const previousDay = new Date(now)
    previousDay.setDate(previousDay.getDate() - 7)
    const vaults = [
      makeVault('current', 'completed'),
      makeVault('previous', 'completed', previousDay.toISOString()),
    ]

    const current = buildAnalyticsSeries(vaults, [], '7d', now)
    const previous = buildPreviousAnalyticsSeries(vaults, [], '7d', now)

    expect(current.reduce((sum, point) => sum + point.capital, 0)).toBe(100)
    expect(previous.reduce((sum, point) => sum + point.capital, 0)).toBe(100)
  })

  it('honors an inclusive custom date range', () => {
    const outsideRange = new Date(2025, 4, 31, 12).toISOString()
    const inRange = new Date(2025, 5, 1, 12).toISOString()
    const series = buildAnalyticsSeriesForRange(
      [makeVault('outside', 'active', outsideRange), makeVault('inside', 'active', inRange)],
      [],
      new Date(2025, 5, 1),
      new Date(2025, 5, 15),
    )

    expect(series).toEqual([
      { name: 'Jun', success: 0, failed: 0, capital: 100, milestones: 0 },
    ])
  })
})
