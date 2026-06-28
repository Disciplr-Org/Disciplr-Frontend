import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NotificationPreferencesState {
  email: boolean;
  push: boolean;
  frequency: string;
  quietHours: string;
  setEmail: (value: boolean) => void;
  setPush: (value: boolean) => void;
  setFrequency: (value: string) => void;
  setQuietHours: (value: string) => void;
  reset: () => void;
}

export const useNotificationPreferences = create<NotificationPreferencesState>()(
  persist(
    (set) => ({
      email: true,
      push: false,
      frequency: "",
      quietHours: "12:00",
      setEmail: (value) => set({ email: value }),
      setPush: (value) => set({ push: value }),
      setFrequency: (value) => set({ frequency: value }),
      setQuietHours: (value) => set({ quietHours: value }),
      reset: () =>
        set({
          email: true,
          push: false,
          frequency: "",
          quietHours: "12:00",
        }),
    }),
    {
      name: "notification-preferences",
    }
  )
);
