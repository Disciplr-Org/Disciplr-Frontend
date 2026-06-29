import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NotificationPreferencesState {
  email: boolean;
  push: boolean;
  frequency: string;
  quietHours: string;
  quietStart: string;
  quietEnd: string;
  setEmail: (value: boolean) => void;
  setPush: (value: boolean) => void;
  setFrequency: (value: string) => void;
  setQuietHours: (value: string) => void;
  setQuietRange: (start: string, end: string) => void;
  reset: () => void;
}

export const useNotificationPreferences =
  create<NotificationPreferencesState>()(
    persist(
      (set) => ({
        email: true,
        push: false,
        frequency: "",
        quietHours: "12:00",
        quietStart: "22:00",
        quietEnd: "07:00",
        setEmail: (value) => set({ email: value }),
        setPush: (value) => set({ push: value }),
        setFrequency: (value) => set({ frequency: value }),
        setQuietHours: (value) => set({ quietHours: value, quietStart: value }),
        setQuietRange: (start, end) =>
          set({ quietStart: start, quietEnd: end, quietHours: start }),
        reset: () =>
          set({
            email: true,
            push: false,
            frequency: "",
            quietHours: "12:00",
            quietStart: "22:00",
            quietEnd: "07:00",
          }),
      }),
      {
        name: "notification-preferences",
      },
    ),
  );
