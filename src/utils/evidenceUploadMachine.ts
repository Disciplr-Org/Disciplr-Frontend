/**
 * evidenceUploadMachine.ts
 *
 * Pure state machine for evidence submission. No framework dependency —
 * plain reducer that can be tested without DOM or React.
 *
 * States
 * ──────
 *   idle        Initial state and the only state from which a submission can
 *               start. File selection and URL editing are always permitted.
 *
 *   submitting  A submission is in flight. The component is locked: editing,
 *               re-submission, and redundant cancellations are all no-ops.
 *               Each flight carries a `submissionKey` (monotonic integer) so
 *               stale async responses from earlier attempts are discarded.
 *
 *   submitted   The on-chain action completed successfully. The form is
 *               intentionally locked to prevent re-submission of the same
 *               evidence URL. The parent must call RESET to allow another
 *               submission (e.g. for a different milestone).
 *
 *   failed      The submission rejected. The error message is preserved for
 *               display. The user can edit the URL/file and retry, or the
 *               parent can call RESET to return to a clean idle state.
 *               Retry does NOT silently repeat the action — it starts a new
 *               flight with a fresh submissionKey, so a stale response from
 *               the original attempt can never land on top of the retry.
 *
 * Invariants
 * ──────────
 *   I1. SUBMIT is only processed from `idle` or `failed`. A double-click
 *       while `submitting` is a no-op — the reducer returns the current state
 *       unchanged.
 *   I2. RESOLVE / REJECT only land when the submissionKey in the action
 *       matches the in-flight key. Stale responses (from superseded retries
 *       or an unmounted component) are silently dropped.
 *   I3. Transitions to `submitted` and `failed` are terminal until an
 *       explicit RESET, preventing contradictory state from accumulating.
 *   I4. RESET from `submitting` is a no-op — you cannot cancel an in-flight
 *       on-chain action; the user must wait for it to settle.
 *   I5. URL_CHANGE and FILE_CHANGE are blocked while `submitting` to prevent
 *       the user from altering evidence after the action has started.
 */

export type SubmissionStatus = 'idle' | 'submitting' | 'submitted' | 'failed';

export interface EvidenceUploadState {
  status: SubmissionStatus;
  /** The normalized evidence URL that was last successfully validated. */
  pendingUrl: string | null;
  /** Monotonic counter used to correlate async responses with their submission. */
  submissionKey: number;
  /** Error message from the most recent failed submission. */
  error: string | null;
}

export const INITIAL_STATE: EvidenceUploadState = {
  status: 'idle',
  pendingUrl: null,
  submissionKey: 0,
  error: null,
};

export type EvidenceUploadAction =
  | { type: 'URL_CHANGE'; url: string | null }
  | { type: 'FILE_CHANGE'; file: File | null }
  | { type: 'SUBMIT'; url: string }
  | { type: 'RESOLVE'; submissionKey: number }
  | { type: 'REJECT'; submissionKey: number; error: string }
  | { type: 'RESET' };

export function evidenceUploadReducer(
  state: EvidenceUploadState,
  action: EvidenceUploadAction,
): EvidenceUploadState {
  switch (action.type) {
    case 'URL_CHANGE':
    case 'FILE_CHANGE':
      // I5: block edits mid-flight so the URL committed to the chain stays
      // coherent with what the user actually sees on screen.
      if (state.status === 'submitting') return state;
      // Editing after a terminal state clears the outcome and returns to idle
      // so the user can make a fresh submission attempt.
      return {
        ...state,
        status: 'idle',
        error: null,
        pendingUrl: action.type === 'URL_CHANGE' ? action.url : state.pendingUrl,
      };

    case 'SUBMIT':
      // I1: only start from idle or failed; ignore double-clicks in flight.
      if (state.status === 'submitting' || state.status === 'submitted') {
        return state;
      }
      return {
        status: 'submitting',
        pendingUrl: action.url,
        submissionKey: state.submissionKey + 1,
        error: null,
      };

    case 'RESOLVE':
      // I2: discard stale resolves.
      if (
        state.status !== 'submitting' ||
        action.submissionKey !== state.submissionKey
      ) {
        return state;
      }
      return {
        ...state,
        status: 'submitted',
        error: null,
      };

    case 'REJECT':
      // I2: discard stale rejects.
      if (
        state.status !== 'submitting' ||
        action.submissionKey !== state.submissionKey
      ) {
        return state;
      }
      return {
        ...state,
        status: 'failed',
        error: action.error,
      };

    case 'RESET':
      // I4: cannot reset while a flight is in progress.
      if (state.status === 'submitting') return state;
      return { ...INITIAL_STATE };

    default:
      return state;
  }
}
