import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Text } from '../components/Text';
import { useVerifierStore } from '../Zustand/Store';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { SafeLink } from '../components/SafeLink';
import { isCriteriaGateOpen } from '../utils/criteriaGate';
import { classifyEvidenceUrl } from '../utils/evidenceKind';

export default function ValidationDetail() {
  const { vaultId } = useParams<{ vaultId: string }>();
  const navigate = useNavigate();
  
  const { pendingValidations, approveValidation, rejectValidation } = useVerifierStore();
  
  const [notes, setNotes] = useState('');
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkedCriteria, setCheckedCriteria] = useState<Set<number>>(new Set());

  const task = pendingValidations.find((t) => t.id === vaultId);

  if (!task) {
    return (
      <div className="p-12 text-center flex flex-col items-center gap-4">
        <Text role="display" as="h2">Validation Not Found</Text>
        <Text role="body" as="p" style={{ color: 'var(--muted)' }}>
          This validation task may have already been processed or doesn't exist.
        </Text>
        <button
          onClick={() => navigate('/verifier/queue')}
          className="px-6 py-2 rounded transition font-medium"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          Return to Queue
        </button>
      </div>
    );
  }

  const handleOpenModal = (action: 'approve' | 'reject') => {
    setConfirmAction(action);
    setIsModalOpen(true);
  };

  const toggleCriterion = (index: number) => {
    setCheckedCriteria((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const gateOpen = isCriteriaGateOpen(task.criteria, checkedCriteria);

  const executeAction = (decision: 'approve' | 'reject', modalNotes: string) => {
    if (decision === 'approve') {
      approveValidation(task.id, modalNotes);
    } else if (decision === 'reject') {
      rejectValidation(task.id, modalNotes);
    }
    setIsModalOpen(false);
    navigate('/verifier/queue');
  };

  return (
    <div className="flex flex-col gap-6 p-6 relative">
      <header>
        <button
          onClick={() => navigate('/verifier/queue')}
          className="mb-4 text-sm font-medium transition"
          style={{ color: 'var(--muted)' }}
        >
          &larr; Back to Queue
        </button>
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <Text role="display" as="h1">Review Milestone</Text>
            <Text role="body" as="p" className="mt-1" style={{ color: 'var(--muted)' }}>
              Task ID: {task.id}
            </Text>
          </div>
          <div
            className="px-4 py-2 rounded font-bold text-sm"
            style={{
              background: task.daysRemaining <= 3 ? 'var(--danger-transparent)' : 'var(--success-transparent)',
              color: task.daysRemaining <= 3 ? 'var(--danger)' : 'var(--success)',
            }}
          >
            Deadline: {task.daysRemaining} days remaining
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="p-6 border rounded-lg shadow-sm" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
            <Text role="display" as="h2" className="mb-4">Vault Summary</Text>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text role="body" as="p" className="text-sm" style={{ color: 'var(--muted)' }}>Vault Name</Text>
                <Text role="body" as="p" className="font-medium">{task.vaultName}</Text>
              </div>
              <div>
                <Text role="body" as="p" className="text-sm" style={{ color: 'var(--muted)' }}>Owner Wallet</Text>
                <span className="text-xs px-2 py-1 rounded font-mono block w-max mt-1" style={{ background: 'var(--surface-raised)', color: 'var(--text)' }}>
                  {task.owner}
                </span>
              </div>
              <div>
                <Text role="body" as="p" className="text-sm" style={{ color: 'var(--muted)' }}>Amount at Stake</Text>
                <Text role="body" as="p" className="font-bold" style={{ color: 'var(--success)' }}>{task.amount}</Text>
              </div>
              <div>
                <Text role="body" as="p" className="text-sm" style={{ color: 'var(--muted)' }}>Deadline Date</Text>
                <Text role="body" as="p" className="font-medium">{task.deadline}</Text>
              </div>
            </div>
          </section>

          <section className="p-6 border rounded-lg shadow-sm" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
            <Text role="display" as="h2" className="mb-4">Milestone Evidence</Text>
            <div className="p-4 border rounded mb-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <Text role="body" as="p" className="font-bold">Target Milestone:</Text>
              <Text role="body" as="p" className="mt-1">{task.milestone}</Text>
            </div>
            
            <Text role="body" as="p" className="font-bold mb-2">Submitted Proof:</Text>
            {task.evidenceUrl ? (
              <div className="p-4 border rounded-lg" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3 mb-3">
                  {(() => {
                    const info = classifyEvidenceUrl(task.evidenceUrl);
                    if (!info) return null;
                    const kindLabels: Record<typeof info.kind, string> = {
                      github: 'GitHub',
                      figma: 'Figma',
                      ipfs: 'IPFS',
                      other: 'Other'
                    };
                    const kindColors: Record<typeof info.kind, { bg: string; color: string }> = {
                      github: { bg: 'color-mix(in srgb, #24292e 10%, transparent)', color: '#24292e' },
                      figma: { bg: 'color-mix(in srgb, #f24e1e 10%, transparent)', color: '#f24e1e' },
                      ipfs: { bg: 'color-mix(in srgb, #65c3cb 10%, transparent)', color: '#65c3cb' },
                      other: { bg: 'color-mix(in srgb, var(--muted) 10%, transparent)', color: 'var(--muted)' }
                    };
                    const colors = kindColors[info.kind];
                    return (
                      <>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.color}` }}
                        >
                          {kindLabels[info.kind]}
                        </span>
                        <Text role="body" as="span" className="text-sm" style={{ color: 'var(--muted)' }}>
                          {info.host}
                        </Text>
                      </>
                    );
                  })()}
                </div>
                <SafeLink
                  href={task.evidenceUrl}
                  className="inline-block px-4 py-2 border rounded transition font-medium text-sm"
                  style={{
                    borderColor: 'var(--accent)',
                    color: 'var(--accent)',
                    background: 'var(--accent-transparent)',
                  }}
                >
                  &#128279; View Attached Evidence
                </SafeLink>
              </div>
            ) : (
              <Text role="body" as="p" className="italic" style={{ color: 'var(--muted)' }}>No evidence link provided.</Text>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="p-6 border rounded-lg shadow-sm flex flex-col h-full" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
            <Text role="display" as="h2" className="mb-4">Verification Actions</Text>

            {task.criteria && task.criteria.length > 0 && (
              <fieldset className="mb-6 flex flex-col gap-2">
                <legend className="font-medium text-sm mb-2">
                  <Text role="body" as="span">Milestone Criteria</Text>
                </legend>
                {task.criteria.map((criterion, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-2 text-sm cursor-pointer"
                    style={{ color: 'var(--text)' }}
                  >
                    <input
                      type="checkbox"
                      checked={checkedCriteria.has(i)}
                      onChange={() => toggleCriterion(i)}
                      aria-label={criterion}
                      className="mt-0.5 accent-[var(--accent)] shrink-0"
                    />
                    {criterion}
                  </label>
                ))}
              </fieldset>
            )}
            
            <label className="flex flex-col gap-2 mb-6 flex-grow">
              <Text role="body" as="span" className="font-medium text-sm">Initial Verification Notes (Optional)</Text>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Start adding your review notes here..."
                className="w-full rounded p-3 text-sm h-32 outline-none resize-none"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                }}
              />
            </label>

            <div className="flex flex-col gap-3 mt-auto">
              <button
                onClick={() => handleOpenModal('approve')}
                disabled={!gateOpen}
                aria-disabled={!gateOpen}
                className="w-full py-3 font-bold rounded transition"
                style={{
                  background: gateOpen ? 'var(--success)' : 'var(--muted)',
                  color: 'white',
                  cursor: gateOpen ? 'pointer' : 'not-allowed',
                  opacity: gateOpen ? 1 : 0.5,
                }}
              >
                Approve Milestone
              </button>
              <button
                onClick={() => handleOpenModal('reject')}
                className="w-full py-3 font-bold rounded transition"
                style={{ background: 'var(--danger)', color: 'white' }}
              >
                Reject Milestone
              </button>
            </div>
          </section>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={executeAction}
        initialDecision={confirmAction || undefined}
        initialNotes={notes}
        evidenceUrl={task.evidenceUrl}
      />
    </div>
  );
}
