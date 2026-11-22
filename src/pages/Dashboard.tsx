import { useMemo } from "react";
import { Link } from "react-router-dom";
import ActivityFeed from "../components/ActivityFeed";
import SuccessChart from "../components/SuccessChart";
import SummaryCards from "../components/SummaryCards";
import { Text } from "../components/Text";
import UpcomingDeadlines from "../components/UpcomingDeadlines";
import VaultCard from "../components/VaultCard";
import { useWallet } from "../context/WalletContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { getAtRiskVaults } from "../utils/atRiskVaults";
import * as dashboardUtils from "../utils/dashboard";
import type { VaultPreview } from "../utils/dashboard";
import { sanitizeActivity } from "../utils/dashboardValidation";

const CARD_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "1.25rem",
} as const;

const COL_STACK_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: "1.25rem",
} as const;

const QUICK_ACTIONS = [
  {
    to: "/vaults/create",
    label: "+ Create Vault",
    style: {
      background: "var(--accent)",
      color: "var(--bg)",
      padding: "0.6rem 1.25rem",
      borderRadius: "var(--radius)",
      fontWeight: 600,
      fontSize: 14,
      textDecoration: "none",
    },
  },
  {
    to: "/vaults",
    label: "View All Vaults",
    style: {
      background: "var(--surface)",
      color: "var(--text)",
      border: "1px solid var(--border)",
      padding: "0.6rem 1.25rem",
      borderRadius: "var(--radius)",
      fontWeight: 500,
      fontSize: 14,
      textDecoration: "none",
    },
  },
  {
    to: "/verifier/queue",
    label: "Verify Milestone",
    style: {
      background: "var(--surface)",
      color: "var(--warning)",
      border: "1px solid var(--warning)",
      padding: "0.6rem 1.25rem",
      borderRadius: "var(--radius)",
      fontWeight: 500,
      fontSize: 14,
      textDecoration: "none",
    },
  },
] as const;

function SectionHeader({
  title,
  action,
  to,
}: {
  title: string;
  action?: string;
  to?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "0.75rem",
      }}
    >
      <Text role="body" as="h2" style={{ margin: 0, fontWeight: 600 }}>
        {title}
      </Text>
      {action && to && (
        <Link to={to} style={{ color: "var(--accent)", fontSize: 13 }}>
          {action}
        </Link>
      )}
    </div>
  );
}

function AtRiskSection({ vaults }: { vaults: VaultPreview[] }) {
  const atRiskVaults = getAtRiskVaults(vaults);
  if (atRiskVaults.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: "1.75rem",
        background: "var(--danger-transparent)",
        border: "1px solid var(--danger)",
        borderRadius: "var(--radius)",
        padding: "1.25rem",
      }}
    >
      <SectionHeader title={`⚠️ At Risk (${atRiskVaults.length})`} />
      <Text role="caption" as="p" style={{ color: "var(--danger)", margin: "0 0 1rem" }}>
        These vaults need immediate attention — their deadlines are approaching or critical.
      </Text>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {atRiskVaults.map((v) => (
          <VaultCard key={v.id} {...v} />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { address, connect } = useWallet();
  const { status: viewStatus, data, retry: retryVaults } = useDashboardData(address);
  const {
    vaults: shownVaults,
    fullVaults: shownFullVaults,
    activity,
    deadlines: safeDeadlines,
    stats,
    rejectedCount,
  } = data;

  const showData = viewStatus === "data";

  const computedSummary = useMemo(
    () => dashboardUtils.computeDashboardSummary(shownFullVaults),
    [shownFullVaults],
  );
  // Totals come from GET /stats?creator= when available (creator-owned vaults only).
  const memoizedSummary = useMemo(
    () =>
      dashboardUtils.formatSummary({
        ...computedSummary,
        ...(showData && stats
          ? { totalLocked: stats.totalLocked, activeVaults: stats.active }
          : {}),
      }),
    [computedSummary, showData, stats],
  );
  const memoizedActivity = useMemo(
    () => dashboardUtils.processActivity(sanitizeActivity(activity)),
    [activity],
  );

  if (!address) {
    return (
      <div style={{ maxWidth: "var(--container-wide)", margin: "0 auto", padding: "0 0 3rem" }}>
        <Text role="title" as="h1" style={{ margin: "0 0 0.25rem" }}>
          Dashboard
        </Text>
        <div
          style={{
            ...CARD_STYLE,
            textAlign: "center",
            padding: "3rem 1rem",
            color: "var(--muted)",
          }}
        >
          <Text role="body" as="p" style={{ fontWeight: 600 }}>
            Connect your wallet to see your vaults
          </Text>
          <Text role="caption" as="p">
            Your vaults, activity and deadlines appear here once a wallet is connected.
          </Text>
          <button type="button" onClick={() => void connect()}>
            Connect wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "var(--container-wide)", margin: "0 auto", padding: "0 0 3rem" }}>
      {/* Welcome */}
      <div style={{ marginBottom: "1.75rem" }}>
        <Text role="title" as="h1" style={{ margin: "0 0 0.25rem" }}>
          Dashboard
        </Text>
        <Text role="body" as="p" style={{ color: "var(--muted)", margin: 0 }}>
          Your vault overview at a glance.
        </Text>
      </div>

      {/* ── Summary Cards ── */}
      <SummaryCards summary={memoizedSummary} />

      {/* ── Quick Actions ── */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.to} to={a.to} style={a.style}>
            {a.label}
          </Link>
        ))}
      </div>

      {/* ── At Risk Vaults ── */}
      <AtRiskSection vaults={shownVaults} />

      {/* ── Main grid: vault list + sidebar ── */}
      <div className="dashboard-main-grid" style={{ gap: "1.25rem", alignItems: "start" }}>
        {/* Left column */}
        <div style={COL_STACK_STYLE}>
          {/* Vault Preview List */}
          <div style={CARD_STYLE}>
            <SectionHeader title="Your vaults" action="View all →" to="/vaults" />
            {viewStatus === "loading" && (
              <Text role="body" as="p" style={{ color: "var(--muted)" }}>
                <span role="status">Loading vaults…</span>
              </Text>
            )}

            {viewStatus === "error" && (
              <div
                role="alert"
                style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--muted)" }}
              >
                <Text role="body" as="p">
                  Failed to load vaults.
                </Text>
                <button type="button" onClick={retryVaults}>
                  Retry
                </button>
              </div>
            )}

            {viewStatus === "empty" && (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--muted)" }}>
                <div style={{ fontSize: 40, marginBottom: "0.75rem" }}>🔒</div>
                <Text role="body" as="div" style={{ fontWeight: 600, marginBottom: 4 }}>
                  No vaults yet
                </Text>
                <Text role="caption" as="div" style={{ marginBottom: "1rem" }}>
                  Create your first vault to start locking capital.
                </Text>
                <Link
                  to="/vaults/create"
                  style={{
                    background: "var(--accent)",
                    color: "var(--bg)",
                    padding: "0.5rem 1.25rem",
                    borderRadius: "var(--radius)",
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Create Vault
                </Link>
              </div>
            )}

            {viewStatus === "data" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {rejectedCount > 0 && (
                  <Text role="caption" as="p" style={{ color: "var(--warning)", margin: 0 }}>
                    <span role="status">
                      {rejectedCount === 1
                        ? "1 vault could not be verified and is not shown."
                        : `${rejectedCount} vaults could not be verified and are not shown.`}
                    </span>
                  </Text>
                )}
                {shownVaults.map((v) => (
                  <VaultCard key={v.id} {...v} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <ActivityFeed activity={memoizedActivity} />
        </div>

        {/* Right sidebar */}
        <div style={COL_STACK_STYLE}>
          <UpcomingDeadlines deadlines={safeDeadlines} vaults={shownFullVaults} />

          {/* Success Rate Chart (sparkline bars) */}
          <div style={CARD_STYLE}>
            <SectionHeader title="Success Rate" />
            <Text role="caption" as="div" style={{ color: "var(--muted)", marginBottom: "0.75rem" }}>
              Last 6 months
            </Text>
            <SuccessChart />
          </div>
        </div>
      </div>
    </div>
  );
}
