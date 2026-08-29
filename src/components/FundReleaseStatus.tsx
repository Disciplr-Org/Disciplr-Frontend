import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { Text } from './Text';
import { SafeLink } from './SafeLink';
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
}: FundReleaseStatusProps) {
  const { network } = useWallet();

  const { copy, Icon, hash, boundedAmount, boundedCurrency, boundedDestination, boundedHash } =
    useMemo(() => {
      const violations: string[] = [];

      // Invariant: final outcomes must carry a destination address.
      if (outcome !== 'pending' && !destinationAddress) {
        violations.push('final-outcome-missing-destination');
      }
      // Invariant: pending outcome must not carry settlement details.
      if (outcome === 'pending' && (destinationAddress || transaction?.hash)) {
        violations.push('pending-has-settlement-details');
      }
      // Invariant: amount must be a finite, non-negative number within bounds.
      if (!Number.isFinite(amount) || amount < 0) {
        violations.push('invalid-amount');
      } else if (amount > MAX_AMOUNT) {
        violations.push('amount-overflow');
      }
      // Invariant: currency must be a non-empty bounded string.
      if (!currency || currency.length > MAX_CURRENCY_LENGTH) {
        violations.push('currency-overflow');
      }
      // Invariant: address and hash must be bounded.
      if (destinationAddress && destinationAddress.length > MAX_ADDRESS_LENGTH) {
        violations.push('destination-overflow');
      }
      if (transaction?.hash && transaction.hash.length > MAX_HASH_LENGTH) {
        violations.push('hash-overflow');
      }

      if (violations.length > 0) {
        logger.warn('[FundReleaseStatus] invariant violation', {
          outcome,
          violations,
        });
      }

      const copy = OUTCOME_COPY[outcome];
      const Icon = copy.icon;
      const hash = transaction?.hash;

      return {
        copy,
        Icon,
        hash,
        boundedAmount: Number.isFinite(amount) && amount >= 0 ? Math.min(amount, MAX_AMOUNT) : 0,
        boundedCurrency: currency ? currency.slice(0, MAX_CURRENCY_LENGTH) : '',
        boundedDestination: destinationAddress
          ? destinationAddress.slice(0, MAX_ADDRESS_LENGTH)
          : undefined,
        boundedHash: hash ? hash.slice(0, MAX_HASH_LENGTH) : undefined,
      };
    }, [outcome, destinationAddress, amount, currency, transaction]);

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
