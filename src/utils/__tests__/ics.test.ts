// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildIcsEvent,
  downloadIcs,
  downloadIcsEvent,
  foldIcsLine,
  icsFilename,
  isValidIcsDeadline,
} from '../ics';

describe('ics utilities', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  let clickSpy: ReturnType<typeof vi.spyOn> | undefined;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:deadline-calendar');
    URL.revokeObjectURL = vi.fn();
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    clickSpy?.mockRestore();
    document.body.innerHTML = '';
  });

  it('builds a CRLF-terminated VCALENDAR event with escaped text values', () => {
    const calendar = buildIcsEvent({
      title: 'Alpha, Vault; Launch',
      deadline: '2026-07-15T12:30:00Z',
      description: 'Line one\nLine two \\ details',
      uid: 'vault-1-deadline',
    });

    expect(calendar).toContain('BEGIN:VCALENDAR\r\n');
    expect(calendar).toContain('VERSION:2.0\r\n');
    expect(calendar).toContain('BEGIN:VEVENT\r\n');
    expect(calendar).toContain('UID:vault-1-deadline\r\n');
    expect(calendar).toContain('DTSTART:20260715T123000Z\r\n');
    expect(calendar).toContain('DURATION:PT30M\r\n');
    expect(calendar).toContain('SUMMARY:Alpha\\, Vault\\; Launch\r\n');
    expect(calendar).toContain('DESCRIPTION:Line one\\nLine two \\\\ details\r\n');
    expect(calendar.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('folds long lines with CRLF and a continuation space', () => {
    const folded = foldIcsLine(`SUMMARY:${'A'.repeat(90)}`);
    const lines = folded.split('\r\n');

    expect(lines).toHaveLength(2);
    expect(lines[0].length).toBeLessThanOrEqual(75);
    expect(lines[1].startsWith(' ')).toBe(true);
  });

  it('guards invalid deadlines', () => {
    expect(isValidIcsDeadline('2026-07-15T12:30:00Z')).toBe(true);
    expect(isValidIcsDeadline('not-a-date')).toBe(false);
    expect(() =>
      buildIcsEvent({
        title: 'Broken deadline',
        deadline: 'not-a-date',
        uid: 'broken',
      })
    ).toThrow(/invalid deadline/i);
  });

  it('creates a safe filename from title or uid', () => {
    expect(icsFilename('Alpha Vault: Deadline!', 'vault-1')).toBe('alpha-vault-deadline.ics');
    expect(icsFilename('***', 'vault-1-deadline')).toBe('vault-1-deadline.ics');
  });

  it('downloads an .ics file and cleans up the Blob URL', () => {
    downloadIcs('BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n', 'alpha.ics');

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:deadline-calendar');
    expect(document.querySelector('a[download="alpha.ics"]')).toBeNull();
  });

  it('does not download invalid events', () => {
    const downloaded = downloadIcsEvent({
      title: 'Broken deadline',
      deadline: 'not-a-date',
      uid: 'broken',
    });

    expect(downloaded).toBe(false);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
