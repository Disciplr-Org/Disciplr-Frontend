import { getNotifications } from "@/components/Notification/exampleNotification/example";
import { create } from "zustand";
import { initialPending, initialHistory } from "../fixtures/validations";

// --- Existing Notification Store ---
const n = getNotifications();

export type NotificationItem = (typeof n)[number];

type notificationsType = {
  notification: NotificationItem[];
  setNotification: (value: NotificationItem[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
};

export const useNotification = create<notificationsType>((set) => ({
  notification: n,
  setNotification: (value: NotificationItem[]) =>
    set(() => ({
      notification: value,
    })),
  markRead: (id: string) =>
    set((state) => {
      const idx = state.notification.findIndex((item) => item.id === id);
      if (idx === -1) return state;
      const item = state.notification[idx];
      if (item.isRead) return state;
      const notification = [...state.notification];
      notification[idx] = { ...item, isRead: true };
      return { notification };
    }),
  markAllRead: () =>
    set((state) => ({
      notification: state.notification.map((item) =>
        item.isRead ? item : { ...item, isRead: true },
      ),
    })),
  dismiss: (id: string) =>
    set((state) => ({
      notification: state.notification.filter((item) => item.id !== id),
    })),
  clearAll: () =>
    set(() => ({
      notification: [],
    })),
}));

export const useUnreadCount = () =>
  useNotification((state) =>
    state.notification.filter((item) => !item.isRead).length,
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
};

type VerifierStoreType = {
  pendingValidations: ValidationTask[];
  validationHistory: ValidationTask[];
  approveValidation: (id: string, notes?: string) => void;
  rejectValidation: (id: string, notes?: string) => void;
  batchApprove: (ids: string[], notes?: string) => void;
  batchReject: (ids: string[], notes?: string) => void;
};

// Mock initial data lives in src/fixtures/validations.ts (imported at top).

export const useVerifierStore = create<VerifierStoreType>((set, get) => ({
  pendingValidations: initialPending,
  validationHistory: initialHistory,
  
  approveValidation: (id, notes) => set((state) => {
    const taskIndex = state.pendingValidations.findIndex(t => t.id === id);
    if (taskIndex === -1) return state;
    
    const task = { ...state.pendingValidations[taskIndex], status: 'approved' as const, notes, decidedAt: new Date().toISOString() };
    const newPending = [...state.pendingValidations];
    newPending.splice(taskIndex, 1);
    
    return {
      pendingValidations: newPending,
      validationHistory: [task, ...state.validationHistory]
    };
  }),
  
  rejectValidation: (id, notes) => set((state) => {
    const taskIndex = state.pendingValidations.findIndex(t => t.id === id);
    if (taskIndex === -1) return state;
    
    const task = { ...state.pendingValidations[taskIndex], status: 'rejected' as const, notes, decidedAt: new Date().toISOString() };
    const newPending = [...state.pendingValidations];
    newPending.splice(taskIndex, 1);
    
    return {
      pendingValidations: newPending,
      validationHistory: [task, ...state.validationHistory]
    };
  }),

  // Batch mutators are implemented in terms of the single-task mutators so the
  // pending -> history transition stays identical for one or many tasks.
  batchApprove: (ids, notes) => {
    ids.forEach(id => get().approveValidation(id, notes));
  },

  batchReject: (ids, notes) => {
    ids.forEach(id => get().rejectValidation(id, notes));
  }
}));

export * from "./notificationPreferences";
