import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useVaults } from '../useVaults'
import type { Vault } from '../../data/vaults'

const MOCK: Vault[] = [
  { id: '1', name: 'Alpha', amount: 100, currency: 'USDC', status: 'active', progressPct: 50, deadline: '2024-07-15T10:00:00Z' },
]

vi.mock('../../data/vaults', () => ({
  getVaults: vi.fn(),
}))

import { getVaults } from '../../data/vaults'
const mockGetVaults = vi.mocked(getVaults)

beforeEach(() => vi.clearAllMocks())

describe('useVaults', () => {
  it('starts in loading state', () => {
    mockGetVaults.mockReturnValue(new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useVaults())
    expect(result.current.loading).toBe(true)
    expect(result.current.vaults).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('resolves with vault list', async () => {
    mockGetVaults.mockResolvedValue(MOCK)
    const { result } = renderHook(() => useVaults())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.vaults).toEqual(MOCK)
    expect(result.current.error).toBeNull()
  })

  it('sets error on rejection', async () => {
    mockGetVaults.mockRejectedValue(new Error('network error'))
    const { result } = renderHook(() => useVaults())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('network error')
    expect(result.current.vaults).toEqual([])
  })

  it('handles empty list', async () => {
    mockGetVaults.mockResolvedValue([])
    const { result } = renderHook(() => useVaults())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.vaults).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('cancels update on unmount', async () => {
    let resolve!: (v: Vault[]) => void
    mockGetVaults.mockReturnValue(new Promise(r => { resolve = r }))
    const { result, unmount } = renderHook(() => useVaults())
    unmount()
    resolve(MOCK)
    // state should remain as initial — no update after unmount
    expect(result.current.vaults).toEqual([])
    expect(result.current.loading).toBe(true)
  })
})
