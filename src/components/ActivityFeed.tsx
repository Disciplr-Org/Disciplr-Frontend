import { Text } from "./Text";
import type { Activity, FormattedActivity } from "../utils/dashboard";

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
    color: "var(--info)",
  },
  redirected: { label: "Funds redirected", icon: "→", color: "var(--warning)" },
};

type ActivityConfig = (typeof ACTIVITY_CFG)[Activity["type"]];

/**
 * `activity` is a caller-supplied prop, so a type outside the union (a
 * forward-compatible backend value, or a JS caller passing junk) must not
 * dereference `undefined` and blank the page. Unrecognised types render with a
 * neutral fallback instead.
 */
const ACTIVITY_FALLBACK_CFG: ActivityConfig = {
  label: "Vault activity",
  icon: "•",
  color: "var(--muted)",
};

/**
 * Own-property lookup so a hostile type such as "__proto__" resolves to the
 * fallback rather than to `Object.prototype` (mirrors lookupVaultSafe).
 */
function activityConfig(type: string): ActivityConfig {
  return Object.prototype.hasOwnProperty.call(ACTIVITY_CFG, type)
    ? ACTIVITY_CFG[type as Activity["type"]]
    : ACTIVITY_FALLBACK_CFG;
}

export interface ActivityFeedProps {
  activity: FormattedActivity[];
}

export default function ActivityFeed({ activity }: ActivityFeedProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <Text role="body" as="h2" style={{ margin: 0, fontWeight: 600 }}>
          Recent Activity
        </Text>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {activity.map((a) => {
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
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>
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
  );
}
