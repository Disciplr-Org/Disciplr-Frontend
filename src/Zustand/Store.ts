import { create } from "zustand";
import type { Notification } from "@/components/Notification/exampleNotification/example";
import { initialPending, initialHistory } from "../fixtures/validations";
import {
  isApiEnabled,
  type SubmitValidationInput,
  type ValidationDecision,
} from "../services/api";
import { listPendingValidations, submitValidation } from "../services/vaultService";
import { createSingleFlightRunner, type SingleFlightRunner } from "../utils/singleFlight";
import { logger } from "../utils/logger";

// --- Existing Notification Store ---
export type NotificationItem = Notification;

type notificationsType = {
  notification: NotificationItem[];
  setNotification: (value: NotificationItem[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
};

/**
 * Runtime guard for store entries. Types claim every entry is a
 * `NotificationItem`, but callers can write arbitrary payloads through
 * `setNotification`/`setState`, so every read path validates before touching
 * entry fields. Non-objects are preserved (never crashed on, never silently
 * dropped by a transition) and simply never match an id.
 */
const isRecord = (value: unknown): value is NotificationItem =>
  typeof value === "object" && value !== null;

const isList = (value: unknown): value is NotificationItem[] =>
  Array.isArray(value);

export const useNotification = create<notificationsType>((set) => ({
  notification: [],
  setNotification: (value: NotificationItem[]) =>
    set((state) => {
      // Validation boundary: only arrays are accepted, and non-object entries
      // are discarded so a hostile payload cannot poison later transitions
      // (markRead/markAllRead/dismiss) or unread counting.
      if (!Array.isArray(value)) return state;
      return { notification: value.filter(isRecord) };
    }),
  markRead: (id: string) =>
    set((state) => {
      if (!isList(state.notification)) return state;
      const idx = state.notification.findIndex(
        (item) => isRecord(item) && item.id === id,
      );
      if (idx === -1) return state;
      const item = state.notification[idx];
      if (item.isRead) return state;
      const notification = [...state.notification];
      notification[idx] = { ...item, isRead: true };
      return { notification };
    }),
  markAllRead: () =>
    set((state) => {
      if (!isList(state.notification)) return state;
      return {
        notification: state.notification.map((item) =>
          isRecord(item) && !item.isRead ? { ...item, isRead: true } : item,
        ),
      };
    }),
  dismiss: (id: string) =>
    set((state) => {
      if (!isList(state.notification)) return state;
      return {
        notification: state.notification.filter(
          (item) => !(isRecord(item) && item.id === id),
        ),
      };
    }),
  clearAll: () =>
    set(() => ({
      notification: [],
    })),
}));

export const useUnreadCount = () =>
  useNotification((state) =>
    isList(state.notification)
      ? state.notification.filter(
          (item) => isRecord(item) && !item.isRead,
        ).length
      : 0,
  );


// --- New Verifier Store ---
export type ValidationTask = {
  id: string;
  vaultName: string;
  owner: string;
  amount: string;
  deadline: string;
  status: 'pending' | 'approved' | 'rejected';
  milestone: string;
  evidenceUrl?: string;
  notes?: string;
  criteria?: string[];
  decidedAt?: string;
  vaultId?: string;
  milestoneId?: string;
  assignedVerifier?: string;
};

export type ValidationDecisionOutcome = {
  id: string;
  ok: boolean;
  error?: string;
};

type QueueLoadOptions = { force?: boolean };

type VerifierStoreType = {
  pendingValidations: ValidationTask[];
  validationHistory: ValidationTask[];
  approveValidation: (id: string, notes?: string) => void | Promise<void>;
  rejectValidation: (id: string, notes?: string) => void | Promise<void>;
  batchApprove: (ids: string[], notes?: string) => void | Promise<ValidationDecisionOutcome[]>;
  batchReject: (ids: string[], notes?: string) => void | Promise<ValidationDecisionOutcome[]>;
  loadQueue: (options?: QueueLoadOptions) => Promise<void>;
};

// Mock initial data lives in src/fixtures/validations.ts (imported at top).

const submissionRunners = new Map<string, SingleFlightRunner<[SubmitValidationInput], void>>();

function getSubmissionRunner(taskId: string): SingleFlightRunner<[SubmitValidationInput], void> {
  let runner = submissionRunners.get(taskId);
  if (!runner) {
    runner = createSingleFlightRunner((input: SubmitValidationInput) => submitValidation(input));
    submissionRunners.set(taskId, runner);
  }
  return runner;
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim() ? error.message : 'Unknown validation error.';
}

function applyDecision(
  state: VerifierStoreType,
  ids: string[],
  decision: ValidationDecision,
  notes?: string,
) {
  const targets = new Set([...new Set(ids)]);
  if (targets.size === 0) return state;

  const decidedAt = new Date().toISOString();
  const moved = state.pendingValidations
    .filter((task) => targets.has(task.id))
    .map((task) => ({
      ...task,
      status: decision === 'approve' ? ('approved' as const) : ('rejected' as const),
      notes,
      decidedAt,
    }));

  if (moved.length === 0) return state;

  return {
    pendingValidations: state.pendingValidations.filter((task) => !targets.has(task.id)),
    validationHistory: [...moved.reverse(), ...state.validationHistory],
  };
}

function rollbackDecision(
  snapshot: Pick<VerifierStoreType, 'pendingValidations' | 'validationHistory'>,
  failedIds: Set<string>,
) {
  return (state: VerifierStoreType) => {
    const currentIds = new Set(state.pendingValidations.map((task) => task.id));
    const snapshotIds = new Set(snapshot.pendingValidations.map((task) => task.id));
    const pendingValidations = snapshot.pendingValidations
      .filter((task) => failedIds.has(task.id) || currentIds.has(task.id))
      .map((task) =>
        failedIds.has(task.id)
          ? { ...task, status: 'pending' as const, notes: undefined, decidedAt: undefined }
          : task,
      );

    state.pendingValidations.forEach((task) => {
      if (!snapshotIds.has(task.id)) pendingValidations.push(task);
    });

    return {
      pendingValidations,
      validationHistory: state.validationHistory.filter((task) => !failedIds.has(task.id)),
    };
  };
}

export const useVerifierStore = create<VerifierStoreType>((set, get) => {
  const submitDecisions = async (
    ids: string[],
    decision: ValidationDecision,
    notes?: string,
  ): Promise<ValidationDecisionOutcome[]> => {
    const state = get();
    const decidedIds = new Set(state.validationHistory.map((task) => task.id));
    const targets = state.pendingValidations.filter(
      (task) => ids.includes(task.id) && !decidedIds.has(task.id),
    );
    if (targets.length === 0) return [];

    const snapshot = {
      pendingValidations: state.pendingValidations,
      validationHistory: state.validationHistory,
    };
    set((current) => applyDecision(current, targets.map((task) => task.id), decision, notes));

    const outcomes = await Promise.all(
      targets.map(async (task): Promise<ValidationDecisionOutcome> => {
        try {
          await getSubmissionRunner(task.id).run({
            id: task.id,
            vaultId: task.vaultId ?? task.id,
            milestoneId: task.milestoneId ?? task.id,
            decision,
            notes,
            verifier: task.assignedVerifier,
          });
          return { id: task.id, ok: true };
        } catch (error) {
          return { id: task.id, ok: false, error: errorMessage(error) };
        }
      }),
    );

    const failedIds = new Set(
      outcomes.filter((outcome) => !outcome.ok).map((outcome) => outcome.id),
    );
    if (failedIds.size > 0) {
      set(rollbackDecision(snapshot, failedIds));
    }
    return outcomes;
  };

  return {
    pendingValidations: initialPending,
    validationHistory: initialHistory,

    approveValidation: (id, notes) => {
      if (!isApiEnabled()) {
        set((state) => applyDecision(state, [id], 'approve', notes));
        return;
      }
      return submitDecisions([id], 'approve', notes).then((outcomes) => {
        const failed = outcomes.find((outcome) => !outcome.ok);
        if (failed) throw new Error(failed.error ?? `Unable to approve ${id}.`);
      });
    },

    rejectValidation: (id, notes) => {
      if (!isApiEnabled()) {
        set((state) => applyDecision(state, [id], 'reject', notes));
        return;
      }
      return submitDecisions([id], 'reject', notes).then((outcomes) => {
        const failed = outcomes.find((outcome) => !outcome.ok);
        if (failed) throw new Error(failed.error ?? `Unable to reject ${id}.`);
      });
    },

    batchApprove: (ids, notes) => {
      if (!isApiEnabled()) {
        set((state) => applyDecision(state, ids, 'approve', notes));
        return;
      }
      return submitDecisions(ids, 'approve', notes);
    },

    batchReject: (ids, notes) => {
      if (!isApiEnabled()) {
        set((state) => applyDecision(state, ids, 'reject', notes));
        return;
      }
      return submitDecisions(ids, 'reject', notes);
    },

    loadQueue: async (options) => {
      if (!isApiEnabled()) return;
      try {
        const tasks = await listPendingValidations(options);
        set({ pendingValidations: tasks });
      } catch (error) {
        logger.warn('[useVerifierStore] Unable to load verifier queue from API.', {
          error: errorMessage(error),
        });
      }
    },
  };
});

export * from "./notificationPreferences";
