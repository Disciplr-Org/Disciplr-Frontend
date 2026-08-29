import { useMemo } from "react";
import { Text } from "./Text";
import { SafeLink } from "./SafeLink";
import { logger } from "../utils/logger";
import type { Milestone, MilestoneStatus } from "../types/vault";
import "./MilestoneTracker.css";

export interface MilestoneTrackerProps {
  milestones: Milestone[];
}

/**
 * Explicit rendering bounds for the milestone tracker.
 *
 * These constants define the feature's invariants for adversarial inputs:
 * - `MAX_MILESTONES_RENDERED` caps DOM nodes and layout cost.
 * - Text-length bounds prevent unbounded string rendering from hostile data.
 * - `MAX_EVIDENCE_URL_LENGTH` bounds the URL we hand to SafeLink.
 */
export const MAX_MILESTONES_RENDERED = 50;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_CRITERIA_LENGTH = 500;
export const MAX_EVIDENCE_URL_LENGTH = 2048;

const MILESTONE_STATUS_CONFIG: Record<
  MilestoneStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "is-pending" },
  validated: { label: "Validated", className: "is-validated" },
  failed: { label: "Failed", className: "is-failed" },
};

function formatValidatedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Truncate a string to `max` characters, appending an ellipsis when cut. */
function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}\u2026`;
}

/**
 * Validate milestone invariants and emit structured diagnostics for any
 * violation. Returns a sanitized copy of the milestone.
 *
 * Invariants enforced:
 * - `validated` milestones must carry a `validatedAt` timestamp.
 * - `pending` / `failed` milestones must NOT carry a `validatedAt` timestamp.
 * - Text fields are bounded by the constants above.
 */
function sanitizeMilestone(milestone: Milestone, index: number): Milestone {
  const violations: string[] = [];

  if (milestone.status === "validated" && !milestone.validatedAt) {
    violations.push("validated-missing-validatedAt");
  }
  if (milestone.status !== "validated" && milestone.validatedAt) {
    violations.push("non-validated-has-validatedAt");
  }
  if (milestone.title.length > MAX_TITLE_LENGTH) {
    violations.push("title-overflow");
  }
  if (milestone.description.length > MAX_DESCRIPTION_LENGTH) {
    violations.push("description-overflow");
  }
  if (milestone.criteria.length > MAX_CRITERIA_LENGTH) {
    violations.push("criteria-overflow");
  }
  if (milestone.evidenceUrl && milestone.evidenceUrl.length > MAX_EVIDENCE_URL_LENGTH) {
    violations.push("evidence-url-overflow");
  }

  if (violations.length > 0) {
    logger.warn("[MilestoneTracker] milestone invariant violation", {
      milestoneId: milestone.id,
      index,
      violations,
    });
  }

  return {
    ...milestone,
    title: truncate(milestone.title, MAX_TITLE_LENGTH),
    description: truncate(milestone.description, MAX_DESCRIPTION_LENGTH),
    criteria: truncate(milestone.criteria, MAX_CRITERIA_LENGTH),
    evidenceUrl:
      milestone.evidenceUrl && milestone.evidenceUrl.length > MAX_EVIDENCE_URL_LENGTH
        ? milestone.evidenceUrl.slice(0, MAX_EVIDENCE_URL_LENGTH)
        : milestone.evidenceUrl,
  };
}

export function MilestoneTracker({ milestones }: MilestoneTrackerProps) {
  const { boundedMilestones, truncated } = useMemo(() => {
    const total = milestones.length;
    const bounded = milestones.slice(0, MAX_MILESTONES_RENDERED);
    if (total > MAX_MILESTONES_RENDERED) {
      logger.warn("[MilestoneTracker] milestone list truncated", {
        total,
        rendered: MAX_MILESTONES_RENDERED,
      });
    }
    return {
      boundedMilestones: bounded.map(sanitizeMilestone),
      truncated: total > MAX_MILESTONES_RENDERED,
    };
  }, [milestones]);

  if (boundedMilestones.length === 0) {
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

  const currentIndex = boundedMilestones.findIndex(
    (milestone) => milestone.status === "pending",
  );

  return (
    <ol className="milestone-tracker" aria-label="Vault milestone progress">
      {boundedMilestones.map((milestone, index) => {
        const status = MILESTONE_STATUS_CONFIG[milestone.status];
        const isCurrent = index === currentIndex;

        return (
          <li
            key={milestone.id}
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
                {milestone.validatedAt && (
                  <Text
                    role="caption"
                    as="span"
                    className="milestone-tracker-validated-at"
                  >
                    Validated {formatValidatedAt(milestone.validatedAt)}
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
      {truncated && (
        <li className="milestone-tracker-step" aria-hidden="true">
          <div className="milestone-tracker-content">
            <Text role="caption" as="p" className="milestone-tracker-copy">
              {milestones.length - MAX_MILESTONES_RENDERED} additional
              milestone(s) not shown.
            </Text>
          </div>
        </li>
      )}
    </ol>
  );
}
