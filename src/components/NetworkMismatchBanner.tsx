import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { useWallet, type WalletNetwork } from '../context/WalletContext';
import { networkLabel } from '../utils/explorer';
import { APP_EXPECTED_NETWORK, isNetworkMismatch } from '../utils/networkMismatch';
import { recordWalletTelemetry } from '../utils/walletTelemetry';
import {
    validateWalletAddress,
    validateNetwork,
    buildMismatchKey,
} from '../utils/walletValidation';

const FREIGHTER_NETWORK_HELP_URL = 'https://docs.freighter.app/';

interface NetworkMismatchBannerProps {
  expectedNetwork?: WalletNetwork;
}

export function NetworkMismatchBanner({
  expectedNetwork = APP_EXPECTED_NETWORK,
}: NetworkMismatchBannerProps) {
  const { address, network } = useWallet();
  const [dismissedMismatch, setDismissedMismatch] = useState<string | null>(null);

  // Validate address and network at the boundary
  const addressValid = address != null ? validateWalletAddress(address) : { valid: false } as const;
  const networkValid = network != null ? validateNetwork(network) : { valid: false } as const;
  const expectedNetworkValid = validateNetwork(expectedNetwork);

  // Use validated values — reject invalid wallet state
  const safeAddress = addressValid.valid && address ? address : null;
  const safeNetwork = networkValid.valid && networkValid.value ? networkValid.value : null;
  const safeExpected = expectedNetworkValid.valid && expectedNetworkValid.value
    ? expectedNetworkValid.value
    : APP_EXPECTED_NETWORK;

  // Mismatch detection uses validated inputs only
  const hasMismatch = Boolean(safeAddress) && isNetworkMismatch(safeNetwork, safeExpected);

  // Tamper-resistant dismiss key: encodes address + network + expected
  const mismatchKey = useMemo(
    () => buildMismatchKey(safeAddress, safeNetwork, safeExpected),
    [safeAddress, safeNetwork, safeExpected],
  );

  const showBanner = hasMismatch && dismissedMismatch !== mismatchKey;

  // Reset dismiss state when mismatch resolves
  useEffect(() => {
    if (!hasMismatch) {
      setDismissedMismatch(null);
    }
  }, [hasMismatch]);

  // Telemetry on visibility transitions only
  const prevShownRef = useRef(false);
  useEffect(() => {
    if (showBanner && !prevShownRef.current) {
      recordWalletTelemetry({
        event: 'wallet.network.mismatch_shown',
        ts: Date.now(),
        network: safeNetwork ?? 'unknown',
        expectedNetwork: safeExpected,
      });
    }
    prevShownRef.current = showBanner;
  }, [showBanner, safeNetwork, safeExpected]);

  const prevMismatchRef = useRef(hasMismatch);
  useEffect(() => {
    if (!hasMismatch && prevMismatchRef.current) {
      recordWalletTelemetry({
        event: 'wallet.network.recovered',
        ts: Date.now(),
        network: safeNetwork ?? 'unknown',
        expectedNetwork: safeExpected,
      });
    }
    prevMismatchRef.current = hasMismatch;
  }, [hasMismatch, safeNetwork, safeExpected]);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      role="alert"
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
      <span>
        <strong>Wrong wallet network.</strong> Freighter is on{' '}
        <strong>{networkLabel(safeNetwork)}</strong>, but Disciplr expects{' '}
        <strong>{networkLabel(safeExpected)}</strong>. Switch Freighter before
        creating or validating vaults.
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
        <a
          href={FREIGHTER_NETWORK_HELP_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Switch Freighter network"
          style={{
            color: 'var(--danger)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-1)',
            fontWeight: 700,
          }}
        >
          Switch network
          <ExternalLink size={14} aria-hidden="true" />
        </a>
        <button
          type="button"
          aria-label="Dismiss network mismatch warning"
          onClick={() => {
            setDismissedMismatch(mismatchKey);
            recordWalletTelemetry({
              event: 'wallet.network.dismissed',
              ts: Date.now(),
              network: safeNetwork ?? 'unknown',
              expectedNetwork: safeExpected,
            });
          }}
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
          }}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}
