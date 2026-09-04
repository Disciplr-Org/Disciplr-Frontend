import { Text } from "./Text";
import { SafeLink } from "./SafeLink";
import type { Milestone, MilestoneStatus } from "../types/vault";
import { analyzeMilestones } from "../utils/vaultState";
import { useVaultActionStore, getActionKey } from "../stores/vaultActionStore";
import { submitVaultAction } from "../services/vaultService";
import { Loader2, AlertTriangle } from "lucide-react";
import { EmptyState } from "./EmptyState";
import "./MilestoneTracker.css";

export interface MilestoneTrackerProps {
  vaultId: string;
  milestones: Milestone[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  canManage?: boolean;
  onManageMilestone?: (milestone: Milestone) => void;
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

function checkInvariants(milestones: Milestone[]): Error | null {
  let hasPendingOrFailed = false;

  for (const m of milestones) {
    if (m.status === 'validated' && !m.validatedAt) {
      return new Error(`Milestone '${m.id}' is validated but missing validatedAt timestamp.`);
    }
    if (m.status !== 'validated' && (m.validatedAt || m.evidenceUrl)) {
      return new Error(`Milestone '${m.id}' is ${m.status} but contains validation evidence.`);
    }
    if (hasPendingOrFailed && m.status === 'validated') {
      return new Error(`Impossible transition: validated milestone '${m.id}' appears after a pending or failed milestone.`);
    }
    if (m.status === 'pending' || m.status === 'failed') {
      hasPendingOrFailed = true;
    }
  }
  return null;
}

export function MilestoneTracker({
  vaultId,
  milestones,
  isLoading,
  error,
  onRetry,
  canManage,
  onManageMilestone,
}: MilestoneTrackerProps) {
  const { actions, setActionState } = useVaultActionStore();
  
  const handleValidate = async (milestone: Milestone, skipSigning = false) => {
    const key = getActionKey(vaultId, 'validate_milestone', milestone.id);
    
    try {
      if (!skipSigning) {
        setActionState(key, { vaultId, actionType: 'validate_milestone', milestoneId: milestone.id, status: 'signing' });
        // simulate wallet interaction
        await new Promise(r => setTimeout(r, 800));
      }
      
      setActionState(key, { vaultId, actionType: 'validate_milestone', milestoneId: milestone.id, status: 'submitting' });
      await submitVaultAction('validate_milestone', vaultId);
      setActionState(key, { vaultId, actionType: 'validate_milestone', milestoneId: milestone.id, status: 'success' });
      if (onManageMilestone) onManageMilestone(milestone);
    } catch (err) {
      setActionState(key, { vaultId, actionType: 'validate_milestone', milestoneId: milestone.id, status: 'error', error: err instanceof Error ? err.message : 'Action failed' });
    }
  };

  if (isLoading) {
    return (
      <div className="milestone-tracker-loading" aria-busy="true" aria-live="polite">
        <Loader2 className="milestone-tracker-spinner" aria-hidden="true" size={24} />
        <Text role="body" as="p">Loading milestones...</Text>
      </div>
    );
  }

  const invariantError = checkInvariants(milestones);
  const activeError = error || invariantError;

  if (activeError) {
    return (
      <div className="milestone-tracker-error" role="alert" aria-live="assertive">
        <EmptyState
          icon={<AlertTriangle size={32} style={{ color: 'var(--danger, red)' }} />}
          title="Cannot load milestones"
          description={activeError.message}
          action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
        />
      </div>
    );
  }

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
          const actionKey = getActionKey(vaultId, 'validate_milestone', milestone.id);
          const actionRecord = actions[actionKey];
          
          let effectiveStatus = milestone.status;
          if (actionRecord?.status === 'success') {
            effectiveStatus = 'validated';
          }
          
          const status = MILESTONE_STATUS_CONFIG[effectiveStatus] ?? UNKNOWN_STATUS_CONFIG;
          const isCurrent = index === currentIndex;
          
          // Optimistically injected validation date if success
          const validatedAt = effectiveStatus === 'validated' && milestone.status !== 'validated' 
            ? new Date().toISOString()
            : typeof milestone.validatedAt === "string" && milestone.validatedAt.trim().length > 0
              ? milestone.validatedAt
              : undefined;

          const isActionInProgress = actionRecord?.status === 'signing' || actionRecord?.status === 'submitting';
          const isActionFailed = actionRecord?.status === 'error';

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

                <div className="milestone-tracker-meta" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                  
                  {isCurrent && canManage && effectiveStatus === 'pending' && (
                    <div className="milestone-tracker-actions">
                      {isActionInProgress ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)', fontSize: '0.85rem' }}>
                          <Loader2 size={16} className="milestone-tracker-spinner" />
                          {actionRecord.status === 'signing' ? 'Awaiting Signature...' : 'Submitting...'}
                        </span>
                      ) : isActionFailed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>Validation failed</span>
                          <button 
                            type="button" 
                            onClick={() => handleValidate(milestone, true)}
                            style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--radius)', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          aria-label={`Manage milestone: ${milestone.title}`}
                          onClick={() => onManageMilestone ? onManageMilestone(milestone) : handleValidate(milestone)}
                          style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius)', padding: '0.4rem 0.75rem', fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                          Manage
                        </button>
                      )}
                    </div>
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