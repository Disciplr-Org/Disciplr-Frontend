import { Link, useLocation } from 'react-router-dom'
import { WalletConnectButton } from './Wallet/WalletConnectButton'
import ThemeToggle from './ThemeToggle'
import { Text } from './Text'
import { NotificationIcon } from './Notification/NotificationIcon'

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          padding: 'var(--spacing-4) var(--spacing-8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link
            to="/"
            style={{
              color: 'var(--text)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Text role="title" as="span">
              Disciplr
            </Text>
          </Link>
          <Link
          to="/transactions"
          style={{
           color: location.pathname === '/transactions' ? 'var(--accent)' : 'var(--muted)',
         textDecoration: 'none',
            }}
>
  Transactions
</Link>
        </div>

        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to="/"
              style={{
                color: location.pathname === '/' ? 'var(--accent)' : 'var(--muted)',
                textDecoration: 'none',
              }}
            >
              <Text role="caption" as="span">
                Home
              </Text>
            </Link>
            <Link
              to="/vaults/create"
              style={{
                color: 'var(--surface)',
                background: 'var(--accent)',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              <Text role="caption" as="span">
                Create Vault
              </Text>
            </Link>
            <ThemeToggle />
            <WalletConnectButton />
            <NotificationIcon />
          </div>
        </nav>
      </header>
      <main style={{ flex: 1, padding: 'var(--spacing-8)', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  );
}
