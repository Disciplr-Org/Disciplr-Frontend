import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { USDC_ISSUERS } from '../utils/horizon';

export function TrustlineBanner() {
  const { address, network, balanceStatus } = useWallet();
  const [dismissed, setDismissed] = useState(false);

  if (!address || balanceStatus !== 'no_trustline' || dismissed) return null;

  const issuer = network ? USDC_ISSUERS[network] : '';

  return (
    <div
      role="alert"
      style={{
        background: 'var(--warning)',
        color: 'var(--surface)',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <span>
        Your wallet has no USDC trustline. To receive USDC, add a trustline to{' '}
        <strong>{issuer}</strong> using Stellar Laboratory or your wallet app.
      </span>
      <button
        type="button"
        aria-label="Dismiss trustline banner"
        onClick={() => setDismissed(true)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--surface)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '1rem',
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}
