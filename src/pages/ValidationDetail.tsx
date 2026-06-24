import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Text } from '../components/Text';
import { useVerifierStore } from '../Zustand/Store';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { SafeLink } from '../components/SafeLink';

const tokenStyles = {
  mutedText: { color: 'var(--muted)' },
  surfacePanel: { background: 'var(--surface)', borderColor: 'var(--border)' },
  raisedPanel: { background: 'var(--surface-raised)', borderColor: 'var(--border)' },
  textPanel: { color: 'var(--text)' },
  primaryButton: { background: 'var(--accent)', color: 'var(--bg)' },
  successButton: { background: 'var(--success)', color: 'var(--bg)' },
  dangerButton: { background: 'var(--danger)', color: 'var(--bg)' },
  secondaryButton: { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--accent)' },
};

export default function ValidationDetail() {
  const { vaultId } = useParams<{ vaultId: string }>();
  const navigate = useNavigate();
  
  // Pull data and actions from Zustand
  const { pendingValidations, approveValidation, rejectValidation } = useVerifierStore();
  
  // Local state for notes and the confirmation modal
  const [notes, setNotes] = useState('');
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Find the specific task based on the URL parameter
  const task = pendingValidations.find((t) => t.id === vaultId);

  if (!task) {
    return (
      <div className="p-12 text-center flex flex-col items-center gap-4">
        <Text role="display" as="h2">Validation Not Found</Text>
        <Text role="body" as="p" style={tokenStyles.mutedText}>
          This validation task may have already been processed or doesn't exist.
        </Text>
        <button 
          onClick={() => navigate('/verifier/queue')}
          className="px-6 py-2 rounded transition"
          style={tokenStyles.primaryButton}
        >
          Return to Queue
        </button>
      </div>
    );
  }

  // Action Handlers
  const handleOpenModal = (action: 'approve' | 'reject') => {
    setConfirmAction(action);
    setIsModalOpen(true);
  };

  const executeAction = (decision: 'approve' | 'reject', modalNotes: string) => {
    if (decision === 'approve') {
      approveValidation(task.id, modalNotes);
    } else if (decision === 'reject') {
      rejectValidation(task.id, modalNotes);
    }
    setIsModalOpen(false);
    navigate('/verifier/queue'); // Send them back to the list
  };

  return (
    <div className="flex flex-col gap-6 p-6 relative">
      <header>
        <button 
          onClick={() => navigate('/verifier/queue')}
          className="mb-4 text-sm font-medium transition"
          style={tokenStyles.mutedText}
        >
          &larr; Back to Queue
        </button>
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <Text role="display" as="h1">Review Milestone</Text>
            <Text role="body" as="p" className="mt-1" style={tokenStyles.mutedText}>
              Task ID: {task.id}
            </Text>
          </div>
          <div
            className="px-4 py-2 rounded font-bold text-sm"
            style={{
              background: task.daysRemaining <= 3
                ? 'color-mix(in srgb, var(--danger) 12%, transparent)'
                : 'color-mix(in srgb, var(--success) 12%, transparent)',
              color: task.daysRemaining <= 3 ? 'var(--danger)' : 'var(--success)',
              border: `var(--border-width-1) solid ${task.daysRemaining <= 3 ? 'var(--danger)' : 'var(--success)'}`,
            }}
          >
            Deadline: {task.daysRemaining <= 3 ? 'Urgent, ' : ''}{task.daysRemaining} days remaining
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Evidence */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="p-6 border rounded-lg shadow-sm" style={tokenStyles.surfacePanel}>
            <Text role="display" as="h2" className="mb-4">Vault Summary</Text>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text role="body" as="p" className="text-sm" style={tokenStyles.mutedText}>Vault Name</Text>
                <Text role="body" as="p" className="font-medium">{task.vaultName}</Text>
              </div>
              <div>
                <Text role="body" as="p" className="text-sm" style={tokenStyles.mutedText}>Owner Wallet</Text>
                <span className="text-xs px-2 py-1 rounded font-mono block w-max mt-1" style={{ ...tokenStyles.raisedPanel, ...tokenStyles.textPanel }}>
                  {task.owner}
                </span>
              </div>
              <div>
                <Text role="body" as="p" className="text-sm" style={tokenStyles.mutedText}>Amount at Stake</Text>
                <Text role="body" as="p" className="font-bold" style={{ color: 'var(--success)' }}>{task.amount}</Text>
              </div>
              <div>
                <Text role="body" as="p" className="text-sm" style={tokenStyles.mutedText}>Deadline Date</Text>
                <Text role="body" as="p" className="font-medium">{task.deadline}</Text>
              </div>
            </div>
          </section>

          <section className="p-6 border rounded-lg shadow-sm" style={tokenStyles.surfacePanel}>
            <Text role="display" as="h2" className="mb-4">Milestone Evidence</Text>
            <div className="p-4 border rounded mb-4" style={tokenStyles.raisedPanel}>
              <Text role="body" as="p" className="font-bold">Target Milestone:</Text>
              <Text role="body" as="p" className="mt-1">{task.milestone}</Text>
            </div>
            
            <Text role="body" as="p" className="font-bold mb-2">Submitted Proof:</Text>
            {task.evidenceUrl ? (
              <SafeLink
                href={task.evidenceUrl}
                className="inline-block px-4 py-2 border rounded transition font-medium text-sm"
                style={tokenStyles.secondaryButton}
              >
                &#128279; View Attached Evidence
              </SafeLink>
            ) : (
              <Text role="body" as="p" className="italic" style={tokenStyles.mutedText}>No evidence link provided.</Text>
            )}
          </section>
        </div>

        {/* Right Column: Verification Actions */}
        <div className="flex flex-col gap-4">
          <section className="p-6 border rounded-lg shadow-sm flex flex-col h-full" style={tokenStyles.surfacePanel}>
            <Text role="display" as="h2" className="mb-4">Verification Actions</Text>
            
            <label className="flex flex-col gap-2 mb-6 flex-grow">
              <Text role="body" as="span" className="font-medium text-sm">Initial Verification Notes (Optional)</Text>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Start adding your review notes here..."
                className="w-full border rounded p-3 text-sm h-32 focus:ring-2 outline-none resize-none"
                style={{ ...tokenStyles.surfacePanel, color: 'var(--text)' }}
              />
            </label>

            <div className="flex flex-col gap-3 mt-auto">
              <button 
                onClick={() => handleOpenModal('approve')}
                className="w-full py-3 font-bold rounded transition"
                style={tokenStyles.successButton}
              >
                Approve Milestone
              </button>
              <button 
                onClick={() => handleOpenModal('reject')}
                className="w-full py-3 font-bold rounded transition"
                style={tokenStyles.dangerButton}
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
