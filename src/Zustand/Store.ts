import { getNotifications } from "@/components/Notification/exampleNotification/example";
import { create } from "zustand";

// --- Existing Notification Store ---
const n = getNotifications();

export type NotificationList = typeof n;

export const getUnreadCount = (notifications: NotificationList) =>
  notifications.filter((item) => !item.isRead).length;

type notificationsType = {
  notification: NotificationList;
  /** Derived from notification so badges and pages share one unread source. */
  unreadCount: number;
  setNotification: (value: NotificationList) => void;
  /** Marks one notification read without mutating the existing list. */
  markRead: (id: string) => void;
  /** Marks every unread notification read without changing the data shape. */
  markAllRead: () => void;
};

export const useNotification = create<notificationsType>((set) => ({
  notification: n,
  unreadCount: getUnreadCount(n),
  setNotification: (value: NotificationList) =>
    set(() => ({ notification: value, unreadCount: getUnreadCount(value) })),
  markRead: (id: string) =>
    set((state) => {
      let changed = false;
      const notification = state.notification.map((item) => {
        if (item.id !== id || item.isRead) return item;
        changed = true;
        return { ...item, isRead: true };
      });

      if (!changed) return state;

      return {
        notification,
        unreadCount: getUnreadCount(notification),
      };
    }),
  markAllRead: () =>
    set((state) => {
      if (state.unreadCount === 0) return state;

      const notification = state.notification.map((item) =>
        item.isRead ? item : { ...item, isRead: true },
      );

      return { notification, unreadCount: 0 };
    }),
}));


// --- New Verifier Store ---
export type ValidationTask = {
  id: string;
  vaultName: string;
  owner: string;
  amount: string;
  deadline: string;
  daysRemaining: number;
  status: 'pending' | 'approved' | 'rejected';
  milestone: string;
  evidenceUrl?: string;
  notes?: string;
};

type VerifierStoreType = {
  pendingValidations: ValidationTask[];
  validationHistory: ValidationTask[];
  approveValidation: (id: string, notes?: string) => void;
  rejectValidation: (id: string, notes?: string) => void;
};

// Mock initial data based on the issue requirements
const initialPending: ValidationTask[] = [
  {
    id: 'v-101',
    vaultName: 'Q3 Development Fund',
    owner: '0x1234...abcd',
    amount: '50,000 USDC',
    deadline: '2026-05-15',
    daysRemaining: 16,
    status: 'pending',
    milestone: 'Beta Release Deployment',
    evidenceUrl: 'https://github.com/example/release-v1',
  },
  {
    id: 'v-102',
    vaultName: 'Community Grant #42',
    owner: '0x8888...9999',
    amount: '10,000 USDC',
    deadline: '2026-05-02',
    daysRemaining: 3,
    status: 'pending',
    milestone: 'Design System Figma Delivery',
    evidenceUrl: 'https://figma.com/example-link',
  }
];

const initialHistory: ValidationTask[] = [
  {
    id: 'v-099',
    vaultName: 'Audit Bounty',
    owner: '0x7777...4444',
    amount: '5,000 USDC',
    deadline: '2026-04-10',
    daysRemaining: 0,
    status: 'approved',
    milestone: 'Smart Contract Security Audit',
    notes: 'Audit looks solid, all critical issues addressed.',
  }
];

export const useVerifierStore = create<VerifierStoreType>((set) => ({
  pendingValidations: initialPending,
  validationHistory: initialHistory,
  
  approveValidation: (id, notes) => set((state) => {
    const taskIndex = state.pendingValidations.findIndex(t => t.id === id);
    if (taskIndex === -1) return state;
    
    const task = { ...state.pendingValidations[taskIndex], status: 'approved' as const, notes };
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
    
    const task = { ...state.pendingValidations[taskIndex], status: 'rejected' as const, notes };
    const newPending = [...state.pendingValidations];
    newPending.splice(taskIndex, 1);
    
    return {
      pendingValidations: newPending,
      validationHistory: [task, ...state.validationHistory]
    };
  })
}));
