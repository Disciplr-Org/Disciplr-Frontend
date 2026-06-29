import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, MemoryRouter } from 'react-router-dom'
import { Text } from '../components/Text'
import { StatusChip } from '../components/StatusChip'
import type { VaultStatus, Vault } from '../types/vault'
import { listVaults } from '../services/vaultService'
import { filterVaults, sortVaults } from '../utils/vaultFilter'

const DEFAULT_FETCH = () => listVaults()

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
  
  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<VaultStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'deadline' | 'amount'>('deadline')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  
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

  // Apply filters and sorting
  const filteredVaults = filterVaults(vaults, { status: statusFilter, query: searchQuery })
  const sortedVaults = sortVaults(filteredVaults, { by: sortBy, dir: sortDir })
  
  const hasResults = sortedVaults.length > 0
  const hasFilters = statusFilter !== 'all' || searchQuery.trim() !== ''

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

      {/* Filter and Sort Toolbar */}
      {status === 'data' && (
        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius)', 
          padding: '1rem', 
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {/* Status Filter Chips */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '0.5rem',
            alignItems: 'center',
          }}>
            <Text role="caption" as="span" style={{ color: 'var(--muted)', marginRight: '0.5rem' }}>
              Status:
            </Text>
            {(['all', 'active', 'pending_validation', 'completed', 'failed'] as const).map((filterStatus) => (
              <button
                key={filterStatus}
                onClick={() => setStatusFilter(filterStatus)}
                aria-pressed={statusFilter === filterStatus}
                style={{
                  background: statusFilter === filterStatus 
                    ? 'var(--accent)' 
                    : 'var(--bg)',
                  color: statusFilter === filterStatus 
                    ? 'var(--bg)' 
                    : 'var(--muted)',
                  border: statusFilter === filterStatus
                    ? '1px solid var(--accent)'
                    : '1px solid var(--border)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.4rem 0.8rem',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {filterStatus === 'all' 
                  ? 'All' 
                  : filterStatus === 'pending_validation' 
                    ? 'Pending' 
                    : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
              </button>
            ))}
          </div>

          {/* Search and Sort */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '1rem', 
            alignItems: 'center',
          }}>
            <input
              type="text"
              placeholder="Search vaults by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="vault-search-input"
              style={{
                flex: 1,
                minWidth: '200px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '0.5rem 0.75rem',
                fontSize: '14px',
                color: 'inherit',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Text role="caption" as="span" style={{ color: 'var(--muted)' }}>
                Sort by:
              </Text>
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [by, dir] = e.target.value.split('-') as [typeof sortBy, typeof sortDir]
                  setSortBy(by)
                  setSortDir(dir)
                }}
                data-testid="vault-sort-select"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '14px',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <option value="deadline-asc">Deadline (nearest first)</option>
                <option value="deadline-desc">Deadline (farthest first)</option>
                <option value="amount-desc">Amount (highest first)</option>
                <option value="amount-asc">Amount (lowest first)</option>
              </select>
            </div>
          </div>
        </div>
      )}

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
          {hasResults ? (
            sortedVaults.map((vault) => (
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
            ))
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}>
              <Text role="body" as="p" style={{ color: 'var(--muted)', marginBottom: '0.5rem' }}>
                {hasFilters ? 'No vaults match your filters.' : 'No vaults found.'}
              </Text>
              {hasFilters && (
                <button
                  onClick={() => {
                    setStatusFilter('all')
                    setSearchQuery('')
                  }}
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--bg)',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    padding: '0.5rem 1rem',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
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
