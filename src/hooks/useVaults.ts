import { useState, useEffect } from 'react'
import { getVaults, type Vault } from '../data/vaults'

interface UseVaultsResult {
  vaults: Vault[]
  loading: boolean
  error: string | null
}

export function useVaults(): UseVaultsResult {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getVaults()
      .then(data => { if (!cancelled) { setVaults(data); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err?.message ?? 'Failed to load vaults'); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  return { vaults, loading, error }
}
