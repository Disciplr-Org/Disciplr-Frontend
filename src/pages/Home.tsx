import { Link } from 'react-router-dom'
import { Text } from '../components/Text'

export default function Home() {
  return (
    <div>
      <Text role="display" as="h1" style={{ marginBottom: '0.5rem' }}>
        Programmable capital discipline on Stellar
      </Text>
      <Text role="body" as="p" style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Lock USDC against milestones. Funds release on success or redirect on failure.
      </Text>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link
          to="/vaults/create"
          style={{
            background: 'var(--accent)',
            color: 'var(--bg)',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius)',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          <Text role="body" as="span">
            Create Vault
          </Text>
        </Link>
        <Link
          to="/vaults"
          style={{
            background: 'var(--surface)',
            color: 'var(--text)',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          <Text role="body" as="span">
            View Vaults
          </Text>
        </Link>
      </div>
      <section style={{ marginTop: '3rem' }}>
        <Text role="title" as="h2" style={{ marginBottom: '1rem' }}>
          How it works
        </Text>
        <ul style={{ color: 'var(--muted)', lineHeight: 1.8, paddingLeft: '1.25rem' }}>
          <li>
            <Text role="body" as="span">
              Lock USDC in a time-locked vault with milestone criteria.
            </Text>
          </li>
          <li>
            <Text role="body" as="span">
              Optional verifier validates completion before the deadline.
            </Text>
          </li>
          <li>
            <Text role="body" as="span">
              Success → funds released to your success address.
            </Text>
          </li>
          <li>
            <Text role="body" as="span">
              Failure / timeout → funds redirected to your failure address (e.g. charity).
            </Text>
          </li>
        </ul>
      </section>
    </div>
  )
}
