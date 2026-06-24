import { Text } from './Text';
import type { ValidationTask } from '../Zustand/Store';
import { computeVerifierMetrics } from '../utils/verifierMetrics';

interface VerifierMetricsProps {
  pendingValidations: ValidationTask[];
  validationHistory: ValidationTask[];
}

export function VerifierMetrics({
  pendingValidations,
  validationHistory,
}: VerifierMetricsProps) {
  const metrics = computeVerifierMetrics(pendingValidations, validationHistory);
  const cards = [
    {
      label: 'Approval Rate',
      value: `${metrics.approvalRate}%`,
      detail: `${metrics.approvedResolved} approved of ${metrics.totalResolved} resolved`,
      color: 'var(--success)',
    },
    {
      label: 'Total Resolved',
      value: metrics.totalResolved.toString(),
      detail: `${metrics.rejectedResolved} rejected validations included`,
      color: 'var(--info)',
    },
    {
      label: 'Urgent Pending',
      value: metrics.urgentPending.toString(),
      detail: 'Pending validations due in 3 days or less',
      color: 'var(--warning)',
    },
    {
      label: 'Overdue Pending',
      value: metrics.overduePending.toString(),
      detail: 'Pending validations due today or already past due',
      color: 'var(--danger)',
    },
  ];

  return (
    <section
      aria-label="Verifier performance metrics"
      className="grid grid-cols-1 md:grid-cols-4 gap-4"
    >
      {cards.map((card) => (
        <article
          key={card.label}
          aria-label={`${card.label}: ${card.value}. ${card.detail}`}
          className="p-5 border rounded-lg shadow-sm"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            borderLeft: `var(--border-width-4) solid ${card.color}`,
          }}
        >
          <Text role="body" as="p" className="mb-2" style={{ color: 'var(--muted)' }}>
            {card.label}
          </Text>
          <Text role="display" as="h2" style={{ color: card.color }}>
            {card.value}
          </Text>
          <Text role="caption" as="p" className="mt-2" style={{ color: 'var(--muted)' }}>
            {card.detail}
          </Text>
        </article>
      ))}
    </section>
  );
}
