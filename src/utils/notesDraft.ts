export const NOTES_DRAFT_STORAGE_PREFIX = 'disciplr:validation-notes-draft:';

export interface NotesDraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getLocalStorage(): NotesDraftStorage | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function getNotesDraftKey(taskId: string): string {
  return `${NOTES_DRAFT_STORAGE_PREFIX}${taskId}`;
}

export function readNotesDraft(
  taskId: string | undefined,
  storage: NotesDraftStorage | undefined = getLocalStorage()
): string {
  if (!taskId || !storage) return '';

  try {
    return storage.getItem(getNotesDraftKey(taskId)) ?? '';
  } catch {
    return '';
  }
}

export function writeNotesDraft(
  taskId: string | undefined,
  notes: string,
  storage: NotesDraftStorage | undefined = getLocalStorage()
): void {
  if (!taskId || !storage) return;

  try {
    const key = getNotesDraftKey(taskId);
    if (notes.trim().length === 0) {
      storage.removeItem(key);
      return;
    }

    storage.setItem(key, notes);
  } catch {
    // Ignore localStorage errors from private mode, quota limits, or disabled storage.
  }
}

export function clearNotesDraft(
  taskId: string | undefined,
  storage: NotesDraftStorage | undefined = getLocalStorage()
): void {
  if (!taskId || !storage) return;

  try {
    storage.removeItem(getNotesDraftKey(taskId));
  } catch {
    // Ignore storage errors.
  }
}
