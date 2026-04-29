import { Link, useLocation } from 'react-router-dom'
import { WalletConnectButton } from './Wallet/WalletConnectButton'
import ThemeToggle from './ThemeToggle'
import { Text } from './Text'
import NotificationIcon from './Notification/NotificationIcon'

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="site-header">
        <div className="header-brand">
          <Link to="/" className="header-link" aria-label="Disciplr home">
            <Text role="title" as="span">Disciplr</Text>
          </Link>
          <Link
            to="/transactions"
            className="header-link"
            style={{ color: location.pathname === '/transactions' ? 'var(--accent)' : 'var(--muted)' }}
            aria-label="Transactions"
          >
            <span className="header-transactions-label">Transactions</span>
            {/* Icon fallback on very small screens */}
            <span aria-hidden="true" className="header-transactions-icon" style={{ display: 'none' }}>↗</span>
          </Link>
        </div>

        <nav className="header-nav" aria-label="Main navigation">
          <Link
            to="/"
            className="header-link"
            style={{ color: location.pathname === '/' ? 'var(--accent)' : 'var(--muted)' }}
          >
            <Text role="caption" as="span">Home</Text>
          </Link>
          <Link
            to="/vaults/create"
            className="header-link header-cta"
          >
            <Text role="caption" as="span">Create Vault</Text>
          </Link>
          <ThemeToggle />
          <WalletConnectButton />
          <NotificationIcon />
        </nav>
      </header>

      <main style={{
        flex: 1,
        padding: 'var(--spacing-8)',
        maxWidth: 960,
        margin: '0 auto',
        width: '100%',
      }}>
        {children}
      </main>
    </div>
  );
}
