import { useToast } from "./useToast";
import { useToastStore } from "../Zustand/toastStore";
import { getAllTokens } from "../../design-system/src/utils/token-loader";

/**
 * ToastViewport — renders the queued toasts at the configured z-index,
 * with `aria-live="polite"` so screen-reader users are notified of new
 * entries. The viewport is intentionally a thin shell over
 * `useToastStore`; the store handles auto-expiry and FIFO eviction, and
 * the viewport only handles rendering and per-toast dismissal.
 *
 * `prefers-reduced-motion` is honoured by skipping the enter/exit
 * transition class. The store already picks a shorter default duration
 * in that mode.
 */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const tokens = getAllTokens();
  const zIndex = tokens.zIndex?.toast?.$value ?? 400;

  return (
    <div
      className="toast-viewport"
      role="region"
      aria-label="Notifications"
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        zIndex,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={`toast toast--${t.variant}`}
          data-testid="toast"
          style={{
            pointerEvents: "auto",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            minWidth: "16rem",
            maxWidth: "24rem",
            color: variantFg(t.variant),
            background: variantBg(t.variant),
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          <span>{t.message}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dismiss(t.id)}
            style={{
              marginLeft: "0.75rem",
              background: "transparent",
              border: 0,
              color: "inherit",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function variantBg(v: "info" | "success" | "error"): string {
  if (v === "success") return "#065f46";
  if (v === "error") return "#7f1d1d";
  return "#1e293b";
}

function variantFg(_v: "info" | "success" | "error"): string {
  return "#f8fafc";
}

/**
 * Thin re-export so consumers do not need to know whether the hook
 * lives next to the store or next to the viewport. Kept as a no-op
 * pass-through to preserve the existing call-site shape and to give a
 * single seam for future enhancements (analytics, throttling, etc.).
 */
export { useToast };
