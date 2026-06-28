# Admin Destructive-Action Guards

This document describes the confirmation-token and dual-control system that
protects the highest-impact admin endpoints from accidental or malicious
single-session execution.

---

## Overview

Three admin operations are classified as **destructive** because they are
irreversible or have broad blast-radius:

| Action | Description | Dual control required |
|--------|-------------|----------------------|
| `cursor:reset` | Resets the event-processing cursor to the beginning | No |
| `jobs:purge` | Permanently deletes all queued jobs | **Yes** |
| `sync:force` | Drops and rebuilds the sync state from scratch | **Yes** |

A single compromised admin session cannot execute any of these actions
unilaterally. Every execution requires:

1. An active **step-up credential** (WebAuthn/MFA, valid for 15 minutes).
2. A short-lived, action-scoped **confirmation token** obtained via a separate
   `prepare` call.
3. For dual-control actions: a **second admin approver** (a different admin
   account) must approve the token before it is accepted.

---

## Two-phase execution flow

### Phase 1 — Prepare (all destructive actions)

```
POST /admin/prepare
Authorization: Bearer <admin-session>
X-StepUp-Token: <webauthn-assertion>

{ "action": "cursor:reset" }
```

Response:
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "actionScope": "cursor:reset",
  "expiresAt": 1700000300000,
  "requiresDualControl": false
}
```

The token is valid for **5 minutes** and is scoped to exactly one action.
It is stored server-side and consumed (deleted) on first successful execution.

### Phase 2a — Approve (dual-control actions only)

A **different** admin must call the approve endpoint with the token before it
can be used:

```
POST /admin/approve
Authorization: Bearer <second-admin-session>

{ "token": "550e8400-e29b-41d4-a716-446655440000" }
```

The same admin who issued the token cannot approve it (`SELF_APPROVAL`).

### Phase 2b — Execute

```
POST /admin/cursor/reset
Authorization: Bearer <admin-session>
X-Confirmation-Token: 550e8400-e29b-41d4-a716-446655440000
```

The guard:
1. Looks up the token in the store.
2. Verifies it has not expired.
3. Verifies its scope matches the endpoint being called.
4. For dual-control actions, verifies a second approver has confirmed.
5. **Deletes the token** before calling the executor (replay-safe even on failure).
6. Calls the executor.
7. Writes `<action>.started` and `<action>.completed` audit events.

---

## Adding a new destructive action

1. Add the action string to `DESTRUCTIVE_ACTIONS` in `src/routes/admin.ts`.
2. If it also requires a second approver, add it to `DUAL_CONTROL_ACTIONS`.
3. Call `executeDestructiveAction` in the new endpoint handler, passing the
   executor function and the token from `X-Confirmation-Token`.
4. Add tests in `src/tests/admin.dualControl.test.ts`.

---

## Error codes

| Code | Meaning |
|------|---------|
| `MISSING` | Token not provided, unknown, or already consumed. |
| `EXPIRED` | Token TTL (5 min) has elapsed; issue a new one. |
| `WRONG_SCOPE` | Token was prepared for a different action. |
| `SECOND_APPROVER_REQUIRED` | Dual-control action; a second admin must call `/admin/approve` first. |
| `SELF_APPROVAL` | The approver is the same admin who prepared the token. |
| `NOT_DUAL_CONTROL` | `/admin/approve` was called for a single-control action. |
| `UNKNOWN_ACTION` | The action string passed to `/admin/prepare` is not in `DESTRUCTIVE_ACTIONS`. |

---

## Audit trail

Every step produces an `AuditEvent`:

```ts
interface AuditEvent {
  timestamp: number;   // Unix ms
  actor: string;       // adminId
  action: string;      // see table below
  detail: Record<string, unknown>;
}
```

| Event | When |
|-------|------|
| `confirmation_token.issued` | Token created by prepare call |
| `confirmation_token.approved` | Second approver confirmed |
| `<action>.started` | Just before executor runs (token already consumed) |
| `<action>.completed` | Executor returned successfully |

A full dual-control run for `sync:force` produces exactly:

```
confirmation_token.issued   actor=admin-1
confirmation_token.approved actor=admin-2
sync:force.started          actor=admin-1
sync:force.completed        actor=admin-1
```

---

## Step-up credential

The step-up check is enforced in `prepareAction` via `requireStepUp`
(`src/middleware/stepUp.ts`). A credential is valid for **15 minutes** from
the time of WebAuthn verification (`session.stepUpVerifiedAt`). The TTL is
injectable for testing.

```ts
requireStepUp(session);                  // uses 15-min default
requireStepUp(session, 5 * 60 * 1000);  // custom TTL (ms)
```

---

## Testing

```
npm test -- src/tests/admin.dualControl.test.ts
```

The test suite covers:

- `prepareAction`: valid token shape, dual-control flag, unknown action, missing
  step-up, expired step-up, distinct tokens per call.
- `validateConfirmationToken`: valid token, missing token, unknown token, expired
  token, wrong scope, unapproved dual-control token, approved dual-control token.
- `approveAction`: second-approver recorded, audit event, unknown token, expired
  token, non-dual-control rejection, self-approval rejection.
- `executeDestructiveAction`: executor called, token consumed before run
  (replay-safe on failure), audit event order, confirmedBy/approvedBy in events,
  all rejection codes.
- Full end-to-end audit trail for both single-control and dual-control flows.
- Step-up TTL boundary conditions (exact boundary accepted, 1 ms over rejected).
