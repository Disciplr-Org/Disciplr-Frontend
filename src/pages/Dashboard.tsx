import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'
import { Text } from '../components/Text';
import VaultCard from '../components/VaultCard';
import { vaultService } from '../services/vaultService';
import type {
  DashboardActivity as Activity,
  DashboardDeadline as Deadline,
  DashboardSummary,
  VaultPreview,
} from '../types/vault';

// ── Helpers ───────────────────────────────────────────────────────────────────
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
  released: {
    label: "Funds released",
    icon: "↑",
    color: "var(--info, #60A5FA)",
  },
  redirected: { label: "Funds redirected", icon: "→", color: "var(--warning)" },
};

function daysRemaining(deadline: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000),
  );
}

function urgencyColor(days: number): string {
  if (days <= 7) return "var(--danger)";
  if (days <= 30) return "var(--warning)";
  return "var(--success)";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <Text
        role="caption"
        as="div"
        style={{
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </Text>
      <Text
        role="title"
        as="div"
        style={{
          color: accent ? "var(--accent)" : "var(--text)",
          fontWeight: 700,
        }}
      >
        {value}
      </Text>
      {sub && (
        <Text role="caption" as="div" style={{ color: "var(--muted)" }}>
          {sub}
        </Text>
      )}
    </div>
  );
}

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

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary>(() =>
    vaultService.getDashboardSummarySnapshot(),
  );
  const [vaults, setVaults] = useState<VaultPreview[]>(() =>
    vaultService.listDashboardVaultsSnapshot(),
  );
  const [activity, setActivity] = useState<Activity[]>(() =>
    vaultService.listDashboardActivitySnapshot(),
  );
  const [deadlines, setDeadlines] = useState<Deadline[]>(() =>
    vaultService.listDashboardDeadlinesSnapshot(),
  );

  useEffect(() => {
    let active = true;

    Promise.all([
      vaultService.getDashboardSummary(),
      vaultService.listDashboardVaults(),
      vaultService.listDashboardActivity(),
      vaultService.listDashboardDeadlines(),
    ]).then(([nextSummary, nextVaults, nextActivity, nextDeadlines]) => {
      if (!active) return;
      setSummary(nextSummary);
      setVaults(nextVaults);
      setActivity(nextActivity);
      setDeadlines(nextDeadlines);
    });

    return () => {
      active = false;
    };
  }, []);

  const hasVaults = vaults.length > 0;

  return (
    <div
      style={{
        maxWidth: "var(--container-wide)",
        margin: "0 auto",
        padding: "0 0 3rem",
      }}
    >
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <SummaryCard
          label="Total Locked"
          value={`$${summary.totalLocked.toLocaleString()}`}
          sub="USDC"
          accent
        />
        <SummaryCard
          label="Active Vaults"
          value={String(summary.activeVaults)}
        />
        <SummaryCard
          label="Pending Milestones"
          value={String(summary.pendingMilestones)}
        />
        <SummaryCard
          label="Completion Rate"
          value={`${summary.completionRate}%`}
          sub="all time"
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
          + Create Vault
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
          View All Vaults
        </Link>
        <button
          style={{
            background: "var(--surface)",
            color: "var(--warning)",
            border: "1px solid var(--warning)",
            padding: "0.6rem 1.25rem",
            borderRadius: "var(--radius)",
            fontWeight: 500,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Verify Milestone
        </button>
      </div>

      {/* ── Main grid: vault list + sidebar ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0,340px)",
          gap: "1.25rem",
          alignItems: "start",
        }}
      >
        {/* Left column */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
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
              title="Active Vaults"
              action="View all →"
              to="/vaults"
            />
            {hasVaults ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {vaults.map(v => (
                  <VaultCard
                    key={v.id}
                    id={v.id}
                    name={v.name}
                    amount={v.amount}
                    currency={v.currency}
                    status={v.status}
                    deadline={v.deadline}
                    progressPct={v.progressPct}
                  />
                ))}
              </div>
            ) : (
              /* Empty state */
              <div
                style={{
                  textAlign: "center",
                  padding: "2.5rem 1rem",
                  color: "var(--muted)",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: "0.75rem" }}>🔒</div>
                <Text
                  role="body"
                  as="div"
                  style={{ fontWeight: 600, marginBottom: 4 }}
                >
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
            <SectionHeader title="Recent Activity" />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {activity.map((a) => {
                const cfg = ACTIVITY_CFG[a.type];
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
                      {a.amount != null && (
                        <Text
                          role="caption"
                          as="div"
                          style={{ color: "var(--muted)" }}
                        >
                          {a.amount.toLocaleString()} USDC
                        </Text>
                      )}
                    </div>
                    <Text
                      role="caption"
                      as="span"
                      style={{ color: "var(--muted)", whiteSpace: "nowrap" }}
                    >
                      {relativeTime(a.timestamp)}
                    </Text>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* Upcoming Deadlines */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1.25rem",
            }}
          >
            <SectionHeader title="Upcoming Deadlines" />
            {deadlines.length === 0 ? (
              <Text role="caption" as="div" style={{ color: "var(--muted)" }}>
                No upcoming deadlines.
              </Text>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {deadlines.map((d) => {
                  const days = daysRemaining(d.deadline);
                  const color = urgencyColor(days);
                  return (
                    <div
                      key={d.id}
                      style={{
                        background: "var(--bg)",
                        border: `1px solid var(--border)`,
                        borderLeft: `3px solid ${color}`,
                        borderRadius: "var(--radius)",
                        padding: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Text
                          role="caption"
                          as="div"
                          style={{ fontWeight: 600 }}
                        >
                          {d.name}
                        </Text>
                        <span
                          style={{
                            color,
                            fontSize: 12,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {days === 0 ? "Today" : `${days}d`}
                        </span>
                      </div>
                      <Text
                        role="caption"
                        as="div"
                        style={{ color: "var(--muted)", marginTop: 2 }}
                      >
                        {d.amount.toLocaleString()} USDC ·{" "}
                        {new Date(d.deadline).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Success Rate Chart (sparkline bars) */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1.25rem",
            }}
          >
            <SectionHeader title="Success Rate" />
            <Text
              role="caption"
              as="div"
              style={{ color: "var(--muted)", marginBottom: "0.75rem" }}
            >
              Last 6 months
            </Text>
            <SuccessChart />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Success Rate Sparkline ────────────────────────────────────────────────────
const CHART_DATA = [
  { month: "Nov", rate: 50 },
  { month: "Dec", rate: 60 },
  { month: "Jan", rate: 55 },
  { month: "Feb", rate: 75 },
  { month: "Mar", rate: 70 },
  { month: "Apr", rate: 67 },
];

function SuccessChart() {
  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 64 }}
    >
      {CHART_DATA.map((d) => (
        <div
          key={d.month}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              width: "100%",
              height: `${d.rate * 0.64}px`,
              background: "var(--accent-transparent)",
              border: "1px solid var(--accent)",
              borderRadius: 3,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: `${d.rate}%`,
                background: "var(--accent)",
                borderRadius: 2,
                opacity: 0.7,
              }}
            />
          </div>
          <Text
            role="caption"
            as="span"
            style={{ color: "var(--muted)", fontSize: 10 }}
          >
            {d.month}
          </Text>
        </div>
      ))}
    </div>
  );
}
