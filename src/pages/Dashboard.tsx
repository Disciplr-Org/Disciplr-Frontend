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
import type { VaultPreview, Activity, Deadline } from "../utils/dashboard";
import type { Milestone, Vault, VaultStatus } from "../types/vault";
import {
  isValidVaultRouteId,
  isNonEmptyString,
  isVaultStatus,
  isPositiveAmount,
  isValidCurrency,
  isValidIsoTimestamp,
} from "../utils/vaultState";
import { logger } from "../utils/logger";
import { vaultProgressPct } from "../utils/vaultLifecycle";
import { validateVaultPreview, sanitizeActivity } from "../utils/dashboardValidation";

// ── Mock Data ─────────────────────────────────────────────────────────────────
// Seed data lives in src/fixtures/dashboard.ts. VAULTS are loaded async from
// vaultService (see Dashboard component below).
import { ACTIVITY, DEADLINES, CHART_DATA } from "../fixtures/dashboard";
import {
  listVaults,
  getStats,
  listTransactionsForVaults,
} from "../services/vaultService";
import { isApiEnabled, type ApiStats } from "../services/api";
import {
  mergeUserVaults,
  deriveActivity,
  deriveDeadlines,
  sortActiveFirst,
} from "../utils/dashboardDerive";
import { useOnRecovered } from "../hooks/useOnRecovered";
import { useT } from "../i18n";

// ── Helpers ───────────────────────────────────────────────────────────────────


/**
 * Invariant: only vaults whose preview passes validation are rendered.
 * Invalid entries are dropped and logged (no sensitive fields) so that
 * malformed upstream data cannot produce inconsistent summaries or cards.
 */
function toSafePreviews(loaded: Vault[]): VaultPreview[] {
  const safe: VaultPreview[] = [];
  for (const v of loaded) {
    const preview: VaultPreview = {
      id: v.id,
      name: v.name,
      amount: v.amount,
      currency: v.currency,
      status: v.status as VaultStatus,
      deadline: v.deadline,
      progressPct: vaultProgressPct(v),
    };
    const result = validateVaultPreview(preview);
    if (result.ok) {
      safe.push(preview);
    } else {
      logger.warn("[Dashboard] dropped invalid vault preview", {
        id: v.id,
        reason: result.reason,
      });
    }
  }
  return safe;
}

const ACTIVITY_CFG: Record<
  Activity["type"],
  { label: string; icon: string; color: string }
> = {
  created: { label: "Vault created", icon: "＋", color: "var(--accent)" },
  validated: {
    label: "Milestone validated",
    icon: "✓",
    color: "var(--success)",
  },
};

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
  const t = useT();
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
      <SectionHeader
        title={t("dashboard.atRisk.title", { count: atRiskVaults.length })}
      />
      <Text
        role="caption"
        as="p"
        style={{ color: "var(--danger)", margin: "0 0 1rem" }}
      >
        {t("dashboard.atRisk.description")}
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
  const t = useT();
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
          {t("dashboard.title")}
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
            {t("dashboard.connectPrompt.title")}
          </Text>
          <Text role="caption" as="p">
            {t("dashboard.connectPrompt.body")}
          </Text>
          <button type="button" onClick={() => void connect()}>
            {t("dashboard.connectPrompt.cta")}
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
          {t("dashboard.title")}
        </Text>
        <Text role="body" as="p" style={{ color: "var(--muted)", margin: 0 }}>
          {t("dashboard.subtitle")}
        </Text>
      </div>

      {/* ── Summary Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <SummaryCard
          label={t("dashboard.summary.totalLocked")}
          value={memoizedSummary.totalLocked}
          sub="USDC"
          accent
        />
        <SummaryCard
          label={t("dashboard.summary.activeVaults")}
          value={memoizedSummary.activeVaults}
        />
        <SummaryCard
          label={t("dashboard.summary.pendingMilestones")}
          value={memoizedSummary.pendingMilestones}
        />
        <SummaryCard
          label={t("dashboard.summary.completionRate")}
          value={memoizedSummary.completionRate}
          sub={t("dashboard.summary.allTime")}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "1.75rem",
        }}
      >
        <Link
          to="/vaults/create"
          style={{
            background: "var(--accent)",
            color: "var(--bg)",
            padding: "0.6rem 1.25rem",
            borderRadius: "var(--radius)",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          {t("dashboard.actions.createVault")}
        </Link>
        <Link
          to="/vaults"
          style={{
            background: "var(--surface)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            padding: "0.6rem 1.25rem",
            borderRadius: "var(--radius)",
            fontWeight: 500,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          {t("dashboard.actions.viewAllVaults")}
        </Link>
        <Link
          to="/verifier/queue"
          style={{
            background: "var(--surface)",
            color: "var(--warning)",
            border: "1px solid var(--warning)",
            padding: "0.6rem 1.25rem",
            borderRadius: "var(--radius)",
            fontWeight: 500,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          {t("dashboard.actions.verifyMilestone")}
        </Link>
      </div>

      {/* ── At Risk Vaults ── */}
      <AtRiskSection vaults={shownVaults} />

      {/* ── Main grid: vault list + sidebar ── */}
      <div className="dashboard-main-grid" style={{ gap: "1.25rem", alignItems: "start" }}>
        {/* Left column */}
        <div style={COL_STACK_STYLE}>
          {/* Vault Preview List */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1.25rem",
            }}
          >
            <SectionHeader
              title={t("dashboard.yourVaults.title")}
              action={t("dashboard.yourVaults.viewAll")}
              to="/vaults"
            />
            {viewStatus === "loading" && (
              <Text role="body" as="p" style={{ color: "var(--muted)" }}>
                <span role="status">{t("dashboard.yourVaults.loading")}</span>
              </Text>
            )}

            {viewStatus === "error" && (
              <div
                role="alert"
                style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--muted)" }}
              >
                <Text role="body" as="p">
                  {t("dashboard.yourVaults.error")}
                </Text>
                <button type="button" onClick={retryVaults}>
                  {t("dashboard.yourVaults.retry")}
                </button>
              </div>
            )}

            {viewStatus === "empty" && (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--muted)" }}>
                <div style={{ fontSize: 40, marginBottom: "0.75rem" }}>🔒</div>
                <Text
                  role="body"
                  as="div"
                  style={{ fontWeight: 600, marginBottom: 4 }}
                >
                  {t("dashboard.yourVaults.emptyTitle")}
                </Text>
                <Text role="caption" as="div" style={{ marginBottom: "1rem" }}>
                  {t("dashboard.yourVaults.emptyBody")}
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
                  {t("dashboard.yourVaults.emptyCta")}
                </Link>
              </div>
            )}

            {viewStatus === "data" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {rejectedCount > 0 && (
                  <Text role="caption" as="p" style={{ color: "var(--warning)", margin: 0 }}>
                    <span role="status">
                      {t("dashboard.yourVaults.unverifiedCount", {
                        count: rejectedCount,
                      })}
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
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1.25rem",
            }}
          >
            <SectionHeader title={t("dashboard.recentActivity.title")} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {memoizedActivity.map((a) => {
                const cfg = activityConfig(a.type);
                return (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.5rem 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: "var(--bg)",
                        border: `1px solid var(--border)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: cfg.color,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {cfg.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text role="caption" as="div" style={{ fontWeight: 600 }}>
                        {cfg.label} ·{" "}
                        <span
                          style={{ color: "var(--muted)", fontWeight: 400 }}
                        >
                          {a.vault}
                        </span>
                      </Text>
                      {a.formattedAmount != null && (
                        <Text
                          role="caption"
                          as="div"
                          style={{ color: "var(--muted)" }}
                        >
                          {a.formattedAmount}
                        </Text>
                      )}
                    </div>
                    <Text
                      role="caption"
                      as="span"
                      style={{ color: "var(--muted)", whiteSpace: "nowrap" }}
                    >
                      {a.relativeTime}
                    </Text>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={COL_STACK_STYLE}>
          <UpcomingDeadlines deadlines={safeDeadlines} vaults={shownFullVaults} />

          {/* Success Rate Chart (sparkline bars) */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1.25rem",
            }}
          >
            <SectionHeader title={t("dashboard.successRate.title")} />
            <Text
              role="caption"
              as="div"
              style={{ color: "var(--muted)", marginBottom: "0.75rem" }}
            >
              {t("dashboard.successRate.lastSixMonths")}
            </Text>
            <SuccessChart />
          </div>
        </div>
      </div>
    </div>
  );
}
