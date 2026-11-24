import { Text } from "./Text";

export interface FormattedDashboardSummary {
  totalLocked: string;
  activeVaults: string;
  pendingMilestones: string;
  completionRate: string;
}

export interface SummaryCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

export function SummaryCard({
  label,
  value,
  sub,
  accent,
}: SummaryCardProps) {
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

export interface SummaryCardsProps {
  summary: FormattedDashboardSummary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
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
        value={summary.totalLocked}
        sub="USDC"
        accent
      />
      <SummaryCard
        label="Active Vaults"
        value={summary.activeVaults}
      />
      <SummaryCard
        label="Pending Milestones"
        value={summary.pendingMilestones}
      />
      <SummaryCard
        label="Completion Rate"
        value={summary.completionRate}
        sub="all time"
      />
    </div>
  );
}
