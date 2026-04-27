import { Text } from '../components/Text'

export default function Vaults() {
  return (
    <div>
      <Text role="display" as="h1" style={{ marginBottom: '0.5rem' }}>
        Your Vaults
      </Text>
      <Text role="body" as="p" style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        View and manage your productivity vaults.
      </Text>
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--muted)',
        }}
      >
        <Text role="body" as="div">
          No vaults yet. Create your first vault to get started.
        </Text>
      </div>
    </div>
  )
}
