import { describe, it, expect } from 'vitest';
import { SHORTCUTS, type ShortcutEntry } from '../shortcuts';

describe('SHORTCUTS registry', () => {
  it('exports an array', () => {
    expect(Array.isArray(SHORTCUTS)).toBe(true);
  });

  it('each entry has a non-empty key and description', () => {
    SHORTCUTS.forEach((entry: ShortcutEntry) => {
      expect(typeof entry.key).toBe('string');
      expect(entry.key.length).toBeGreaterThan(0);
      expect(typeof entry.description).toBe('string');
      expect(entry.description.length).toBeGreaterThan(0);
    });
  });

  it('contains a ? entry that opens the shortcuts overlay', () => {
    const entry = SHORTCUTS.find(s => s.key === '?');
    expect(entry).toBeDefined();
    expect(entry?.description).toMatch(/keyboard shortcut/i);
  });

  it('contains an Esc entry for closing modals', () => {
    const entry = SHORTCUTS.find(s => s.key === 'Esc');
    expect(entry).toBeDefined();
    expect(entry?.description).toMatch(/close/i);
  });

  it('has no duplicate keys', () => {
    const keys = SHORTCUTS.map(s => s.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it('ShortcutEntry type enforces key and description fields', () => {
    const entry: ShortcutEntry = { key: 'x', description: 'test' };
    expect(entry.key).toBe('x');
    expect(entry.description).toBe('test');
  });
});
