import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import FocusTrap from 'focus-trap-react';
import { WalletConnectButton } from './Wallet/WalletConnectButton';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
      triggerRef.current?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <FocusTrap
      focusTrapOptions={{
        allowOutsideClick: true,
        clickOutsideDeactivates: false,
        escapeDeactivates: false,
        fallbackFocus: () => drawerRef.current ?? document.body,
        initialFocus: () =>
          drawerRef.current?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ) ?? drawerRef.current ?? document.body,
        returnFocusOnDeactivate: false,
      }}
    >
      <div className="mobile-drawer-backdrop" onClick={onClose}>
        <div
          className="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-drawer-title"
          id="mobile-drawer"
          ref={drawerRef}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="mobile-drawer-title" className="mobile-drawer-title">
            Navigation
          </h2>
          <button className="mobile-drawer-close" onClick={onClose} aria-label="Close navigation drawer">
            <X size={24} />
          </button>
          <nav className="mobile-drawer-nav" aria-label="Mobile navigation">
            <Link
              to="/"
              className="mobile-drawer-link"
              aria-current={isActive('/') ? 'page' : undefined}
              onClick={onClose}
            >
              Home
            </Link>
            <Link
              to="/transactions"
              className="mobile-drawer-link"
              aria-current={isActive('/transactions') ? 'page' : undefined}
              onClick={onClose}
            >
              Transactions
            </Link>
            <Link
              to="/analytics"
              className="mobile-drawer-link"
              aria-current={isActive('/analytics') ? 'page' : undefined}
              onClick={onClose}
            >
              Analytics
            </Link>
            <Link
              to="/vaults/create"
              className="mobile-drawer-link"
              aria-current={isActive('/vaults/create') ? 'page' : undefined}
              onClick={onClose}
            >
              Create Vault
            </Link>
          </nav>
          <WalletConnectButton />
        </div>
      </div>
    </FocusTrap>
  );
}
