import { useToastStore } from "../Zustand/toastStore";

const MAX_TOASTS = 5;

export function useToast() {
  const push = useToastStore((s) => s.push);
  const dismiss = useToastStore((s) => s.dismiss);
  const clear = useToastStore((s) => s.clear);

  return {
    push: (toast) => {
      const { toasts } = useToastStore.getState();
      if (toasts.length >= MAX_TOASTS) dismiss(toasts[0].id);
      push(toast);
    },
    dismiss,
    clear,
    diagnostics: () => ({
      queueSize: useToastStore.getState().toasts.length,
      maxToasts: MAX_TOASTS,
    }),
  };
}