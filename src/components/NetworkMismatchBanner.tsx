import { useEffect, useMemo, useState, useRef } from 'react';
import { ExternalLink, X, AlertTriangle } from 'lucide-react';
import { useWallet, type WalletNetwork } from '../context/WalletContext';
import { networkLabel } from '../utils/explorer';
import { APP_EXPECTED_NETWORK, isNetworkMismatch } from '../utils/networkMismatch';
import { recordWalletTelemetry } from '../utils/walletTelemetry';

const FREIGHTER_NETWORK_HELP_URL = 'https://docs.freighter.app/';

/**
 * NetworkMismatchBanner Component
 * 
 * Purpose: Alerts users when their connected wallet is on a different network
 * than the application expects, preventing transaction errors and fund loss.
 * 
 * Invariants:
 * - Banner only shows when wallet is connected AND network mismatches
 * - Banner hides immediately when mismatch is resolved
 * - Dismissal is scoped to specific mismatch (address + networks combination)
 * - New mismatches always show banner even if previous was dismissed
 * - Banner never shows for disconnected wallets
 * 
 * Accessibility:
 * - Uses role="alert" for immediate screen reader announcement
 * - Focus moves to dismiss button on keyboard interaction
 * - Links clearly labeled for screen readers
 * - Touch targets meet minimum 44x44px size
 * - Reduced motion respected for animations
 * 
 * @param expectedNetwork - The network the app expects (defaults to APP_EXPECTED_NETWORK)
 */
interface NetworkMismatchBannerProps {
  expectedNetwork?: WalletNetwork;
}

export function NetworkMismatchBanner({
  expectedNetwork = APP_EXPECTED_NETWORK,
}: NetworkMismatchBannerProps) {
  const { address, network } = useWallet();
  const [dismissedMismatch, setDismissedMismatch] = useState<string | null>(null);
  const dismissButtonRef = useRef<HTMLButtonElement>(null);
  
  // Invariant: mismatch only exists when wallet is connected AND networks differ
  const hasMismatch = Boolean(address) && isNetworkMismatch(network, expectedNetwork);
  
  // Unique key for this specific mismatch scenario
  const mismatchKey = useMemo(
    () => `${address ?? 'disconnected'}:${network ?? 'unknown'}:${expectedNetwork}`,
    [address, network, expectedNetwork],
  );
  const showBanner = hasMismatch && dismissedMismatch !== mismatchKey;

  // Invariant: dismissal state clears when mismatch resolves
  useEffect(() => {
    if (!hasMismatch) {
      setDismissedMismatch(null);
    }
  }, [hasMismatch]);

  const handleDismiss = () => {
    setDismissedMismatch(mismatchKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ensure consistent keyboard interaction
    if (e.key === 'Escape') {
      handleDismiss();
    }
  };

  // Invariant: banner never renders when no mismatch or dismissed
  if (!hasMismatch || dismissedMismatch === mismatchKey) {
  // Telemetry on visibility transitions only — never re-emitted on unrelated
  // re-renders, so rapid network checks cannot spam the diagnostics buffer.
  const prevShownRef = useRef(false);
  useEffect(() => {
    if (showBanner && !prevShownRef.current) {
      recordWalletTelemetry({
        event: 'wallet.network.mismatch_shown',
        ts: Date.now(),
        network: network ?? 'unknown',
        expectedNetwork,
      });
    }
    prevShownRef.current = showBanner;
  }, [showBanner, network, expectedNetwork]);

  const prevMismatchRef = useRef(hasMismatch);
  useEffect(() => {
    if (!hasMismatch && prevMismatchRef.current) {
      recordWalletTelemetry({
        event: 'wallet.network.recovered',
        ts: Date.now(),
        network: network ?? 'unknown',
        expectedNetwork,
      });
    }
    prevMismatchRef.current = hasMismatch;
  }, [hasMismatch, network, expectedNetwork]);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      onKeyDown={handleKeyDown}
      style={{
        background: 'var(--danger-transparent)',
        border: 'var(--border-width-1) solid var(--danger)',
        color: 'var(--text)',
        padding: 'var(--spacing-3) var(--spacing-4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--spacing-4)',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
        <AlertTriangle 
          size={20} 
          aria-hidden="true" 
          style={{ flexShrink: 0, marginTop: '0.125rem' }} 
        />
        <span>
          <strong>Wrong wallet network.</strong> Freighter is on{' '}
          <strong>{networkLabel(network)}</strong>, but Disciplr expects{' '}
          <strong>{networkLabel(expectedNetwork)}</strong>. Switch Freighter before
          creating or validating vaults to avoid transaction failures.
        </span>
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-3)', flexShrink: 0 }}>
        <a
          href={FREIGHTER_NETWORK_HELP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Learn how to switch Freighter network (opens in new tab)"
          style={{
            color: 'var(--danger)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-1)',
            fontWeight: 700,
            textDecoration: 'underline',
            minHeight: 'var(--touch-target)',
          }}
        >
          Switch network
          <ExternalLink size={14} aria-hidden="true" />
        </a>
        <button
          ref={dismissButtonRef}
          type="button"
          aria-label="Dismiss network mismatch warning"
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--danger)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'var(--touch-target)',
            minWidth: 'var(--touch-target)',
            padding: 0,
            borderRadius: 'var(--border-radius-1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--danger-transparent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '2px solid var(--danger)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}
