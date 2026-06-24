import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Text } from '../components/Text'
import { filterVaults, sortVaults } from '../utils/vaultFilter'
import type { VaultListItem, VaultSortOptions, VaultStatusFilter } from '../utils/vaultFilter'

const MOCK_VAULTS: VaultListItem[] = [
  { id: '1', name: 'Alpha Vault',   amount: 12500,  currency: 'USDC', status: 'active',    deadline: '2024-07-15T10:00:00Z' },
  { id: '2', name: 'Beta Reserve',  amount: 4200.5, currency: 'USDC', status: 'completed', deadline: '2024-01-01T09:00:00Z' },
  { id: '3', name: 'Gamma Fund',    amount: 8800,   currency: 'USDC', status: 'failed',    deadline: '2023-12-01T08:00:00Z' },
]

type VaultStatus = VaultListItem['status']
type VaultSortValue = 'deadline-asc' | 'amount-desc'

const STATUS_CONFIG: Record<VaultStatus, { label: string; color: string; bg: string }> = {
  active:             { label: 'Active',             color: 'var(--accent)',  bg: 'color-mix(in srgb, var(--accent) 14%, transparent)' },
  completed:          { label: 'Completed',          color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 14%, transparent)' },
  failed:             { label: 'Failed',             color: 'var(--danger)',  bg: 'color-mix(in srgb, var(--danger) 14%, transparent)' },
  cancelled:          { label: 'Cancelled',          color: 'var(--muted)',   bg: 'color-mix(in srgb, var(--muted) 14%, transparent)' },
  pending_validation: { label: 'Pending Validation', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 16%, transparent)' },
}

const STATUS_FILTERS: Array<{ value: VaultStatusFilter; label: string; color: string; bg: string }> = [
  { value: 'all', label: 'All', color: 'var(--accent)', bg: 'color-mix(in srgb, var(--accent) 14%, transparent)' },
  { value: 'active', ...STATUS_CONFIG.active },
  { value: 'pending_validation', ...STATUS_CONFIG.pending_validation },
  { value: 'completed', ...STATUS_CONFIG.completed },
  { value: 'failed', ...STATUS_CONFIG.failed },
]

const SORT_OPTIONS: Record<VaultSortValue, VaultSortOptions> = {
  'deadline-asc': { by: 'deadline', dir: 'asc' },
  'amount-desc': { by: 'amount', dir: 'desc' },
}

export default function Vaults() {
  const [statusFilter, setStatusFilter] = useState<VaultStatusFilter>('all')
  const [query, setQuery] = useState('')
  const [sortValue, setSortValue] = useState<VaultSortValue>('deadline-asc')
  const visibleVaults = useMemo(() => {
    const filtered = filterVaults(MOCK_VAULTS, { status: statusFilter, query })
    return sortVaults(filtered, SORT_OPTIONS[sortValue])
  }, [query, sortValue, statusFilter])

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

      <section
        aria-label="Vault filters"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'end',
        }}
      >
        <div role="group" aria-label="Filter vaults by status" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((filter) => {
            const selected = statusFilter === filter.value
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setStatusFilter(filter.value)}
                style={{
                  background: selected ? filter.bg : 'var(--surface)',
                  color: selected ? filter.color : 'var(--text)',
                  border: `1px solid ${selected ? filter.color : 'var(--border)'}`,
                  borderRadius: 'var(--radius-full)',
                  padding: '0.35rem 0.75rem',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 220, flex: '1 1 220px' }}>
          <Text role="caption" as="span" style={{ color: 'var(--muted)' }}>Search by name</Text>
          <input
            aria-label="Search vaults by name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search vaults"
            style={{
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '0.55rem 0.75rem',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <Text role="caption" as="span" style={{ color: 'var(--muted)' }}>Sort</Text>
          <select
            aria-label="Sort vaults"
            value={sortValue}
            onChange={(event) => setSortValue(event.target.value as VaultSortValue)}
            style={{
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '0.55rem 0.75rem',
            }}
          >
            <option value="deadline-asc">Deadline soonest</option>
            <option value="amount-desc">Amount highest</option>
          </select>
        </label>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {visibleVaults.length === 0 ? (
          <div
            role="status"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--muted)',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            No vaults match your filters.
          </div>
        ) : visibleVaults.map((vault) => {
          const cfg = STATUS_CONFIG[vault.status]
          return (
            <Link
              key={vault.id}
              to={`/vaults/${vault.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
              data-testid="vault-row"
            >
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '0.75rem',
                transition: 'border-color 0.15s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
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
                  <span style={{
                    background: cfg.bg, color: cfg.color,
                    border: `var(--border-width-1) solid ${cfg.color}`,
                    borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: 12, fontWeight: 600,
                  }}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
