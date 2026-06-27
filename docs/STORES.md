# Zustand Store Contracts

This document describes the app-level Zustand stores exported from
`src/Zustand/Store.ts`. Keep it aligned with the exported types and mutators
when verifier or notification flows change.

## Notification Store

`useNotification` owns the notification array used by the notification bell and
the full notification page.

### Shape

```ts
type NotificationStore = {
  notification: ReturnType<typeof getNotifications>;
  setNotification: (value: ReturnType<typeof getNotifications>) => void;
};
```

The `notification` value is initialized from
`src/components/Notification/exampleNotification/example.ts`. Each item is
treated as immutable by consumers: update an item by mapping to a new array and
passing that new array to `setNotification`.

### Mutators

`setNotification(value)` replaces the entire notification array.

Consumers use this single mutator to implement local actions:

- Mark one notification as read by mapping the matching `id` to
  `{ ...notification, isRead: true }`.
- Mark all notifications as read by mapping every item to
  `{ ...notification, isRead: true }`.
- Apply filters in component state without mutating the store array directly.

Unknown notification ids are no-ops when consumers keep the current item for all
non-matching ids.

### Mark All As Read Pattern

```tsx
const notifications = useNotification((state) => state.notification);
const setNotification = useNotification((state) => state.setNotification);

const markAllAsRead = () => {
  setNotification(
    notifications.map((notification) => ({
      ...notification,
      isRead: true,
    })),
  );
};
```

Keep this pattern immutable. Do not mutate the existing notification objects in
place, because components subscribe to the array reference.

## Verifier Store

`useVerifierStore` owns the verifier queue shown in
`src/pages/PendingValidations.tsx`, `src/pages/ValidationDetail.tsx`,
`src/pages/ValidationHistory.tsx`, and `src/pages/VerifierDashboard.tsx`.

### ValidationTask

```ts
export type ValidationTask = {
  id: string;
  vaultName: string;
  owner: string;
  amount: string;
  deadline: string;
  daysRemaining: number;
  status: "pending" | "approved" | "rejected";
  milestone: string;
  evidenceUrl?: string;
  notes?: string;
};
```

Field contracts:

| Field           | Contract                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| `id`            | Stable task identifier used by single and batch mutators.                                                     |
| `vaultName`     | Human-readable vault label shown in queue and history surfaces.                                               |
| `owner`         | Display address or owner identifier for the vault.                                                            |
| `amount`        | Display amount, including the asset symbol when available.                                                    |
| `deadline`      | Display deadline string. Components should not parse it unless they own formatting.                           |
| `daysRemaining` | Numeric urgency value. Values at or below zero mean overdue.                                                  |
| `status`        | Queue state. Pending tasks live in `pendingValidations`; approved/rejected tasks live in `validationHistory`. |
| `milestone`     | Milestone title being reviewed.                                                                               |
| `evidenceUrl`   | Optional external proof link for the milestone.                                                               |
| `notes`         | Optional reviewer note captured when approving or rejecting.                                                  |

### Pending And History Split

The verifier state is split into two arrays:

- `pendingValidations`: active tasks awaiting a decision.
- `validationHistory`: completed tasks, newest first.

Approving or rejecting a task removes it from `pendingValidations`, creates a
copy with the new status and optional notes, and prepends that copy to
`validationHistory`.

Unknown ids are no-ops. If a mutator cannot find the id in
`pendingValidations`, it returns the existing state.

### Mutators

`approveValidation(id, notes?)`

- Finds the pending task with `id`.
- Moves it to the front of `validationHistory`.
- Sets `status` to `'approved'`.
- Stores `notes` when provided.

`rejectValidation(id, notes?)`

- Finds the pending task with `id`.
- Moves it to the front of `validationHistory`.
- Sets `status` to `'rejected'`.
- Stores `notes` when provided.

`batchApprove(ids, notes?)`

- Iterates over `ids` and delegates to `approveValidation`.
- Keeps single-task and batch transitions identical.
- Unknown ids are ignored by the delegated single-task mutator.
- Duplicate ids only affect the first pending match; once a task moves to
  history, later duplicate ids become no-ops.

`batchReject(ids, notes?)`

- Iterates over `ids` and delegates to `rejectValidation`.
- Keeps single-task and batch transitions identical.
- Unknown ids and duplicate ids follow the same no-op behavior as
  `batchApprove`.

Empty id arrays are no-ops for both batch mutators.

## Consumer Selector Pattern

Prefer selecting only the state or action a component needs. This keeps
component re-renders scoped when unrelated store fields change.

```tsx
const pendingValidations = useVerifierStore(
  (state) => state.pendingValidations,
);
const approveValidation = useVerifierStore((state) => state.approveValidation);

const notificationCount = useNotification(
  (state) => state.notification.filter((item) => !item.isRead).length,
);
```

Avoid subscribing to the whole verifier store when a component only needs one
array or one mutator. For example, `ValidationHistory` should select
`validationHistory`, while an approval button should select `approveValidation`.

## Maintenance Checklist

When changing `Store.ts`:

1. Update this document if a field, mutator, or transition changes.
2. Keep `src/Zustand/__tests__/Store.test.ts` aligned with pending/history
   behavior.
3. Keep notification tests aligned with the immutable `setNotification` update
   pattern.
4. Document whether new mutators replace arrays, patch items, or delegate to
   existing mutators.
