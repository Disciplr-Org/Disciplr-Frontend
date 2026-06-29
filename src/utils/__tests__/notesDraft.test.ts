// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearNotesDraft, readNotesDraft, writeNotesDraft } from '../notesDraft';

describe('notesDraft storage helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('reads and writes a draft per task id', () => {
    writeNotesDraft('v-101', 'Check audit evidence');
    writeNotesDraft('v-202', 'Different draft');

    expect(readNotesDraft('v-101')).toBe('Check audit evidence');
    expect(readNotesDraft('v-202')).toBe('Different draft');
  });

  it('clears a task draft', () => {
    writeNotesDraft('v-101', 'temporary notes');

    clearNotesDraft('v-101');

    expect(readNotesDraft('v-101')).toBe('');
  });

  it('does nothing when task id is missing', () => {
    writeNotesDraft(undefined, 'ignored');
    clearNotesDraft(undefined);

    expect(readNotesDraft(undefined)).toBe('');
    expect(window.localStorage.length).toBe(0);
  });

  it('falls back safely when storage throws', () => {
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(window.localStorage.__proto__, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => writeNotesDraft('v-101', 'notes')).not.toThrow();
    expect(() => clearNotesDraft('v-101')).not.toThrow();
    expect(readNotesDraft('v-101')).toBe('');
  });
});
