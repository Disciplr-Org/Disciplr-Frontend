import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MilestoneTracker } from "../components/MilestoneTracker";
import { VaultProgressBar } from "../components/VaultProgressBar";
import { CountdownDeadline } from "../components/CountdownDeadline";
import {
  FundReleaseStatus,
  type FundReleaseStatusProps,
} from "../components/FundReleaseStatus";
import { Text } from "../components/Text";
import { AddressDisplay } from "../components/AddressDisplay";
import { useWallet } from "../context/WalletContext";
import { contractExplorerUrl, networkLabel } from "../utils/explorer";
import type { VaultStatus, MilestoneStatus, TxType, Vault, Milestone, VaultTransaction } from "../types/vault";
import { getVault } from "../services/vaultService";

// ── Types imported from canonical source ─────────────────────────────────────
// Milestone, VaultTransaction, Vault, VaultStatus, MilestoneStatus, TxType
// are all imported from "../types/vault" above.
// MOCK_VAULTS has moved to "../services/vaultService" as the master dataset.

// Suppress unused-import warnings for type-only imports used in JSX props
type _Milestone = Milestone;
type _VaultTransaction = VaultTransaction;

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  VaultStatus,
  { label: string; color: string; bg: string }
> = {
  active: {
    label: "Active",
    color: "var(--accent)",
    bg: "var(--accent-transparent)",
  },
  completed: {
    label: "Completed",
    color: "var(--success)",
    bg: "rgba(16,185,129,0.1)",
  },
  failed: {
    label: "Failed",
    color: "var(--danger)",
    bg: "rgba(239,68,68,0.1)",
  },
  cancelled: {
    label: "Cancelled",
    color: "var(--muted)",
    bg: "rgba(156,163,175,0.1)",
  },
  pending_validation: {
    label: "Pending Validation",
    color: "var(--warning)",
    bg: "rgba(245,158,11,0.1)",
  },
};

const TX_LABELS: Record<string, string> = {
  create: "Vault Created",
  validate: "Milestone Validated",
  release: "Funds Released",
  redirect: "Funds Redirected",
};

function truncHash(hash: string): string {
  return hash.length > 12 ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : hash;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timelineProgress(created: string, deadline: string): number {
  const start = new Date(created).getTime();
  const end = new Date(deadline).getTime();
  const now = Date.now();
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

function settlementForVault(vault: Vault): FundReleaseStatusProps {
  const releaseTx = vault.transactions.find((tx) => tx.type === "release");
  const redirectTx = vault.transactions.find((tx) => tx.type === "redirect");

  if (vault.status === "completed") {
    return {
      outcome: "released",
      destinationAddress: vault.successAddress,
      amount: releaseTx?.amount ?? vault.amount,
      currency: vault.currency,
      transaction: releaseTx,
    };
  }

  if (vault.status === "failed" || vault.status === "cancelled") {
    return {
      outcome: "redirected",
      destinationAddress: vault.failureAddress,
      amount: redirectTx?.amount ?? vault.amount,
      currency: vault.currency,
      transaction: redirectTx,
    };
  }

  return {
    outcome: "pending",
    amount: vault.amount,
    currency: vault.currency,
  };
}

// ── Address Row ───────────────────────────────────────────────────────────────
function AddrRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <Text
        role="caption"
        as="span"
        style={{ color: "var(--muted)", minWidth: 140 }}
      >
        {label}
      </Text>
      <AddressDisplay address={value} />
    </div>
  );
}

// ── Section Card ─────────────────────────────────────────────────────────────
function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "1.25rem",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VaultDetail() {
  const { id } = useParams<{ id: string }>();
  const { network } = useWallet();
  const [vault, setVault] = useState<Vault | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getVault(id ?? "").then((v) => {
      setVault(v);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <Text role="body" as="p" style={{ color: "var(--muted)" }}>
          Loading vault…
        </Text>
      </div>
    );
  }

  if (!vault) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <Text role="title" as="h2" style={{ marginBottom: "0.5rem" }}>
          Vault not found
        </Text>
        <Text
          role="body"
          as="p"
          style={{ color: "var(--muted)", marginBottom: "1.5rem" }}
        >
          No vault with ID "{id}" exists.
        </Text>
        <Link to="/vaults" style={{ color: "var(--accent)" }}>
          ← Back to Vaults
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[vault.status];
  const progress = timelineProgress(vault.createdAt, vault.deadline);
  const isActive =
    vault.status === "active" || vault.status === "pending_validation";
  const settlement = settlementForVault(vault);

  return (
    <div
      style={{
        maxWidth: "var(--container-detail)",
        margin: "0 auto",
        padding: "0 0 3rem",
      }}
    >
      {/* Back link */}
      <Link
        to="/vaults"
        style={{
          color: "var(--muted)",
          fontSize: 14,
          display: "inline-block",
          marginBottom: "1.25rem",
        }}
      >
        ← Back to Vaults
      </Link>

      {/* ── Header ── */}
      <Card style={{ marginBottom: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
                marginBottom: "0.5rem",
              }}
            >
              <Text role="title" as="h1" style={{ margin: 0 }}>
                {vault.name}
              </Text>
              <span
                style={{
                  background: statusCfg.bg,
                  color: statusCfg.color,
                  border: `var(--border-width-1) solid ${statusCfg.color}`,
                  borderRadius: "var(--radius-full)",
                  padding: "2px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {statusCfg.label}
              </span>
            </div>
            <Text
              role="display"
              as="div"
              style={{ color: "var(--accent)", lineHeight: 1.1 }}
            >
              {vault.amount.toLocaleString()}{" "}
              <span
                style={{
                  fontSize: "0.45em",
                  color: "var(--muted)",
                  fontWeight: 400,
                }}
              >
                {vault.currency}
              </span>
            </Text>
          </div>

          {/* Quick Actions */}
          {isActive && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {vault.status === "pending_validation" && (
                <button style={actionBtn("var(--accent)")}>
                  Validate Milestone
                </button>
              )}
              <button style={actionBtn("var(--warning)")}>
                Extend Deadline
              </button>
              <button style={actionBtn("var(--danger)")}>Cancel Vault</button>
            </div>
          )}
        </div>
      </Card>

      {/* ── Timeline ── */}
      <Card style={{ marginBottom: "1.25rem" }}>
        <Text
          role="caption"
          as="div"
          style={{
            color: "var(--muted)",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Status Timeline
        </Text>
        <VaultProgressBar
          value={progress}
          label={`${vault.name} timeline progress`}
          showValue={false}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "0.5rem",
          }}
        >
          <Text role="caption" as="span" style={{ color: "var(--muted)" }}>
            Created {fmtDate(vault.createdAt)}
          </Text>
          {isActive ? (
            <CountdownDeadline deadline={vault.deadline} />
          ) : (
            <Text
              role="caption"
              as="span"
              style={{ color: statusCfg.color, fontWeight: 600 }}
            >
              {statusCfg.label}
            </Text>
          )}
          <Text role="caption" as="span" style={{ color: "var(--muted)" }}>
            Deadline {fmtDate(vault.deadline)}
          </Text>
        </div>
      </Card>

      {/* ── Info + Addresses ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        <Card>
          <Text
            role="caption"
            as="div"
            style={{
              color: "var(--muted)",
              marginBottom: "1rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Vault Info
          </Text>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
          >
            <InfoRow label="Created" value={fmtDateTime(vault.createdAt)} />
            <InfoRow label="Deadline" value={fmtDateTime(vault.deadline)} />
            <InfoRow
              label="Duration"
              value={durationLabel(vault.createdAt, vault.deadline)}
            />
            <InfoRow
              label="Amount"
              value={`${vault.amount.toLocaleString()} ${vault.currency}`}
            />
          </div>
        </Card>

        <Card>
          <Text
            role="caption"
            as="div"
            style={{
              color: "var(--muted)",
              marginBottom: "1rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Addresses
          </Text>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
          >
            <AddrRow label="Creator" value={vault.creatorAddress} />
            {vault.verifierAddress && (
              <AddrRow label="Verifier" value={vault.verifierAddress} />
            )}
            <AddrRow label="Success destination" value={vault.successAddress} />
            <AddrRow label="Failure destination" value={vault.failureAddress} />
            <AddrRow label="Contract" value={vault.contractAddress} />
          </div>
        </Card>
      </div>

      <FundReleaseStatus {...settlement} />

      {/* ── Milestones ── */}
      <Card style={{ marginBottom: "1.25rem" }}>
        <Text
          role="caption"
          as="div"
          style={{
            color: "var(--muted)",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Milestones
        </Text>
        <MilestoneTracker milestones={vault.milestones} />
      </Card>

      {/* ── Transactions ── */}
      <Card>
        <Text
          role="caption"
          as="div"
          style={{
            color: "var(--muted)",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Transaction History
        </Text>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {vault.transactions.map((tx) => (
            <div
              key={tx.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                padding: "0.75rem",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
            >
              <div>
                <Text
                  role="caption"
                  as="div"
                  style={{ fontWeight: 600, marginBottom: 2 }}
                >
                  {TX_LABELS[tx.type]}
                </Text>
                <Text role="caption" as="div" style={{ color: "var(--muted)" }}>
                  {fmtDateTime(tx.timestamp)}
                </Text>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {tx.amount != null && (
                  <Text
                    role="caption"
                    as="span"
                    style={{ color: "var(--text)", fontWeight: 600 }}
                  >
                    {tx.amount.toLocaleString()} {vault.currency}
                  </Text>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Text
                    role="mono"
                    as="span"
                    style={{ color: "var(--muted)", fontSize: 11 }}
                  >
                    {truncHash(tx.hash)}
                  </Text>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(tx.hash).catch(() => {});
                    }}
                    title="Copy hash"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--muted)",
                      padding: "0 4px",
                      fontSize: 13,
                      lineHeight: 1,
                    }}
                  >
                    ⎘
                  </button>
                  <a
                    href={`https://stellar.expert/explorer/public/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--accent)", fontSize: 11 }}
                  >
                    ↗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Network Footer Banner ── */}
      <NetworkFooterBanner
        network={network}
        contractAddress={vault.contractAddress}
      />
    </div>
  );
}

// ── Network Footer Banner ─────────────────────────────────────────────────────
interface NetworkFooterBannerProps {
  network: string | null | undefined;
  contractAddress: string;
}

function NetworkFooterBanner({ network, contractAddress }: NetworkFooterBannerProps) {
  const label = networkLabel(network);
  const explorerUrl = contractAddress
    ? contractExplorerUrl(contractAddress, network ?? 'TESTNET')
    : '';

  const isTestnet = network !== 'PUBLIC';

  return (
    <footer
      aria-label="Network information"
      style={{
        marginTop: "1.5rem",
        padding: "0.75rem 1rem",
        borderRadius: "var(--radius)",
        border: `1px solid ${isTestnet ? "var(--warning, #f59e0b)" : "var(--success, #10b981)"}`,
        background: isTestnet
          ? "rgba(245,158,11,0.07)"
          : "rgba(16,185,129,0.07)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.5rem 1rem",
      }}
    >
      {/* Network badge */}
      <span
        aria-label={`Network: ${label}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: isTestnet
            ? "var(--warning, #f59e0b)"
            : "var(--success, #10b981)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isTestnet
              ? "var(--warning, #f59e0b)"
              : "var(--success, #10b981)",
          }}
        />
        {label}
      </span>

      {/* Contract address */}
      {contractAddress && (
        <Text
          role="mono"
          as="span"
          style={{ color: "var(--muted)", fontSize: 12, flex: 1, minWidth: 0 }}
          aria-label={`Contract address: ${contractAddress}`}
        >
          {contractAddress}
        </Text>
      )}

      {/* Explorer link */}
      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View contract ${contractAddress} on Stellar ${label} explorer`}
          style={{
            color: isTestnet
              ? "var(--warning, #f59e0b)"
              : "var(--success, #10b981)",
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          View on Explorer ↗
        </a>
      )}
    </footer>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <Text role="caption" as="span" style={{ color: "var(--muted)" }}>
        {label}
      </Text>
      <Text
        role="caption"
        as="span"
        style={{ color: "var(--text)", textAlign: "right" }}
      >
        {value}
      </Text>
    </div>
  );
}

function durationLabel(start: string, end: string): string {
  const days = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 86400000,
  );
  if (days >= 365) return `${Math.round(days / 365)}y`;
  if (days >= 30) return `${Math.round(days / 30)}mo`;
  return `${days}d`;
}

function actionBtn(color: string): React.CSSProperties {
  return {
    background: "transparent",
    border: `1px solid ${color}`,
    color,
    borderRadius: "var(--radius)",
    padding: "0.4rem 0.9rem",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    minHeight: 36,
  };
}
