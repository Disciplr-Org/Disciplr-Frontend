export interface ShortcutEntry {
  key: string;
  description: string;
}

export const SHORTCUTS: ShortcutEntry[] = [
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'Esc', description: 'Close modal or overlay' },
];
