import { Link, useLocation } from 'react-router-dom'
import { WalletConnectButton } from './Wallet/WalletConnectButton'
import ThemeToggle from './ThemeToggle'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>
            Disciplr
          </Link>
        </div>

        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>    <Link
            to="/"
            style={{
              color: location.pathname === '/' ? 'var(--accent)' : 'var(--muted)',
              textDecoration: 'none',
            }}
          >
            Home
          </Link>

            <Link
              to="/vaults/create"
              style={{
                color: 'var(--surface)',
                background: 'var(--accent)',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.875rem'
              }}
            >
              Create Vault
            </Link>
            <ThemeToggle />
            <WalletConnectButton />
          </div>
        </nav>
      </header>
      <main style={{ flex: 1, padding: '2rem', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  )
}
