/** Maximum age of a step-up credential before it must be refreshed (15 min). */
export const STEP_UP_TTL_MS = 15 * 60 * 1000;

export interface AdminSession {
  adminId: string;
  roles: string[];
  /** Unix-ms timestamp set after a successful WebAuthn / MFA step-up. */
  stepUpVerifiedAt?: number;
}

export class StepUpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StepUpError';
  }
}

/**
 * Throws StepUpError when the session's step-up credential is absent or older
 * than `requiredWithinMs`.  Pass `now` to make tests deterministic.
 */
export function requireStepUp(
  session: AdminSession,
  requiredWithinMs = STEP_UP_TTL_MS,
  now = Date.now(),
): void {
  if (session.stepUpVerifiedAt === undefined) {
    throw new StepUpError('Step-up authentication is required before this action.');
  }
  if (now - session.stepUpVerifiedAt > requiredWithinMs) {
    throw new StepUpError('Step-up authentication has expired; please re-authenticate.');
  }
}
