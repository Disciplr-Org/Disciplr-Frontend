const STORAGE_PREFIX = "disciplr:notifications:";
export const MAX_PERSISTED_NOTIFICATION_IDS = 200;

export type PersistedNotificationState = { read: string[]; dismissed: string[] };

const memory = new Map<string, PersistedNotificationState>();

const keyFor = (address: string | null | undefined): string | null => {
  const value = typeof address === "string" ? address.trim() : "";
  return value ? `${STORAGE_PREFIX}${value}` : null;
};

const cap = (ids: unknown): string[] => {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((id): id is string => typeof id === "string"))].slice(-MAX_PERSISTED_NOTIFICATION_IDS);
};

export function loadNotificationState(address: string | null | undefined): PersistedNotificationState {
  const key = keyFor(address);
  if (!key) return { read: [], dismissed: [] };
  try {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(key);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const value = parsed as Record<string, unknown>;
        const state = { read: cap(value.read), dismissed: cap(value.dismissed) };
        memory.set(key, state);
        return state;
      }
    }
  } catch {
    // Fall through to the in-memory copy or an empty state.
  }
  return memory.get(key) ?? { read: [], dismissed: [] };
}

export function saveNotificationState(
  address: string | null | undefined,
  state: PersistedNotificationState,
): void {
  const key = keyFor(address);
  if (!key) return;
  const safe = { read: cap(state.read), dismissed: cap(state.dismissed) };
  memory.set(key, safe);
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(safe));
  } catch {
    // Storage is optional; in-memory state remains available for this session.
  }
}
