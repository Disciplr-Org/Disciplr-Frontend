import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        Programmable capital discipline on Stellar
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Lock USDC against milestones. Funds release on success or redirect on failure.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link
          to="/vaults/create"
          style={{
            background: 'var(--accent)',
            color: 'var(--bg)',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
          }}
        >
          Create Vault
        </Link>
        <Link
          to="/vaults"
          style={{
            background: 'var(--surface)',
            color: 'var(--text)',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}
        >
          View Vaults
        </Link>
      </div>
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>How it works</h2>
        <ul style={{ color: 'var(--muted)', lineHeight: 1.8, paddingLeft: '1.25rem' }}>
          <li>Lock USDC in a time-locked vault with milestone criteria.</li>
          <li>Optional verifier validates completion before the deadline.</li>
          <li>Success → funds released to your success address.</li>
          <li>Failure / timeout → funds redirected to your failure address (e.g. charity).</li>
        </ul>
      </section>
    </div>
  )
}
