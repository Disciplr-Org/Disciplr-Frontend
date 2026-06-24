import { Link } from 'react-router-dom'
import { StatusChip } from '../components/StatusChip'
import { Text } from '../components/Text'

type VaultStatus = 'active' | 'completed' | 'failed' | 'cancelled' | 'pending_validation'

const MOCK_VAULTS = [
  { id: '1', name: 'Alpha Vault',   amount: 12500,  currency: 'USDC', status: 'active' as VaultStatus,    deadline: '2024-07-15T10:00:00Z' },
  { id: '2', name: 'Beta Reserve',  amount: 4200.5, currency: 'USDC', status: 'completed' as VaultStatus, deadline: '2024-01-01T09:00:00Z' },
  { id: '3', name: 'Gamma Fund',    amount: 8800,   currency: 'USDC', status: 'failed' as VaultStatus,    deadline: '2023-12-01T08:00:00Z' },
]

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
                  <StatusChip status={vault.status} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
