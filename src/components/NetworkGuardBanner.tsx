import { useEffect, useMemo, useState } from 'react';
import { useWallet, type WalletNetwork } from '../context/WalletContext';
import { getExpectedNetwork, isNetworkMismatch } from '../utils/network';

interface NetworkGuardBannerProps {
  expectedNetwork?: WalletNetwork;
}

export function NetworkGuardBanner({
  expectedNetwork = getExpectedNetwork(),
}: NetworkGuardBannerProps) {
  const { address, network } = useWallet();
  const [dismissedMismatch, setDismissedMismatch] = useState<string | null>(null);
  const hasConnectedWallet = Boolean(address);
  const hasMismatch = hasConnectedWallet && isNetworkMismatch(network, expectedNetwork);
  const mismatchKey = useMemo(
    () => `${address ?? 'no-wallet'}:${network ?? 'unknown'}:${expectedNetwork}`,
    [address, network, expectedNetwork],
  );

  useEffect(() => {
    if (!hasMismatch) {
      setDismissedMismatch(null);
    }
  }, [hasMismatch]);

  if (!hasMismatch || dismissedMismatch === mismatchKey) {
    return null;
  }

  return (
    <div
      role="alert"
      style={{
        background: 'var(--warning-transparent)',
        border: '1px solid var(--warning)',
        borderRadius: 'var(--radius)',
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        margin: '0 auto',
        maxWidth: 'var(--container-standard)',
        padding: '0.75rem 1rem',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div>
        <strong style={{ color: 'var(--warning)' }}>Wrong wallet network</strong>
        <span style={{ marginLeft: 8 }}>
          Connected to {network}; switch Freighter to {expectedNetwork} before creating or
          validating vaults.
        </span>
      </div>
      <button
        type="button"
        aria-label="Dismiss network warning"
        onClick={() => setDismissedMismatch(mismatchKey)}
        style={{
          background: 'transparent',
          border: '1px solid var(--warning)',
          borderRadius: 'var(--radius-full)',
          color: 'var(--warning)',
          cursor: 'pointer',
          fontWeight: 700,
          minHeight: 32,
          padding: '0.25rem 0.75rem',
          whiteSpace: 'nowrap',
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
