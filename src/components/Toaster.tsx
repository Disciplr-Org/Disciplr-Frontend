import { X } from 'lucide-react';
import { useToastStore, type ToastKind } from '../Zustand/Store';
import './Toaster.css';

const toastLabels: Record<ToastKind, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Info',
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="toaster" aria-label="Notifications">
      {toasts.map((toast) => {
        const isError = toast.kind === 'error';

        return (
          <div
            key={toast.id}
            className={`toast toast-${toast.kind}`}
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
          >
            <div className="toast-content">
              <span className="toast-kind">{toastLabels[toast.kind]}</span>
              <p>{toast.message}</p>
            </div>
            <button
              type="button"
              className="toast-dismiss"
              aria-label={`Dismiss ${toastLabels[toast.kind]} toast`}
              onClick={() => dismiss(toast.id)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
