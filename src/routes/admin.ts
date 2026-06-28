import { type AdminSession, requireStepUp } from '@/middleware/stepUp';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** How long a confirmation token is valid after issuance. */
export const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Destructive actions that require a confirmation token before execution.
 * Adding a new action here is the only change needed to protect it.
 */
export const DESTRUCTIVE_ACTIONS = new Set([
  'cursor:reset',
  'jobs:purge',
  'sync:force',
] as const);

/**
 * Subset of DESTRUCTIVE_ACTIONS that additionally require a second admin
 * approver (dual-control) before the confirmation token is accepted.
 */
export const DUAL_CONTROL_ACTIONS = new Set([
  'jobs:purge',
  'sync:force',
] as const);

export type DestructiveAction = 'cursor:reset' | 'jobs:purge' | 'sync:force';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type ConfirmationTokenErrorCode =
  | 'MISSING'
  | 'EXPIRED'
  | 'WRONG_SCOPE'
  | 'SECOND_APPROVER_REQUIRED'
  | 'SELF_APPROVAL'
  | 'NOT_DUAL_CONTROL'
  | 'UNKNOWN_ACTION';

export class ConfirmationTokenError extends Error {
  constructor(
    message: string,
    public readonly code: ConfirmationTokenErrorCode,
  ) {
    super(message);
    this.name = 'ConfirmationTokenError';
  }
}

// ---------------------------------------------------------------------------
// Token store
// ---------------------------------------------------------------------------

export interface ConfirmationToken {
  token: string;
  actionScope: DestructiveAction;
  actorId: string;
  issuedAt: number;
  expiresAt: number;
  requiresDualControl: boolean;
  secondApproverId?: string;
  approvedAt?: number;
}

export interface TokenStore {
  set(token: string, entry: ConfirmationToken): void;
  get(token: string): ConfirmationToken | undefined;
  delete(token: string): void;
}

export class InMemoryTokenStore implements TokenStore {
  private readonly store = new Map<string, ConfirmationToken>();
  set(token: string, entry: ConfirmationToken): void { this.store.set(token, entry); }
  get(token: string): ConfirmationToken | undefined { return this.store.get(token); }
  delete(token: string): void { this.store.delete(token); }
  /** Test helper: wipe all tokens. */
  clear(): void { this.store.clear(); }
}

// ---------------------------------------------------------------------------
// Audit logger
// ---------------------------------------------------------------------------

export interface AuditEvent {
  timestamp: number;
  actor: string;
  action: string;
  detail: Record<string, unknown>;
}

export interface AuditLogger {
  log(event: AuditEvent): void;
}

// ---------------------------------------------------------------------------
// Core guards
// ---------------------------------------------------------------------------

/**
 * Validates a confirmation token for the given action and actor.
 * Returns the token entry on success; throws ConfirmationTokenError otherwise.
 * Does NOT consume the token — call store.delete() after successful execution.
 */
export function validateConfirmationToken(
  tokenValue: string | undefined,
  requiredAction: DestructiveAction,
  store: TokenStore,
  now = Date.now(),
): ConfirmationToken {
  if (!tokenValue) {
    throw new ConfirmationTokenError(
      'A confirmation token is required for this action.',
      'MISSING',
    );
  }

  const entry = store.get(tokenValue);
  if (!entry) {
    throw new ConfirmationTokenError(
      'Confirmation token is invalid or has already been used.',
      'MISSING',
    );
  }

  if (now > entry.expiresAt) {
    store.delete(tokenValue);
    throw new ConfirmationTokenError(
      'Confirmation token has expired.',
      'EXPIRED',
    );
  }

  if (entry.actionScope !== requiredAction) {
    throw new ConfirmationTokenError(
      `Token scope mismatch: expected "${requiredAction}", got "${entry.actionScope}".`,
      'WRONG_SCOPE',
    );
  }

  if (entry.requiresDualControl && entry.approvedAt === undefined) {
    throw new ConfirmationTokenError(
      'A second admin approver must confirm this action before it can be executed.',
      'SECOND_APPROVER_REQUIRED',
    );
  }

  return entry;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

export interface AdminContext {
  adminId: string;
  session: AdminSession;
}

export interface PrepareResult {
  token: string;
  actionScope: DestructiveAction;
  expiresAt: number;
  requiresDualControl: boolean;
}

/**
 * Issues a short-lived, action-scoped confirmation token.
 * Requires the caller to have an active step-up credential.
 */
export function prepareAction(
  ctx: AdminContext,
  action: string,
  store: TokenStore,
  audit: AuditLogger,
  now = Date.now(),
): PrepareResult {
  if (!DESTRUCTIVE_ACTIONS.has(action as DestructiveAction)) {
    throw new ConfirmationTokenError(
      `"${action}" is not a recognised destructive action.`,
      'UNKNOWN_ACTION',
    );
  }

  requireStepUp(ctx.session, undefined, now);

  const token = globalThis.crypto.randomUUID();
  const requiresDualControl = DUAL_CONTROL_ACTIONS.has(action as DestructiveAction);
  const expiresAt = now + TOKEN_TTL_MS;

  const entry: ConfirmationToken = {
    token,
    actionScope: action as DestructiveAction,
    actorId: ctx.adminId,
    issuedAt: now,
    expiresAt,
    requiresDualControl,
  };

  store.set(token, entry);

  audit.log({
    timestamp: now,
    actor: ctx.adminId,
    action: 'confirmation_token.issued',
    detail: { actionScope: action, expiresAt, requiresDualControl },
  });

  return { token, actionScope: action as DestructiveAction, expiresAt, requiresDualControl };
}

/**
 * Second-approver call for dual-control actions.
 * The approver must be a different admin than the one who prepared the token.
 */
export function approveAction(
  ctx: AdminContext,
  tokenValue: string,
  store: TokenStore,
  audit: AuditLogger,
  now = Date.now(),
): void {
  const entry = store.get(tokenValue);

  if (!entry) {
    throw new ConfirmationTokenError(
      'Confirmation token is invalid or has already been used.',
      'MISSING',
    );
  }

  if (now > entry.expiresAt) {
    store.delete(tokenValue);
    throw new ConfirmationTokenError('Confirmation token has expired.', 'EXPIRED');
  }

  if (!entry.requiresDualControl) {
    throw new ConfirmationTokenError(
      'This action does not require dual-control approval.',
      'NOT_DUAL_CONTROL',
    );
  }

  if (entry.actorId === ctx.adminId) {
    throw new ConfirmationTokenError(
      'The same admin cannot both prepare and approve a dual-control action.',
      'SELF_APPROVAL',
    );
  }

  store.set(tokenValue, { ...entry, secondApproverId: ctx.adminId, approvedAt: now });

  audit.log({
    timestamp: now,
    actor: ctx.adminId,
    action: 'confirmation_token.approved',
    detail: {
      actionScope: entry.actionScope,
      originalActor: entry.actorId,
    },
  });
}

/**
 * Validates the token for the given action, consumes it (one-time use),
 * runs the provided executor, and writes a completion audit event.
 */
export async function executeDestructiveAction(
  ctx: AdminContext,
  tokenValue: string | undefined,
  action: DestructiveAction,
  executor: () => Promise<void>,
  store: TokenStore,
  audit: AuditLogger,
  now = Date.now(),
): Promise<void> {
  const entry = validateConfirmationToken(tokenValue, action, store, now);

  // Consume token before execution to prevent replays even on executor failure.
  store.delete(entry.token);

  audit.log({
    timestamp: now,
    actor: ctx.adminId,
    action: `${action}.started`,
    detail: {
      confirmedBy: entry.actorId,
      approvedBy: entry.secondApproverId,
    },
  });

  await executor();

  audit.log({
    timestamp: now,
    actor: ctx.adminId,
    action: `${action}.completed`,
    detail: {
      confirmedBy: entry.actorId,
      approvedBy: entry.secondApproverId,
    },
  });
}
