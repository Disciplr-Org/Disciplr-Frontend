import { AlertTriangle, CheckCircle2, Clock3, Loader2 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { Text } from './Text';
import { SafeLink } from './SafeLink';
import { EmptyState } from './EmptyState';
import { getExplorerTxUrl } from '../utils/explorer';
import { logger } from '../utils/logger';
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
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
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
  if (value.length <= prefixLength + suffixLength + 3) {
    return value;
  }

  return `${value.slice(0, prefixLength)}...${value.slice(-suffixLength)}`;
}

function explorerUrl(hash: string, network: 'TESTNET' | 'PUBLIC' | null): string {
  return getExplorerTxUrl(hash, network);
}

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) {
    return 'Pending confirmation';
  }

  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function checkInvariants(outcome: FundReleaseOutcome, transaction?: SettlementTransaction): Error | null {
  const hasTx = !!(transaction?.hash || transaction?.timestamp);
  
  if ((outcome === 'released' || outcome === 'redirected') && !hasTx) {
    return new Error(`Settlement transaction details are required for ${outcome} funds.`);
  }
  
  if (outcome === 'pending' && hasTx) {
    return new Error(`Pending settlement cannot have transaction details.`);
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
  isLoading,
  error,
  onRetry,
}: FundReleaseStatusProps) {
  const { network } = useWallet();

  if (isLoading) {
    return (
      <div className="fund-release-status-loading" aria-busy="true" aria-live="polite">
        <Loader2 className="fund-release-status-spinner" aria-hidden="true" size={24} />
        <Text role="body" as="p">Loading settlement status...</Text>
      </div>
    );
  }

  const invariantError = checkInvariants(outcome, transaction);
  const activeError = error || invariantError;

  if (activeError) {
    return (
      <div className="fund-release-status-error" role="alert" aria-live="assertive">
        <EmptyState
          icon={<AlertTriangle size={32} style={{ color: 'var(--danger, red)' }} />}
          title="Cannot load settlement status"
          description={activeError.message}
          action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
        />
      </div>
    );
  }

  const copy = OUTCOME_COPY[outcome];
  const Icon = copy.icon;
  const hash = transaction?.hash;

  return (
    <section
      className={`fund-release-status fund-release-status--${outcome}`}
      aria-label={`Fund settlement status: ${copy.title}`}
    >
      <div className="fund-release-status__header">
        <span
          className={`fund-release-status__icon fund-release-status__icon--${outcome}`}
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

      {outcome === 'pending' ? (
        <Text role="body" as="p" className="fund-release-status__pending-copy">
          Settlement transaction details will appear after funds are released or redirected.
        </Text>
      ) : (
        <div className="fund-release-status__grid">
          <div className="fund-release-status__field">
            <Text role="caption" as="span" className="fund-release-status__label">
              Destination
            </Text>
            {boundedDestination ? (
              <Text
                role="mono"
                as="span"
                className="fund-release-status__value"
                title={boundedDestination}
                aria-label={`Destination address ${boundedDestination}`}
              >
                {truncateMiddle(boundedDestination)}
              </Text>
            ) : (
              <Text role="caption" as="span" className="fund-release-status__label">
                Not available
              </Text>
            )}
          </div>
          <div className="fund-release-status__field">
            <Text role="caption" as="span" className="fund-release-status__label">
              Amount
            </Text>
            <Text role="mono" as="span" className="fund-release-status__value">
              {boundedAmount.toLocaleString()} {boundedCurrency}
            </Text>
          </div>
          <div className="fund-release-status__field">
            <Text role="caption" as="span" className="fund-release-status__label">
              Settled
            </Text>
            <Text role="caption" as="span" className="fund-release-status__value">
              {formatTimestamp(transaction?.timestamp)}
            </Text>
          </div>
          <div className="fund-release-status__field">
            <Text role="caption" as="span" className="fund-release-status__label">
              Transaction
            </Text>
            {boundedHash ? (
              <SafeLink
                className="fund-release-status__link"
                href={explorerUrl(boundedHash, network)}
                title={boundedHash}
                aria-label={`View transaction ${boundedHash} on Stellar ${network === 'PUBLIC' ? 'Public' : 'Testnet'} explorer`}
              >
                {truncateMiddle(boundedHash, 8, 6)}
              </SafeLink>
            ) : (
              <Text role="caption" as="span" className="fund-release-status__label">
                Pending transaction
              </Text>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
