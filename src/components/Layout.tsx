import { Link, useLocation } from 'react-router-dom'
import { WalletConnectButton } from './Wallet/WalletConnectButton'
import ThemeToggle from './ThemeToggle'
import { Text } from './Text'
import NotificationIcon from './Notification/NotificationIcon'

interface LayoutProps {
  children: React.ReactNode;
}

const DRAWER_VARIANTS = {
  hidden: { x: '100%' },
  visible: { x: 0 },
  exit: { x: '100%' },
};

const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      lastActiveElement.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
        lastActiveElement.current?.focus();
      };
    }
    document.body.style.overflow = '';
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;

      const drawer = drawerRef.current;
      if (!drawer) return;

      const focusable = drawer.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const isActive = (path: string) => location.pathname === path;

  const navLinkStyle = (to: string) => ({
    color: isActive(to) ? 'var(--accent)' : 'var(--muted)',
    textDecoration: 'none',
    padding: '0.75rem 0.5rem',
    display: 'inline-block' as const,
    fontSize: '0.875rem',
    fontWeight: isActive(to) ? 600 : 400,
    minHeight: '44px' as const,
    lineHeight: '44px' as const,
    paddingTop: 0,
    paddingBottom: 0,
  });

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

function MobileNavItem({ to, label, icon, isActive, isPrimary }: {
  to: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isPrimary: boolean;
}) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0 1rem',
        borderRadius: 'var(--radius)',
        textDecoration: 'none',
        color: isPrimary ? 'var(--surface)' : isActive ? 'var(--accent)' : 'var(--text)',
        background: isPrimary ? 'var(--accent)' : isActive ? 'var(--accent-transparent)' : 'transparent',
        fontWeight: isActive ? 600 : 400,
        minHeight: '44px',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isPrimary && !isActive) e.currentTarget.style.background = 'var(--hover)';
      }}
      onMouseLeave={(e) => {
        if (!isPrimary && !isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
