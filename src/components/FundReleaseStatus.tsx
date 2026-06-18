import { AlertTriangle, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { Text } from './Text';
import { useWallet, type WalletNetwork } from '../context/WalletContext';
import './FundReleaseStatus.css';

export type FundReleaseOutcome = 'released' | 'redirected' | 'pending';

export interface FundReleaseTransaction {
  hash?: string;
  timestamp?: string;
}

export interface FundReleaseStatusProps {
  outcome: FundReleaseOutcome;
  destinationAddress?: string;
  amount: number;
  assetCode?: string;
  transaction?: FundReleaseTransaction;
}

const OUTCOME_CONFIG = {
  released: {
    label: 'Funds released',
    description: 'Locked USDC was sent to the success destination.',
    tone: 'success',
    Icon: CheckCircle2,
  },
  redirected: {
    label: 'Funds redirected',
    description: 'Locked USDC was redirected to the failure destination.',
    tone: 'danger',
    Icon: AlertTriangle,
  },
  pending: {
    label: 'Settlement pending',
    description: 'Locked USDC has not reached a final destination yet.',
    tone: 'neutral',
    Icon: Clock,
  },
} as const;

export function truncateStellarValue(value: string, leading = 6, trailing = 4): string {
  return value.length > leading + trailing + 3
    ? `${value.slice(0, leading)}...${value.slice(-trailing)}`
    : value;
}

export function stellarTxUrl(hash: string, network: WalletNetwork | null): string {
  const networkPath = network === 'TESTNET' ? 'testnet' : 'public';
  return `https://stellar.expert/explorer/${networkPath}/tx/${hash}`;
}

function formatSettlementDate(timestamp?: string): string {
  if (!timestamp) return 'Awaiting settlement';

  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FundReleaseStatus({
  outcome,
  destinationAddress,
  amount,
  assetCode = 'USDC',
  transaction,
}: FundReleaseStatusProps) {
  const { network } = useWallet();
  const config = OUTCOME_CONFIG[outcome];
  const Icon = config.Icon;
  const transactionHash = transaction?.hash;
  const hasTransactionHash = Boolean(transactionHash);

  return (
    <section
      className={`fund-release fund-release--${config.tone}`}
      aria-labelledby="fund-release-heading"
    >
      <div className="fund-release__header">
        <span className="fund-release__icon" aria-hidden="true">
          <Icon size={20} strokeWidth={2.25} />
        </span>
        <div>
          <Text id="fund-release-heading" role="body" as="h2" className="fund-release__title">
            {config.label}
          </Text>
          <Text role="caption" as="p" className="fund-release__description">
            {config.description}
          </Text>
        </div>
      </div>

      <dl className="fund-release__details">
        <div className="fund-release__row">
          <dt>Amount</dt>
          <dd>{amount.toLocaleString()} {assetCode}</dd>
        </div>
        <div className="fund-release__row">
          <dt>Destination</dt>
          <dd>
            {destinationAddress ? (
              <span
                className="fund-release__mono"
                title={destinationAddress}
                aria-label={`Destination address ${destinationAddress}`}
              >
                {truncateStellarValue(destinationAddress)}
              </span>
            ) : (
              <span className="fund-release__muted">Not assigned yet</span>
            )}
          </dd>
        </div>
        <div className="fund-release__row">
          <dt>Settled</dt>
          <dd>{formatSettlementDate(transaction?.timestamp)}</dd>
        </div>
        <div className="fund-release__row">
          <dt>Transaction</dt>
          <dd>
            {hasTransactionHash ? (
              <a
                className="fund-release__tx-link"
                href={stellarTxUrl(transactionHash, network)}
                target="_blank"
                rel="noopener noreferrer"
                title={transactionHash}
                aria-label={`View transaction ${transactionHash} on Stellar Explorer`}
              >
                <span className="fund-release__mono">
                  {truncateStellarValue(transactionHash, 8, 6)}
                </span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : (
              <span className="fund-release__muted">Awaiting transaction hash</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
