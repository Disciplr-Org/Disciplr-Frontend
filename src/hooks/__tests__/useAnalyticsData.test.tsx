import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isApiEnabled } from '../../services/api'
import { listAllActivity, listVaults } from '../../services/vaultService'
import type { Vault } from '../../types/vault'
import { analyticsPeriodData, vaultStatusData } from '../../pages/analyticsData'
import { useAnalyticsData } from '../useAnalyticsData'

vi.mock('../../services/api', () => ({
  isApiEnabled: vi.fn(),
}))

vi.mock('../../services/vaultService', () => ({
  listAllActivity: vi.fn(),
  listVaults: vi.fn(),
}))

vi.mock('../useOnRecovered', () => ({
  useOnRecovered: vi.fn(),
}))

const apiEnabled = vi.mocked(isApiEnabled)
const mockListVaults = vi.mocked(listVaults)
const mockListAllActivity = vi.mocked(listAllActivity)

const vault: Vault = {
  id: 'live-vault',
  name: 'Live vault',
  status: 'active',
  amount: 250,
  currency: 'USDC',
  createdAt: new Date().toISOString(),
  deadline: new Date().toISOString(),
  creatorAddress: 'creator',
  verifierAddress: 'verifier',
  successAddress: 'success',
  failureAddress: 'failure',
  contractAddress: 'contract',
  milestones: [],
  transactions: [],
}

describe('useAnalyticsData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiEnabled.mockReturnValue(true)
    mockListVaults.mockResolvedValue([vault])
    mockListAllActivity.mockResolvedValue([])
  })

  it('uses live vault data in API mode', async () => {
    const { result } = renderHook(() => useAnalyticsData('7d', { status: 'empty' }, false))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockListVaults).toHaveBeenCalledOnce()
    expect(mockListAllActivity).toHaveBeenCalledOnce()
    expect(result.current.chartData.reduce((sum, point) => sum + point.capital, 0)).toBe(250)
    expect(result.current.vaultStatusData).toEqual([
      { name: 'Completed', value: 0 },
      { name: 'Active', value: 1 },
      { name: 'Failed', value: 0 },
      { name: 'Cancelled', value: 0 },
    ])
  })

  it('keeps the existing period data as the offline/demo fallback', () => {
    apiEnabled.mockReturnValue(false)
    const { result } = renderHook(() => useAnalyticsData('7d', { status: 'empty' }, false))

    expect(result.current.chartData).toEqual(analyticsPeriodData['7d'])
    expect(result.current.vaultStatusData).toEqual(vaultStatusData)
    expect(result.current.isLoading).toBe(false)
    expect(mockListVaults).not.toHaveBeenCalled()
    expect(mockListAllActivity).not.toHaveBeenCalled()
  })

  it('uses the demo fallback when the API is configured but demo mode is active', () => {
    const { result } = renderHook(() => useAnalyticsData('7d', { status: 'empty' }, true))

    expect(result.current.chartData).toEqual(analyticsPeriodData['7d'])
    expect(result.current.vaultStatusData).toEqual(vaultStatusData)
    expect(mockListVaults).not.toHaveBeenCalled()
    expect(mockListAllActivity).not.toHaveBeenCalled()
  })

  it('surfaces live data load failures without falling back to demo values', async () => {
    mockListVaults.mockRejectedValue(new Error('request failed'))
    const { result } = renderHook(() => useAnalyticsData('7d', { status: 'empty' }, false))

    await waitFor(() => expect(result.current.error).toBe('Analytics data could not be loaded. Please retry.'))

    expect(result.current.chartData).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(mockListAllActivity).toHaveBeenCalledOnce()
  })

  it('retries both live service reads when requested', async () => {
    const { result } = renderHook(() => useAnalyticsData('7d', { status: 'empty' }, false))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.retry())

    await waitFor(() => expect(mockListVaults).toHaveBeenCalledTimes(2))
    expect(mockListAllActivity).toHaveBeenCalledTimes(2)
  })
})
