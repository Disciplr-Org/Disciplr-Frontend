import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import type { WalletNetwork } from '../context/WalletContext';
import { Text } from './Text';
import { SafeLink } from './SafeLink';
import { getExplorerTxUrl } from '../utils/explorer';
import {
  isPlausibleStellarAddress,
  isValidCurrency,
  isValidTxHash,
} from '../utils/vaultState';
import { useVaultActionStore, getActionKey } from '../stores/vaultActionStore';
import './FundReleaseStatus.css';

export type FundReleaseOutcome = 'released' | 'redirected' | 'pending';

export interface SettlementTransaction {
  hash?: string;
  timestamp?: string;
}

export interface FundReleaseStatusProps {
  outcome: FundReleaseOutcome;
  destinationAddress?: string;
  amount: number;
  currency: string;
  transaction?: SettlementTransaction;
  vaultId?: string;
  /** The network the vault contract lives on. When provided alongside the
   *  wallet's network, a mismatch is surfaced instead of silently generating
   *  an explorer link for the wrong network. */
  network?: WalletNetwork;
  isLoading?: boolean;
}

/**
 * Explicit bounds for the fund-release state.
 *
 * - `MAX_AMOUNT` guards against absurd numeric values that would overflow
 *   locale formatting or mislead users.
 * - `MAX_CURRENCY_LENGTH` bounds the currency symbol/name.
 * - `MAX_ADDRESS_LENGTH` and `MAX_HASH_LENGTH` bound the strings we render
 *   and pass to SafeLink / explorer URL builders.
 */
export const MAX_AMOUNT = 1_000_000_000_000; // 1e12
export const MAX_CURRENCY_LENGTH = 16;
export const MAX_ADDRESS_LENGTH = 128;
export const MAX_HASH_LENGTH = 128;

export function truncateMiddle(value: string, prefixLength = 6, suffixLength = 4): string {
  if (typeof value !== 'string' || value.length === 0) {
    return 'Unavailable';
  }
  if (value.length <= prefixLength + suffixLength + 3) {
    return value;
  }

  return `${value.slice(0, prefixLength)}...${value.slice(-suffixLength)}`;
}

function networkLabel(network: WalletNetwork | null | undefined): string {
  return network === 'PUBLIC' ? 'mainnet' : 'testnet';
}

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) {
    return 'Pending confirmation';
  }

  const parsed = new Date(timestamp);
  if (!Number.isFinite(parsed.getTime())) {
    return 'Unknown';
  }

  return parsed.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface InvariantViolation {
  outcome: FundReleaseOutcome;
  violations: string[];
}

function validateInvariants(
  outcome: FundReleaseOutcome,
  destinationAddress: string | undefined,
  transaction: SettlementTransaction | undefined,
): InvariantViolation | null {
  const violations: string[] = [];

  // Final outcomes (released/redirected) must have a destination unless transaction details exist
  if ((outcome === 'released' || outcome === 'redirected') && !destinationAddress && !transaction) {
    violations.push('final-outcome-missing-destination');
  }

  if (outcome === 'released' && !transaction) {
    violations.push('final-outcome-missing-transaction');
  }

  // Pending outcome should not have transaction details
  if (outcome === 'pending' && transaction) {
    violations.push('pending-has-settlement-details');
  }

  // Destination address must not exceed max length
  if (destinationAddress && destinationAddress.length > MAX_ADDRESS_LENGTH) {
    violations.push('destination-overflow');
  }

  if (violations.length > 0) {
    console.warn('[FundReleaseStatus] invariant violation', {
      outcome,
      violations,
    });
    return { outcome, violations };
  }

  return null;
}

const OUTCOME_COPY = {
  released: {
    title: 'Funds released',
    description: 'USDC was released to the success destination.',
    icon: CheckCircle2,
  },
  redirected: {
    title: 'Funds redirected',
    description: 'USDC was redirected to the failure destination.',
    icon: AlertTriangle,
  },
  pending: {
    title: 'Settlement pending',
    description: 'USDC remains locked until validation or deadline settlement completes.',
    icon: Clock3,
  },
} satisfies Record<FundReleaseOutcome, { title: string; description: string; icon: typeof CheckCircle2 }>;

export function FundReleaseStatus({
  outcome,
  destinationAddress,
  amount,
  currency,
  transaction,
  vaultId,
  network,
  isLoading,
}: FundReleaseStatusProps) {
  const { network: walletNetwork } = useWallet();
  const { actions } = useVaultActionStore();
  
  if (isLoading) {
    return (
      <section className="fund-release-status">
        <Text role="body" as="p">Loading settlement status...</Text>
      </section>
    );
  }

  const invariantViolation = validateInvariants(outcome, destinationAddress, transaction);
  
  if (invariantViolation) {
    return (
      <section
        role="alert"
        data-testid="settlement-error"
        className="fund-release-status fund-release-status--error"
        aria-label="Settlement error"
      >
        <div className="fund-release-status__error">
          <Text role="title" as="h2">Cannot load settlement status</Text>
          <Text role="body" as="p">
            {invariantViolation.violations.includes('final-outcome-missing-destination')
              ? 'Final outcomes must specify a destination address.'
              : invariantViolation.violations.includes('final-outcome-missing-transaction')
              ? 'Settlement transaction details are required for released funds.'
              : invariantViolation.violations.includes('pending-has-settlement-details')
              ? 'Pending settlement cannot have transaction details.'
              : 'Invalid settlement configuration.'}
          </Text>
        </div>
      </section>
    );
  }

  let effectiveOutcome = outcome;
  if (vaultId) {
    const cancelKey = getActionKey(vaultId, 'cancel_vault');
    if (actions[cancelKey]?.status === 'success') {
      effectiveOutcome = 'redirected';
    } else if (effectiveOutcome === 'pending') {
      // If there's a successful validate_milestone action for the last milestone...
      // Actually we don't know which milestone is last here easily without vault data.
      // We can just rely on the cancel_vault optimistic update or if we pass the whole vault down.
    }
  }

  const copy = OUTCOME_COPY[effectiveOutcome] ?? OUTCOME_COPY.pending;
  const Icon = copy.icon;
  const hash = transaction?.hash;
  const validHash = isValidTxHash(hash);
  const explorerNetwork = network ?? walletNetwork;
  const walletNetworkMismatch =
    network !== undefined &&
    walletNetwork !== null &&
    network !== walletNetwork;

  const boundedAmount =
    typeof amount === 'number' && Number.isFinite(amount) && amount >= 0
      ? Math.min(amount, MAX_AMOUNT)
      : 0;

  const displayAmount =
    typeof amount === 'number' && Number.isFinite(amount) && amount >= 0
      ? boundedAmount.toLocaleString()
      : effectiveOutcome === 'pending'
      ? '0'
      : 'Unavailable';

  let displayCurrency = 'UNKNOWN';
  if (typeof currency === 'string' && /^[A-Za-z]+$/.test(currency)) {
    displayCurrency =
      currency.length > MAX_CURRENCY_LENGTH
        ? currency.slice(0, MAX_CURRENCY_LENGTH)
        : currency;
  } else if (isValidCurrency(currency)) {
    displayCurrency = currency;
  }

  const safeDestination =
    typeof destinationAddress === 'string' && destinationAddress.length > 0
      ? destinationAddress
      : undefined;
  const destinationVerified = isPlausibleStellarAddress(safeDestination);

  return (
    <section
      role="region"
      className={`fund-release-status fund-release-status--${effectiveOutcome}`}
      aria-label={`Fund settlement status: ${copy.title}`}
    >
      <div className="fund-release-status__header">
        <span
          className={`fund-release-status__icon fund-release-status__icon--${effectiveOutcome}`}
          aria-hidden="true"
        >
          <Icon size={22} />
        </span>
        <div>
          <Text role="title" as="h2" className="fund-release-status__title">
            {copy.title}
          </Text>
          <Text role="body" as="p" className="fund-release-status__description">
            {copy.description}
          </Text>
        </div>
      </div>

      {effectiveOutcome === 'pending' && (
        <Text role="body" as="p" className="fund-release-status__pending-copy">
          Settlement transaction details will appear after funds are released or redirected.
        </Text>
      )}

      {walletNetworkMismatch && (
        <p
          className="fund-release-status__network-warning"
          role="status"
          aria-label="Network mismatch notice"
        >
          This settlement belongs to the {networkLabel(network)} contract, but your wallet is
          connected to {networkLabel(walletNetwork)}. Transaction explorer links may not match
          the network your wallet expects.
        </p>
      )}

      <div className="fund-release-status__grid">
        <div className="fund-release-status__field">
          <span className="fund-release-status__label">
            Destination
          </span>
          {safeDestination ? (
            <span
              className="fund-release-status__value font-mono"
              title={safeDestination}
              aria-label={`Destination address ${safeDestination}`}
            >
              {truncateMiddle(safeDestination)}
              {!destinationVerified && (
                <span className="fund-release-status__unverified"> (unverified)</span>
              )}
            </span>
          ) : (
            <span className="fund-release-status__label">
              Not available
            </span>
          )}
        </div>
        <div className="fund-release-status__field">
          <span className="fund-release-status__label">
            Amount
          </span>
          <span className="fund-release-status__value font-mono">
            {displayAmount} {displayCurrency}
          </span>
        </div>
        <div className="fund-release-status__field">
          <span className="fund-release-status__label">
            Settled
          </span>
          <span className="fund-release-status__value">
            {formatTimestamp(transaction?.timestamp)}
          </span>
        </div>
        <div className="fund-release-status__field">
          <span className="fund-release-status__label">
            Transaction
          </span>
          {validHash && hash ? (
            <SafeLink
              className="fund-release-status__link"
              href={explorerUrl(hash, explorerNetwork)}
              title={hash}
              aria-label={`View transaction ${hash} on Stellar ${explorerNetwork === 'PUBLIC' ? 'Public' : 'Testnet'} explorer`}
            >
              {truncateMiddle(hash, 8, 6)}
            </SafeLink>
          ) : hash ? (
            <span className="fund-release-status__label">
              Invalid transaction hash
            </span>
          ) : (
            <span className="fund-release-status__label">
              Pending transaction
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function explorerUrl(hash: string, network: WalletNetwork | null | undefined): string {
  return getExplorerTxUrl(hash, network ?? null);
}