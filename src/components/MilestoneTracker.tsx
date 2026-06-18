import './MilestoneTracker.css';
import { Text } from './Text';

export type MilestoneStatus = 'pending' | 'validated' | 'failed';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  criteria: string;
  status: MilestoneStatus;
  validatedAt?: string;
  evidenceUrl?: string;
}

export interface MilestoneTrackerProps {
  milestones: Milestone[];
}

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'var(--warning)' },
  validated: { label: 'Validated', color: 'var(--success)' },
  failed: { label: 'Failed', color: 'var(--danger)' },
};

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCurrentStepIndex(milestones: Milestone[]): number {
  const lastValidatedIndex = milestones.reduce((index, milestone, currentIndex) => {
    return milestone.status === 'validated' ? currentIndex : index;
  }, -1);

  return milestones.findIndex(
    (milestone, index) => index > lastValidatedIndex && milestone.status === 'pending',
  );
}

export default function MilestoneTracker({ milestones }: MilestoneTrackerProps) {
  if (milestones.length === 0) {
    return <p className="milestone-tracker__empty">No milestones available.</p>;
  }

  const currentStepIndex = getCurrentStepIndex(milestones);

  return (
    <ol className="milestone-tracker">
      {milestones.map((milestone, index) => {
        const statusCfg = STATUS_CONFIG[milestone.status];
        const current = index === currentStepIndex && currentStepIndex !== -1;

        return (
          <li
            key={milestone.id}
            className="milestone-tracker__item"
            aria-current={current ? 'step' : undefined}
            style={{ borderLeftColor: statusCfg.color }}
          >
            <div className="milestone-tracker__header">
              <Text role="body" as="span" className="milestone-tracker__title">
                {index + 1}. {milestone.title}
              </Text>
              <span
                className="milestone-tracker__badge"
                style={{ color: statusCfg.color }}
              >
                {statusCfg.label}
              </span>
            </div>
            <Text role="caption" as="p" className="milestone-tracker__text">
              {milestone.description}
            </Text>
            <Text role="caption" as="p" className="milestone-tracker__text">
              <strong>Criteria:</strong> {milestone.criteria}
            </Text>
            {milestone.validatedAt && (
              <Text role="caption" as="p" className="milestone-tracker__validated">
                Validated {fmtDateTime(milestone.validatedAt)}
              </Text>
            )}
            {milestone.evidenceUrl && (
              <a
                href={milestone.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="milestone-tracker__link"
              >
                View evidence ↗
              </a>
            )}
          </li>
        );
      })}
    </ol>
  );
}
