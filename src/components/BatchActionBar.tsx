import { useCallback, useState } from 'react';
import { ConfirmationModal } from './ConfirmationModal';
import { Text } from './Text';
import { MAX_BATCH_NOTES_LENGTH } from '../utils/batchNotes';

type BatchDecision = 'approve' | 'reject';

type BatchActionHandler = (notes: string) => boolean | Promise<boolean> | void;

export interface BatchActionBarProps {
  /** Number of validations currently selected for the batch action. */
  selectedCount: number;
  /** Called with the (trimmed) verification notes when the user confirms an approval. */
  onApprove: BatchActionHandler;
  /** Called with the (trimmed) verification notes when the user confirms a rejection. */
  onReject: BatchActionHandler;
  /** Disables the bar's actions, e.g. while another action is in flight. */
  disabled?: boolean;
  /** True while a batch action is being submitted. */
  isSubmitting?: boolean;
  /** Error surfaced by the parent (store/batch failures). */
  error?: string | null;
}

/**
 * Sticky batch action bar plus its confirmation modal.
 *
 * Owns the modal open/decision state and the notes length validation so the
 * page only has to supply the selection count and the actual batch callbacks.
 * Callbacks may return `false` to signal a failed action; the modal then stays
 * open so the user can retry.
 */
export function BatchActionBar({
  selectedCount,
  onApprove,
  onReject,
  disabled = false,
  isSubmitting = false,
  error = null,
}: BatchActionBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<BatchDecision>('approve');
  const [localError, setLocalError] = useState<string | null>(null);

  const actionsDisabled = disabled || isSubmitting || selectedCount === 0;

  const openBatch = (decision: BatchDecision) => {
    if (isSubmitting || selectedCount === 0) return;
    setLocalError(null);
    setPendingDecision(decision);
    setModalOpen(true);
  };

  const closeModal = useCallback(() => {
    if (isSubmitting) return;
    setModalOpen(false);
    setLocalError(null);
  }, [isSubmitting]);

  const handleConfirm = useCallback(
    async (decision: BatchDecision, notes: string) => {
      const trimmedNotes = typeof notes === 'string' ? notes.trim() : '';
      if (trimmedNotes.length > MAX_BATCH_NOTES_LENGTH) {
        setLocalError(`Notes must be ${MAX_BATCH_NOTES_LENGTH} characters or fewer.`);
        return;
      }

      setLocalError(null);

      try {
        const result =
          decision === 'approve' ? await onApprove(trimmedNotes) : await onReject(trimmedNotes);

        if (result !== false) {
          setModalOpen(false);
        }
      } catch {
        setLocalError('Unable to complete the batch action. Please retry.');
      }
    },
    [onApprove, onReject],
  );

  return (
    <>
      {/* Sticky batch action bar */}
      <div
        role="region"
        aria-label="Batch actions"
        className="sticky bottom-4 mx-auto w-full max-w-2xl rounded-lg border px-4 py-3 shadow-lg flex items-center justify-between gap-4"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
      >
        <Text role="body" as="span" className="text-sm" style={{ color: 'var(--muted)' }}>
          {selectedCount} selected
        </Text>
        <div className="flex gap-3">
          <button
            onClick={() => openBatch('reject')}
            disabled={actionsDisabled}
            className="px-4 py-2 text-sm font-medium rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--danger-transparent)', color: 'var(--danger)' }}
          >
            Reject Selected
          </button>
          <button
            onClick={() => openBatch('approve')}
            disabled={actionsDisabled}
            className="px-4 py-2 text-sm font-bold rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--success)', color: 'white' }}
          >
            {isSubmitting ? 'Processing…' : 'Approve Selected'}
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={modalOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        initialDecision={pendingDecision}
        affectedCount={selectedCount}
        isSubmitting={isSubmitting}
        error={localError ?? error}
      />
    </>
  );
}
