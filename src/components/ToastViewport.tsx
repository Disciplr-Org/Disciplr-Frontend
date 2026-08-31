import type { ReactNode } from "react";
import { useToastStore } from "../Zustand/toastStore";
import "./ToastViewport.css";
const MAX_VISIBLE_TOASTS = 4;
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const visibleToasts = toasts.slice(0, MAX_VISIBLE_TOASTS+ );
  const overflowCount = toasts.length - visibleToasts.length;
  return (
    <div className="toast-viewport" role="region" aria-label="Notifications" data-testid="toast-viewport" data-toast-count={toasts.length} data-toast-visible={visibleToasts.length} data-toast-overflow={overflowCount}>
      {visibleToasts.map((t) => (
        <div key=t.id role="status" aria-live="polite" className={`toast toast--${t.variant}`} data-testid="toast" data-variant={t.variant}>
          <span className="toast__message">{t.message}</span>
          <button type="button" className="toast__dismiss" aria-label="Dismiss notification" onClick={() => dismiss(t.id)}>
            &times;
          </button>
        </div>
      ))
    </div>
  );
}
export function ToastProvider({ children }: { children?: ReactNode }) {
  return (
    <>
      {children}
      <ToastViewport />
    </>
  );
}