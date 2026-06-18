import { RefObject, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import FocusTrap from 'focus-trap-react';
import { WalletConnectButton } from './Wallet/WalletConnectButton';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement>;
}

export default function MobileDrawer({ isOpen, onClose, returnFocusRef }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const returnFocusElement = returnFocusRef?.current;

    return () => {
      returnFocusElement?.focus();
    };
  }, [isOpen, returnFocusRef]);

  if (!isOpen) return null;

  return (
    <div className="mobile-drawer-backdrop" onClick={onClose}>
      <FocusTrap
        focusTrapOptions={{
          initialFocus: () => closeButtonRef.current ?? drawerRef.current,
          fallbackFocus: () => drawerRef.current ?? document.body,
          escapeDeactivates: false,
          returnFocusOnDeactivate: false,
        }}
      >
        <nav
          className="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-drawer-title"
          id="mobile-drawer"
          tabIndex={-1}
          ref={drawerRef}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mobile-drawer-header">
            <h2 id="mobile-drawer-title" className="mobile-drawer-title">
              Navigation
            </h2>
            <button
              ref={closeButtonRef}
              className="mobile-drawer-close"
              onClick={onClose}
              aria-label="Close navigation drawer"
            >
              <X size={24} />
            </button>
          </div>
          <Link to="/" className="mobile-drawer-link" onClick={onClose}>
            Home
          </Link>
          <Link to="/transactions" className="mobile-drawer-link" onClick={onClose}>
            Transactions
          </Link>
          <Link to="/analytics" className="mobile-drawer-link" onClick={onClose}>
            Analytics
          </Link>
          <Link to="/vaults/create" className="mobile-drawer-link" onClick={onClose}>
            Create Vault
          </Link>
          <WalletConnectButton />
        </nav>
      </FocusTrap>
    </div>
  );
}
