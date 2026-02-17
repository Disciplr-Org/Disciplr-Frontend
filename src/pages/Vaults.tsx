export default function Vaults() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Your Vaults</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        View and manage your productivity vaults.
      </p>
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
        No vaults yet. Create your first vault to get started.
      </div>
    </div>
  )
}
