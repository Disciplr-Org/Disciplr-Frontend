import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  prepareAction,
  approveAction,
  executeDestructiveAction,
  validateConfirmationToken,
  InMemoryTokenStore,
  ConfirmationTokenError,
  TOKEN_TTL_MS,
  DESTRUCTIVE_ACTIONS,
  DUAL_CONTROL_ACTIONS,
  type AdminContext,
  type AuditLogger,
  type AuditEvent,
} from '@/routes/admin';
import { StepUpError } from '@/middleware/stepUp';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(stepUpAgeMs = 0) {
  return { adminId: 'admin-1', roles: ['admin'], stepUpVerifiedAt: NOW - stepUpAgeMs };
}

function makeCtx(adminId = 'admin-1', stepUpAgeMs = 0): AdminContext {
  return { adminId, session: makeSession(stepUpAgeMs) };
}

function makeAudit(): AuditLogger & { events: AuditEvent[] } {
  const events: AuditEvent[] = [];
  return { events, log: (e) => events.push(e) };
}

const NOW = 1_700_000_000_000;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

describe('configuration', () => {
  it('DESTRUCTIVE_ACTIONS contains the three flagged actions', () => {
    expect(DESTRUCTIVE_ACTIONS.has('cursor:reset')).toBe(true);
    expect(DESTRUCTIVE_ACTIONS.has('jobs:purge')).toBe(true);
    expect(DESTRUCTIVE_ACTIONS.has('sync:force')).toBe(true);
  });

  it('DUAL_CONTROL_ACTIONS is a strict subset of DESTRUCTIVE_ACTIONS', () => {
    for (const a of DUAL_CONTROL_ACTIONS) {
      expect(DESTRUCTIVE_ACTIONS.has(a)).toBe(true);
    }
  });

  it('cursor:reset does not require dual control', () => {
    expect(DUAL_CONTROL_ACTIONS.has('cursor:reset')).toBe(false);
  });

  it('jobs:purge requires dual control', () => {
    expect(DUAL_CONTROL_ACTIONS.has('jobs:purge')).toBe(true);
  });

  it('sync:force requires dual control', () => {
    expect(DUAL_CONTROL_ACTIONS.has('sync:force')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// InMemoryTokenStore
// ---------------------------------------------------------------------------

describe('InMemoryTokenStore', () => {
  it('stores and retrieves entries', () => {
    const store = new InMemoryTokenStore();
    const entry = {
      token: 'tok',
      actionScope: 'cursor:reset' as const,
      actorId: 'admin-1',
      issuedAt: NOW,
      expiresAt: NOW + TOKEN_TTL_MS,
      requiresDualControl: false,
    };
    store.set('tok', entry);
    expect(store.get('tok')).toEqual(entry);
  });

  it('returns undefined for unknown tokens', () => {
    expect(new InMemoryTokenStore().get('nope')).toBeUndefined();
  });

  it('deletes entries', () => {
    const store = new InMemoryTokenStore();
    store.set('tok', {
      token: 'tok',
      actionScope: 'cursor:reset' as const,
      actorId: 'a',
      issuedAt: NOW,
      expiresAt: NOW + 1000,
      requiresDualControl: false,
    });
    store.delete('tok');
    expect(store.get('tok')).toBeUndefined();
  });

  it('clear() removes all entries', () => {
    const store = new InMemoryTokenStore();
    store.set('a', {
      token: 'a',
      actionScope: 'cursor:reset' as const,
      actorId: 'x',
      issuedAt: NOW,
      expiresAt: NOW + 1000,
      requiresDualControl: false,
    });
    store.clear();
    expect(store.get('a')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// prepareAction
// ---------------------------------------------------------------------------

describe('prepareAction', () => {
  let store: InMemoryTokenStore;
  let audit: ReturnType<typeof makeAudit>;

  beforeEach(() => {
    store = new InMemoryTokenStore();
    audit = makeAudit();
  });

  it('returns a token with correct shape for a non-dual-control action', () => {
    const result = prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);

    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);
    expect(result.actionScope).toBe('cursor:reset');
    expect(result.expiresAt).toBe(NOW + TOKEN_TTL_MS);
    expect(result.requiresDualControl).toBe(false);
  });

  it('marks the result as requiresDualControl for jobs:purge', () => {
    const result = prepareAction(makeCtx(), 'jobs:purge', store, audit, NOW);
    expect(result.requiresDualControl).toBe(true);
  });

  it('marks the result as requiresDualControl for sync:force', () => {
    const result = prepareAction(makeCtx(), 'sync:force', store, audit, NOW);
    expect(result.requiresDualControl).toBe(true);
  });

  it('persists the token in the store', () => {
    const { token } = prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);
    expect(store.get(token)).toBeDefined();
    expect(store.get(token)?.actionScope).toBe('cursor:reset');
  });

  it('writes a confirmation_token.issued audit event', () => {
    prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);

    expect(audit.events).toHaveLength(1);
    expect(audit.events[0]).toMatchObject({
      timestamp: NOW,
      actor: 'admin-1',
      action: 'confirmation_token.issued',
      detail: {
        actionScope: 'cursor:reset',
        expiresAt: NOW + TOKEN_TTL_MS,
        requiresDualControl: false,
      },
    });
  });

  it('rejects an unknown action with UNKNOWN_ACTION code', () => {
    expect(() => prepareAction(makeCtx(), 'drop:database', store, audit, NOW))
      .toThrow(ConfirmationTokenError);
    expect(() => prepareAction(makeCtx(), 'drop:database', store, audit, NOW))
      .toThrow(expect.objectContaining({ code: 'UNKNOWN_ACTION' }));
  });

  it('rejects when step-up is missing', () => {
    const ctx: AdminContext = {
      adminId: 'admin-1',
      session: { adminId: 'admin-1', roles: ['admin'] }, // no stepUpVerifiedAt
    };
    expect(() => prepareAction(ctx, 'cursor:reset', store, audit, NOW))
      .toThrow(StepUpError);
  });

  it('rejects when step-up is expired', () => {
    // Step-up was verified 20 minutes ago (> 15-minute TTL)
    const ctx = makeCtx('admin-1', 20 * 60 * 1000);
    expect(() => prepareAction(ctx, 'cursor:reset', store, audit, NOW))
      .toThrow(StepUpError);
  });

  it('issues distinct tokens on successive calls', () => {
    const r1 = prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);
    const r2 = prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);
    expect(r1.token).not.toBe(r2.token);
  });
});

// ---------------------------------------------------------------------------
// validateConfirmationToken
// ---------------------------------------------------------------------------

describe('validateConfirmationToken', () => {
  let store: InMemoryTokenStore;
  let audit: ReturnType<typeof makeAudit>;

  beforeEach(() => {
    store = new InMemoryTokenStore();
    audit = makeAudit();
  });

  it('accepts a valid, non-expired, correctly-scoped token', () => {
    const { token } = prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);
    expect(() => validateConfirmationToken(token, 'cursor:reset', store, NOW)).not.toThrow();
  });

  it('rejects when token is undefined — MISSING', () => {
    expect(() => validateConfirmationToken(undefined, 'cursor:reset', store, NOW))
      .toThrow(expect.objectContaining({ code: 'MISSING' }));
  });

  it('rejects when token is unknown string — MISSING', () => {
    expect(() => validateConfirmationToken('not-a-real-token', 'cursor:reset', store, NOW))
      .toThrow(expect.objectContaining({ code: 'MISSING' }));
  });

  it('rejects an expired token — EXPIRED', () => {
    const { token } = prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);
    const futureNow = NOW + TOKEN_TTL_MS + 1;

    expect(() => validateConfirmationToken(token, 'cursor:reset', store, futureNow))
      .toThrow(expect.objectContaining({ code: 'EXPIRED' }));
  });

  it('removes an expired token from the store', () => {
    const { token } = prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);
    const futureNow = NOW + TOKEN_TTL_MS + 1;

    try { validateConfirmationToken(token, 'cursor:reset', store, futureNow); } catch { /* expected */ }
    expect(store.get(token)).toBeUndefined();
  });

  it('rejects a token with wrong scope — WRONG_SCOPE', () => {
    const { token } = prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);

    expect(() => validateConfirmationToken(token, 'jobs:purge', store, NOW))
      .toThrow(expect.objectContaining({ code: 'WRONG_SCOPE' }));
  });

  it('rejects a dual-control token that has not been approved — SECOND_APPROVER_REQUIRED', () => {
    const { token } = prepareAction(makeCtx(), 'jobs:purge', store, audit, NOW);

    expect(() => validateConfirmationToken(token, 'jobs:purge', store, NOW))
      .toThrow(expect.objectContaining({ code: 'SECOND_APPROVER_REQUIRED' }));
  });

  it('accepts a dual-control token that has been approved', () => {
    const { token } = prepareAction(makeCtx('admin-1'), 'jobs:purge', store, audit, NOW);
    approveAction(makeCtx('admin-2'), token, store, audit, NOW);

    expect(() => validateConfirmationToken(token, 'jobs:purge', store, NOW)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// approveAction
// ---------------------------------------------------------------------------

describe('approveAction', () => {
  let store: InMemoryTokenStore;
  let audit: ReturnType<typeof makeAudit>;

  beforeEach(() => {
    store = new InMemoryTokenStore();
    audit = makeAudit();
  });

  it('records the second approver on the token entry', () => {
    const { token } = prepareAction(makeCtx('admin-1'), 'jobs:purge', store, audit, NOW);
    approveAction(makeCtx('admin-2'), token, store, audit, NOW);

    const entry = store.get(token);
    expect(entry?.secondApproverId).toBe('admin-2');
    expect(entry?.approvedAt).toBe(NOW);
  });

  it('writes a confirmation_token.approved audit event', () => {
    const { token } = prepareAction(makeCtx('admin-1'), 'sync:force', store, audit, NOW);
    approveAction(makeCtx('admin-2'), token, store, audit, NOW);

    const approvedEvent = audit.events.find(e => e.action === 'confirmation_token.approved');
    expect(approvedEvent).toMatchObject({
      timestamp: NOW,
      actor: 'admin-2',
      action: 'confirmation_token.approved',
      detail: {
        actionScope: 'sync:force',
        originalActor: 'admin-1',
      },
    });
  });

  it('rejects an unknown token — MISSING', () => {
    expect(() => approveAction(makeCtx('admin-2'), 'ghost-token', store, audit, NOW))
      .toThrow(expect.objectContaining({ code: 'MISSING' }));
  });

  it('rejects an expired token — EXPIRED', () => {
    const { token } = prepareAction(makeCtx('admin-1'), 'jobs:purge', store, audit, NOW);

    expect(() => approveAction(makeCtx('admin-2'), token, store, audit, NOW + TOKEN_TTL_MS + 1))
      .toThrow(expect.objectContaining({ code: 'EXPIRED' }));
  });

  it('removes an expired token from the store on approval attempt', () => {
    const { token } = prepareAction(makeCtx('admin-1'), 'jobs:purge', store, audit, NOW);
    const futureNow = NOW + TOKEN_TTL_MS + 1;

    try { approveAction(makeCtx('admin-2'), token, store, audit, futureNow); } catch { /* expected */ }
    expect(store.get(token)).toBeUndefined();
  });

  it('rejects approval of a non-dual-control action — NOT_DUAL_CONTROL', () => {
    const { token } = prepareAction(makeCtx('admin-1'), 'cursor:reset', store, audit, NOW);

    expect(() => approveAction(makeCtx('admin-2'), token, store, audit, NOW))
      .toThrow(expect.objectContaining({ code: 'NOT_DUAL_CONTROL' }));
  });

  it('rejects self-approval — SELF_APPROVAL', () => {
    const { token } = prepareAction(makeCtx('admin-1'), 'jobs:purge', store, audit, NOW);

    expect(() => approveAction(makeCtx('admin-1'), token, store, audit, NOW))
      .toThrow(expect.objectContaining({ code: 'SELF_APPROVAL' }));
  });
});

// ---------------------------------------------------------------------------
// executeDestructiveAction
// ---------------------------------------------------------------------------

describe('executeDestructiveAction', () => {
  let store: InMemoryTokenStore;
  let audit: ReturnType<typeof makeAudit>;

  beforeEach(() => {
    store = new InMemoryTokenStore();
    audit = makeAudit();
  });

  it('calls the executor for a valid non-dual-control token', async () => {
    const executor = vi.fn().mockResolvedValue(undefined);
    const { token } = prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);

    await executeDestructiveAction(makeCtx(), token, 'cursor:reset', executor, store, audit, NOW);
    expect(executor).toHaveBeenCalledOnce();
  });

  it('calls the executor for a dual-control token after approval', async () => {
    const executor = vi.fn().mockResolvedValue(undefined);
    const { token } = prepareAction(makeCtx('admin-1'), 'jobs:purge', store, audit, NOW);
    approveAction(makeCtx('admin-2'), token, store, audit, NOW);

    await executeDestructiveAction(makeCtx('admin-1'), token, 'jobs:purge', executor, store, audit, NOW);
    expect(executor).toHaveBeenCalledOnce();
  });

  it('consumes the token so it cannot be replayed', async () => {
    const executor = vi.fn().mockResolvedValue(undefined);
    const { token } = prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);
    await executeDestructiveAction(makeCtx(), token, 'cursor:reset', executor, store, audit, NOW);

    await expect(
      executeDestructiveAction(makeCtx(), token, 'cursor:reset', executor, store, audit, NOW),
    ).rejects.toThrow(expect.objectContaining({ code: 'MISSING' }));
  });

  it('consumes the token BEFORE the executor runs (replay-safe on failure)', async () => {
    const consumedBeforeRun = { value: false };
    const executor = vi.fn().mockImplementation(async () => {
      consumedBeforeRun.value = store.get('sentinel') === undefined;
      throw new Error('executor failure');
    });

    const { token } = prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);
    // Rename the internal token key to "sentinel" so we can observe deletion.
    const entry = store.get(token)!;
    store.set('sentinel', { ...entry, token: 'sentinel' });
    store.delete(token);

    try {
      await executeDestructiveAction(makeCtx(), 'sentinel', 'cursor:reset', executor, store, audit, NOW);
    } catch { /* expected */ }

    expect(consumedBeforeRun.value).toBe(true);
  });

  it('writes started and completed audit events in order', async () => {
    const executor = vi.fn().mockResolvedValue(undefined);
    const { token } = prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);
    await executeDestructiveAction(makeCtx(), token, 'cursor:reset', executor, store, audit, NOW);

    const actions = audit.events.map(e => e.action);
    expect(actions).toContain('cursor:reset.started');
    expect(actions).toContain('cursor:reset.completed');
    expect(actions.indexOf('cursor:reset.started')).toBeLessThan(
      actions.indexOf('cursor:reset.completed'),
    );
  });

  it('started audit event includes confirmedBy and approvedBy', async () => {
    const executor = vi.fn().mockResolvedValue(undefined);
    const { token } = prepareAction(makeCtx('admin-1'), 'jobs:purge', store, audit, NOW);
    approveAction(makeCtx('admin-2'), token, store, audit, NOW);

    await executeDestructiveAction(makeCtx('admin-1'), token, 'jobs:purge', executor, store, audit, NOW);

    const startedEvent = audit.events.find(e => e.action === 'jobs:purge.started');
    expect(startedEvent?.detail).toMatchObject({
      confirmedBy: 'admin-1',
      approvedBy: 'admin-2',
    });
  });

  it('rejects a missing token — MISSING', async () => {
    await expect(
      executeDestructiveAction(makeCtx(), undefined, 'cursor:reset', vi.fn(), store, audit, NOW),
    ).rejects.toThrow(expect.objectContaining({ code: 'MISSING' }));
  });

  it('rejects an expired token — EXPIRED', async () => {
    const { token } = prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);

    await expect(
      executeDestructiveAction(makeCtx(), token, 'cursor:reset', vi.fn(), store, audit, NOW + TOKEN_TTL_MS + 1),
    ).rejects.toThrow(expect.objectContaining({ code: 'EXPIRED' }));
  });

  it('rejects a wrong-scope token — WRONG_SCOPE', async () => {
    const { token } = prepareAction(makeCtx(), 'cursor:reset', store, audit, NOW);

    await expect(
      executeDestructiveAction(makeCtx(), token, 'sync:force', vi.fn(), store, audit, NOW),
    ).rejects.toThrow(expect.objectContaining({ code: 'WRONG_SCOPE' }));
  });

  it('rejects a dual-control token that has not been approved — SECOND_APPROVER_REQUIRED', async () => {
    const { token } = prepareAction(makeCtx(), 'jobs:purge', store, audit, NOW);

    await expect(
      executeDestructiveAction(makeCtx(), token, 'jobs:purge', vi.fn(), store, audit, NOW),
    ).rejects.toThrow(expect.objectContaining({ code: 'SECOND_APPROVER_REQUIRED' }));
  });
});

// ---------------------------------------------------------------------------
// Full end-to-end audit trail
// ---------------------------------------------------------------------------

describe('full audit trail', () => {
  it('dual-control flow produces prepare → approve → started → completed events', async () => {
    const store = new InMemoryTokenStore();
    const audit = makeAudit();

    const { token } = prepareAction(makeCtx('admin-1'), 'sync:force', store, audit, NOW);
    approveAction(makeCtx('admin-2'), token, store, audit, NOW);
    await executeDestructiveAction(
      makeCtx('admin-1'),
      token,
      'sync:force',
      vi.fn().mockResolvedValue(undefined),
      store,
      audit,
      NOW,
    );

    const actions = audit.events.map(e => e.action);
    expect(actions).toEqual([
      'confirmation_token.issued',
      'confirmation_token.approved',
      'sync:force.started',
      'sync:force.completed',
    ]);
  });

  it('single-control flow produces prepare → started → completed events', async () => {
    const store = new InMemoryTokenStore();
    const audit = makeAudit();

    const { token } = prepareAction(makeCtx('admin-1'), 'cursor:reset', store, audit, NOW);
    await executeDestructiveAction(
      makeCtx('admin-1'),
      token,
      'cursor:reset',
      vi.fn().mockResolvedValue(undefined),
      store,
      audit,
      NOW,
    );

    const actions = audit.events.map(e => e.action);
    expect(actions).toEqual([
      'confirmation_token.issued',
      'cursor:reset.started',
      'cursor:reset.completed',
    ]);
  });

  it('each audit event carries the correct actor', async () => {
    const store = new InMemoryTokenStore();
    const audit = makeAudit();

    const { token } = prepareAction(makeCtx('admin-1'), 'jobs:purge', store, audit, NOW);
    approveAction(makeCtx('admin-2'), token, store, audit, NOW);
    await executeDestructiveAction(
      makeCtx('admin-1'),
      token,
      'jobs:purge',
      vi.fn().mockResolvedValue(undefined),
      store,
      audit,
      NOW,
    );

    expect(audit.events[0].actor).toBe('admin-1'); // issued
    expect(audit.events[1].actor).toBe('admin-2'); // approved
    expect(audit.events[2].actor).toBe('admin-1'); // started
    expect(audit.events[3].actor).toBe('admin-1'); // completed
  });
});

// ---------------------------------------------------------------------------
// StepUp integration (via prepareAction)
// ---------------------------------------------------------------------------

describe('step-up integration', () => {
  it('fresh step-up (0 ms old) is accepted', () => {
    const store = new InMemoryTokenStore();
    const audit = makeAudit();
    expect(() =>
      prepareAction(makeCtx('admin-1', 0), 'cursor:reset', store, audit, NOW),
    ).not.toThrow();
  });

  it('step-up at exactly TTL boundary is accepted', () => {
    const store = new InMemoryTokenStore();
    const audit = makeAudit();
    // stepUpVerifiedAt is exactly 15 min ago (== TTL, not >)
    const ctx = makeCtx('admin-1', 15 * 60 * 1000);
    expect(() => prepareAction(ctx, 'cursor:reset', store, audit, NOW)).not.toThrow();
  });

  it('step-up 1 ms past TTL is rejected', () => {
    const store = new InMemoryTokenStore();
    const audit = makeAudit();
    const ctx = makeCtx('admin-1', 15 * 60 * 1000 + 1);
    expect(() => prepareAction(ctx, 'cursor:reset', store, audit, NOW)).toThrow(StepUpError);
  });
});
