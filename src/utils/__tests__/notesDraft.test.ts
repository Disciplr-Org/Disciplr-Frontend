import { describe, expect, it, vi } from 'vitest';
import {
  clearNotesDraft,
  getNotesDraftKey,
  NOTES_DRAFT_STORAGE_PREFIX,
  readNotesDraft,
  type NotesDraftStorage,
  writeNotesDraft,
} from '../notesDraft';

function createStorage(seed: Record<string, string> = {}): NotesDraftStorage & {
  data: Record<string, string>;
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
} {
  const data = { ...seed };

  return {
    data,
    getItem: vi.fn((key: string) => data[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete data[key];
    }),
  };
}

describe('notesDraft', () => {
  it('builds namespaced keys per validation task', () => {
    expect(getNotesDraftKey('v-101')).toBe(`${NOTES_DRAFT_STORAGE_PREFIX}v-101`);
  });

  it('reads saved notes for a task', () => {
    const key = getNotesDraftKey('v-101');
    const storage = createStorage({ [key]: 'Looks valid so far.' });

    expect(readNotesDraft('v-101', storage)).toBe('Looks valid so far.');
  });

  it('returns an empty draft when taskId is missing', () => {
    const storage = createStorage();

    expect(readNotesDraft(undefined, storage)).toBe('');
    writeNotesDraft(undefined, 'draft', storage);
    clearNotesDraft(undefined, storage);

    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('does not persist empty notes', () => {
    const key = getNotesDraftKey('v-101');
    const storage = createStorage({ [key]: 'Previous draft' });

    writeNotesDraft('v-101', '   ', storage);

    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).toHaveBeenCalledWith(key);
    expect(storage.data[key]).toBeUndefined();
  });

  it('writes and clears notes for a task', () => {
    const key = getNotesDraftKey('v-101');
    const storage = createStorage();

    writeNotesDraft('v-101', 'Needs another proof link.', storage);
    expect(storage.data[key]).toBe('Needs another proof link.');

    clearNotesDraft('v-101', storage);
    expect(storage.data[key]).toBeUndefined();
  });

  it('ignores storage read, write, and remove failures', () => {
    const storage: NotesDraftStorage = {
      getItem: vi.fn(() => {
        throw new Error('storage unavailable');
      }),
      setItem: vi.fn(() => {
        throw new Error('quota exceeded');
      }),
      removeItem: vi.fn(() => {
        throw new Error('private mode');
      }),
    };

    expect(readNotesDraft('v-101', storage)).toBe('');
    expect(() => writeNotesDraft('v-101', 'draft', storage)).not.toThrow();
    expect(() => writeNotesDraft('v-101', '', storage)).not.toThrow();
    expect(() => clearNotesDraft('v-101', storage)).not.toThrow();
  });
});
