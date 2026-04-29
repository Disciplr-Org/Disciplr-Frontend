import { Link, useLocation } from 'react-router-dom'
import { WalletConnectButton } from './Wallet/WalletConnectButton'
import ThemeToggle from './ThemeToggle'
import { Text } from './Text'
import NotificationIcon from './Notification/NotificationIcon'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, Home, Vault, Plus, Wallet } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: 'var(--spacing-4) var(--spacing-8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface)',
        position: 'relative',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link
            to="/"
            style={{ color: 'var(--text)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
            aria-label="Disciplr Home"
          >
            <Text role="title" as="span">Disciplr</Text>
          </Link>
          <div className="desktop-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Link to="/" style={navLinkStyle('/')}>Home</Link>
            <Link to="/vaults" style={navLinkStyle('/vaults')}>Vaults</Link>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              to="/vaults/create"
              style={{
                color: 'var(--surface)',
                background: 'var(--accent)',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                textDecoration: 'none',
                display: 'inline-block',
                whiteSpace: 'nowrap',
                minHeight: '44px',
                lineHeight: '44px',
                paddingTop: 0,
                paddingBottom: 0,
              }}
            >
              <Text role="caption" as="span">Create Vault</Text>
            </Link>
            <ThemeToggle />
            <WalletConnectButton />
            <NotificationIcon />
          </div>

          <button
            ref={menuButtonRef}
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              width: '2.75rem',
              height: '2.75rem',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text)',
            }}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="mobile-drawer-overlay"
              variants={OVERLAY_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 100,
              }}
              aria-hidden="true"
            />
            <motion.div
              ref={drawerRef}
              className="mobile-drawer"
              variants={DRAWER_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 'min(320px, 80vw)',
                background: 'var(--surface)',
                zIndex: 110,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border)',
              }}>
                <Text role="title" as="span">Menu</Text>
                <button
                  ref={closeButtonRef}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text)',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '44px',
                    minWidth: '44px',
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              <nav style={{ flex: 1, padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <MobileNavItem
                    to="/"
                    label="Home"
                    icon={<Home size={20} />}
                    isActive={isActive('/')}
                    isPrimary={false}
                  />
                  <MobileNavItem
                    to="/vaults"
                    label="Vaults"
                    icon={<Vault size={20} />}
                    isActive={isActive('/vaults')}
                    isPrimary={false}
                  />
                  <MobileNavItem
                    to="/vaults/create"
                    label="Create Vault"
                    icon={<Plus size={20} />}
                    isActive={isActive('/vaults/create')}
                    isPrimary
                  />
                </div>
              </nav>

              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minHeight: '44px' }}>
                  <Wallet size={20} />
                  <WalletConnectButton />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minHeight: '44px' }}>
                  <ThemeToggle />
                  <Text role="body" as="span" style={{ color: 'var(--muted)' }}>Theme</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minHeight: '44px' }}>
                  <NotificationIcon />
                  <Text role="body" as="span" style={{ color: 'var(--muted)' }}>Notifications</Text>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main style={{ flex: 1, padding: 'var(--spacing-8)', maxWidth: 960, margin: '0 auto', width: '100%' }}>
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
