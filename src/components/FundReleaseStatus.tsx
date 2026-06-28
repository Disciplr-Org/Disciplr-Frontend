import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { Text } from './Text';
import { getExplorerTxUrl } from '../utils/explorer';
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
            {destinationAddress ? (
              <Text
                role="mono"
                as="span"
                className="fund-release-status__value"
                title={destinationAddress}
                aria-label={`Destination address ${destinationAddress}`}
              >
                {truncateMiddle(destinationAddress)}
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
              {amount.toLocaleString()} {currency}
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
            {hash ? (
              <a
                className="fund-release-status__link"
                href={explorerUrl(hash, network)}
                target="_blank"
                rel="noopener noreferrer"
                title={hash}
                aria-label={`View transaction ${hash} on Stellar ${network === 'PUBLIC' ? 'Public' : 'Testnet'} explorer`}
              >
                {truncateMiddle(hash, 8, 6)}
              </a>
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
