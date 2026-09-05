import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { VaultAction } from '../utils/vaultState';

export type ActionState = 'idle' | 'signing' | 'submitting' | 'success' | 'error';

export interface ActionRecord {
  vaultId: string;
  milestoneId?: string;
  actionType: VaultAction;
  status: ActionState;
  error?: string;
  updatedAt: number;
}

interface VaultActionStore {
  actions: Record<string, ActionRecord>;
  setActionState: (key: string, record: Partial<ActionRecord> & { vaultId: string; actionType: VaultAction }) => void;
  clearActionState: (key: string) => void;
}

export const getActionKey = (vaultId: string, actionType: VaultAction, milestoneId?: string) => {
  return `${vaultId}_${actionType}${milestoneId ? `_${milestoneId}` : ''}`;
};

export const useVaultActionStore = create<VaultActionStore>()(
  persist(
    (set) => ({
      actions: {},
      setActionState: (key, record) =>
        set((state) => ({
          actions: {
            ...state.actions,
            [key]: {
              ...(state.actions[key] || {}),
              ...record,
              updatedAt: Date.now(),
            } as ActionRecord,
          },
        })),
      clearActionState: (key) =>
        set((state) => {
          const newActions = { ...state.actions };
          delete newActions[key];
          return { actions: newActions };
        }),
    }),
    {
      name: 'vault-action-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
