import { Link } from 'react-router-dom'
import { Text } from '../components/Text'

type VaultStatus = 'active' | 'completed' | 'failed' | 'cancelled' | 'pending_validation'

const MOCK_VAULTS = [
  { id: '1', name: 'Alpha Vault',   amount: 12500,  currency: 'USDC', status: 'active' as VaultStatus,    deadline: '2024-07-15T10:00:00Z' },
  { id: '2', name: 'Beta Reserve',  amount: 4200.5, currency: 'USDC', status: 'completed' as VaultStatus, deadline: '2024-01-01T09:00:00Z' },
  { id: '3', name: 'Gamma Fund',    amount: 8800,   currency: 'USDC', status: 'failed' as VaultStatus,    deadline: '2023-12-01T08:00:00Z' },
]

const STATUS_CONFIG: Record<VaultStatus, { label: string; color: string; bg: string }> = {
  active:             { label: 'Active',             color: 'var(--accent)',  bg: 'var(--accent-transparent)' },
  completed:          { label: 'Completed',          color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' },
  failed:             { label: 'Failed',             color: 'var(--danger)',  bg: 'rgba(239,68,68,0.1)' },
  cancelled:          { label: 'Cancelled',          color: 'var(--muted)',   bg: 'rgba(156,163,175,0.1)' },
  pending_validation: { label: 'Pending Validation', color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' },
}

export default function Vaults() {
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {MOCK_VAULTS.map((vault) => {
          const cfg = STATUS_CONFIG[vault.status]
          return (
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
                    border: `1px solid ${cfg.color}`,
                    borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600,
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
