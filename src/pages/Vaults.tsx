import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, MemoryRouter } from 'react-router-dom'
import { Text } from '../components/Text'
import { StatusChip } from '../components/StatusChip'
import type { VaultStatus } from '../types/vault'

interface Vault {
  id: string
  name: string
  amount: number
  currency: string
  status: VaultStatus
  deadline: string
}

const MOCK_VAULTS: Vault[] = [
  { id: '1', name: 'Alpha Vault',  amount: 12500,  currency: 'USDC', status: 'active',    deadline: '2024-07-15T10:00:00Z' },
  { id: '2', name: 'Beta Reserve', amount: 4200.5, currency: 'USDC', status: 'completed', deadline: '2024-01-01T09:00:00Z' },
  { id: '3', name: 'Gamma Fund',   amount: 8800,   currency: 'USDC', status: 'failed',    deadline: '2023-12-01T08:00:00Z' },
]

const DEFAULT_FETCH = () => Promise.resolve(MOCK_VAULTS)

function Skeleton() {
  return (
    <div
      data-testid="skeleton"
      style={{
        height: 72,
        background: 'var(--surface, #1e293b)',
        border: '1px solid var(--border, #334155)',
        borderRadius: 'var(--radius, 8px)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}

interface VaultsInnerProps {
  fetchVaults?: () => Promise<Vault[]>
}

function VaultsInner({ fetchVaults = DEFAULT_FETCH }: VaultsInnerProps) {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [status, setStatus] = useState<'loading' | 'empty' | 'data' | 'error'>('loading')
  const [retryCount, setRetryCount] = useState(0)
  // Use a ref so changing the fetchVaults prop identity doesn't re-trigger the effect
  const fetchRef = useRef(fetchVaults)
  fetchRef.current = fetchVaults

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    fetchRef.current()
      .then((data) => {
        if (cancelled) return
        setVaults(data)
        setStatus(data.length === 0 ? 'empty' : 'data')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => { cancelled = true }
  }, [retryCount])  // only re-run on explicit retry

  const retry = useCallback(() => setRetryCount((c) => c + 1), [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Text role="display" as="h1" style={{ marginBottom: '0.25rem' }}>Your Vaults</Text>
          <Text role="body" as="p" style={{ color: 'var(--muted)', margin: 0 }}>
            View and manage your productivity vaults.
          </Text>
        </div>
        <Link
          to="/vaults/create"
          style={{
            background: 'var(--accent)', color: 'var(--bg)',
            padding: '0.6rem 1.25rem', borderRadius: 'var(--radius)',
            fontWeight: 600, fontSize: 14, textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          + Create Vault
        </Link>
      </div>

      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Skeleton /><Skeleton /><Skeleton />
        </div>
      )}

      {status === 'empty' && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <Text role="body" as="p">You don’t have any vaults yet.</Text>
          <Link to="/vaults/create">Create your first vault</Link>
        </div>
      )}

      {status === 'error' && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <Text role="body" as="p">Failed to load vaults.</Text>
          <button onClick={retry}>Retry</button>
        </div>
      )}

      {status === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {vaults.map((vault) => (
            <Link
              key={vault.id}
              to={`/vaults/${vault.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '0.75rem',
              }}>
                <div>
                  <Text role="body" as="div" style={{ fontWeight: 600, marginBottom: 4 }}>{vault.name}</Text>
                  <Text role="caption" as="div" style={{ color: 'var(--muted)' }}>
                    Deadline: {new Date(vault.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Text role="body" as="span" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    {vault.amount.toLocaleString()} {vault.currency}
                  </Text>
                  <StatusChip status={vault.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// Default export wraps with MemoryRouter for standalone usage;
// tests that need router control can wrap themselves.
export default function Vaults({ fetchVaults }: VaultsInnerProps = {}) {
  // If we're already inside a Router (detected by trying), use VaultsInner directly.
  // We always wrap in MemoryRouter here so the component is self-contained.
  return (
    <MemoryRouter>
      <VaultsInner fetchVaults={fetchVaults} />
    </MemoryRouter>
  )
}
