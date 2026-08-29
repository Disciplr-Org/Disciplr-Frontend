import { Text } from "./Text";
import { SafeLink } from "./SafeLink";
import type { Milestone, MilestoneStatus } from "../types/vault";
import { analyzeMilestones } from "../utils/vaultState";
import "./MilestoneTracker.css";

export interface MilestoneTrackerProps {
  milestones: Milestone[];
}

const MILESTONE_STATUS_CONFIG: Record<
  MilestoneStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "is-pending" },
  validated: { label: "Validated", className: "is-validated" },
  failed: { label: "Failed", className: "is-failed" },
};

const UNKNOWN_STATUS_CONFIG = { label: "Unknown status", className: "is-invalid" };

function formatValidatedAt(iso: string): string {
  const parsed = new Date(iso);
  if (!Number.isFinite(parsed.getTime())) {
    // Hostile/tampered timestamp: never synthesize a date from garbage.
    return "Unknown";
  }
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MilestoneTracker({ milestones }: MilestoneTrackerProps) {
  if (milestones.length === 0) {
    return (
      <Text
        role="body"
        as="p"
        className="milestone-tracker-empty"
        aria-live="polite"
      >
        No milestones have been defined for this vault.
      </Text>
    );
  }

  const { currentIndex, anomalies } = analyzeMilestones(milestones);

  return (
    <>
      {anomalies.length > 0 && (
        <div
          role="status"
          className="milestone-tracker-anomalies"
          aria-label="Milestone data inconsistency notice"
        >
          <Text role="caption" as="p" className="milestone-tracker-anomaly-title">
            Milestone progress contains inconsistent data:
          </Text>
          <ul className="milestone-tracker-anomaly-list">
            {anomalies.map((anomaly) => (
              <li key={`${anomaly.kind}-${anomaly.index}`}>{anomaly.message}</li>
            ))}
          </ul>
        </div>
      )}
      <ol className="milestone-tracker" aria-label="Vault milestone progress">
        {milestones.map((milestone, index) => {
          const status =
            MILESTONE_STATUS_CONFIG[milestone.status] ?? UNKNOWN_STATUS_CONFIG;
          const isCurrent = index === currentIndex;
          const validatedAt =
            typeof milestone.validatedAt === "string" &&
            milestone.validatedAt.trim().length > 0
              ? milestone.validatedAt
              : undefined;

          return (
            <li
              key={`${milestone.id ?? ""}-${index}`}
              className={`milestone-tracker-step ${status.className}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="milestone-tracker-marker" aria-hidden="true">
                {index + 1}
              </div>
              <div className="milestone-tracker-content">
                <div className="milestone-tracker-header">
                  <Text role="body" as="h3" className="milestone-tracker-title">
                    {milestone.title}
                  </Text>
                  <span className="milestone-tracker-badge">{status.label}</span>
                </div>

                <Text role="caption" as="p" className="milestone-tracker-copy">
                  {milestone.description}
                </Text>
                <Text role="caption" as="p" className="milestone-tracker-copy">
                  <strong>Criteria:</strong> {milestone.criteria}
                </Text>

                <div className="milestone-tracker-meta">
                  {validatedAt && (
                    <Text
                      role="caption"
                      as="span"
                      className="milestone-tracker-validated-at"
                    >
                      Validated {formatValidatedAt(validatedAt)}
                    </Text>
                  )}
                  {milestone.evidenceUrl && (
                    <SafeLink
                      className="milestone-tracker-evidence"
                      href={milestone.evidenceUrl}
                    >
                      View evidence
                    </SafeLink>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}