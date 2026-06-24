export interface ClipboardAdapter {
  writeText: (value: string) => Promise<void>;
}

export const browserClipboardAdapter: ClipboardAdapter = {
  async writeText(value: string) {
    if (!navigator.clipboard?.writeText) {
      throw new Error('Clipboard API unavailable.');
    }

    await navigator.clipboard.writeText(value);
  },
};
