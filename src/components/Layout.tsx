import { Link, useLocation } from 'react-router-dom'

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
        <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
          Disciplr
        </Link>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <Link
            to="/"
            style={{
              color: location.pathname === '/' ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            Home
          </Link>
          <Link
            to="/vaults"
            style={{
              color: location.pathname.startsWith('/vaults') ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            Vaults
          </Link>
          <Link
            to="/vaults/create"
            style={{
              color: location.pathname === '/vaults/create' ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            Create Vault
          </Link>
        </nav>
      </header>
      <main style={{ flex: 1, padding: '2rem', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  )
}
