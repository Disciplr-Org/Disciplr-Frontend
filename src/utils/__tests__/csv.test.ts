import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValidationTask } from '../../Zustand/Store';
import { downloadCsv, toCsv } from '../csv';

const baseTask = (overrides: Partial<ValidationTask> = {}): ValidationTask => ({
  id: 'v-001',
  vaultName: 'Alpha Vault',
  owner: 'GOWNER...ALPHA',
  amount: '1,000 USDC',
  deadline: '2026-01-01',
  daysRemaining: 0,
  status: 'approved',
  milestone: 'Launch',
  ...overrides,
});

describe('toCsv', () => {
  const HEADER = 'ID,Status,Vault Name,Owner,Amount,Deadline,Milestone,Notes';

  it('returns just the header row for an empty array', () => {
    expect(toCsv([])).toBe(HEADER);
  });

  it('produces a single data row with no special characters', () => {
    const task = baseTask();
    const result = toCsv([task]);
    const lines = result.split('\r\n');
    expect(lines[0]).toBe(HEADER);
    expect(lines[1]).toBe("v-001,approved,Alpha Vault,GOWNER...ALPHA,\"1,000 USDC\",2026-01-01,Launch,");
    expect(lines).toHaveLength(2);
  });

  it('escapes commas by wrapping the field in double quotes', () => {
    const task = baseTask({ vaultName: 'Alpha, Vault & Co.' });
    const result = toCsv([task]);
    expect(result).toContain('"Alpha, Vault & Co."');
  });

  it('escapes double quotes by doubling them', () => {
    const task = baseTask({ vaultName: 'Alpha "Main" Vault' });
    const result = toCsv([task]);
    expect(result).toContain('"Alpha ""Main"" Vault"');
  });

  it('escapes newlines by wrapping the field in double quotes', () => {
    const task = baseTask({ notes: 'Line one\nLine two' });
    const result = toCsv([task]);
    expect(result).toContain('"Line one\nLine two"');
  });

  it('escapes carriage returns by wrapping the field in double quotes', () => {
    const task = baseTask({ notes: 'Line one\r\nLine two' });
    const result = toCsv([task]);
    expect(result).toContain('"Line one\r\nLine two"');
  });

  it('handles fields with mixed special characters', () => {
    const task = baseTask({
      vaultName: 'Test, Co.',
      notes: 'He said "hello"\nNext line',
    });
    const result = toCsv([task]);
    expect(result).toContain('"Test, Co."');
    expect(result).toContain('"He said ""hello""\nNext line"');
  });

  it('handles undefined notes as empty string', () => {
    const task = baseTask({ notes: undefined });
    const result = toCsv([task]);
    const lines = result.split('\r\n');
    const cells = lines[1].split(',');
    expect(cells[cells.length - 1]).toBe('');
  });

  it('handles multiple rows', () => {
    const tasks = [
      baseTask({ id: 'v-001', vaultName: 'Alpha' }),
      baseTask({ id: 'v-002', vaultName: 'Beta' }),
    ];
    const result = toCsv(tasks);
    const lines = result.split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('v-001');
    expect(lines[2]).toContain('v-002');
  });

  it('preserves Unicode in vault names', () => {
    const task = baseTask({ vaultName: 'Caf? & r?serv?' });
    const result = toCsv([task]);
    expect(result).toContain('Caf? & r?serv?');
  });

  it('preserves Unicode in notes', () => {
    const task = baseTask({ notes: '???? ?' });
    const result = toCsv([task]);
    expect(result).toContain('???? ?');
  });

  it('separates rows with CRLF', () => {
    const tasks = [
      baseTask({ id: 'v-001' }),
      baseTask({ id: 'v-002' }),
    ];
    const result = toCsv(tasks);
    const parts = result.split('\r\n');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe(HEADER);
    expect(parts[1]).toContain('v-001');
    expect(parts[2]).toContain('v-002');
  });

  it('preserves the stable header column order', () => {
    const result = toCsv([]);
    expect(result).toBe('ID,Status,Vault Name,Owner,Amount,Deadline,Milestone,Notes');
  });
});

describe('downloadCsv', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('is a no-op when document is undefined', () => {
    const orig = global.document;
    (global as any).document = undefined;
    expect(() => downloadCsv('a,b', 'test.csv')).not.toThrow();
    (global as any).document = orig;
  });

  it('creates a blob and triggers a download', () => {
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const click = vi.fn();
    const setAttribute = vi.fn();

    const createElement = vi.fn(() => ({
      setAttribute,
      click,
      style: {},
    }));

    const origDocument = global.document;
    const origURL = global.URL;
    (global as any).document = {
      createElement,
      body: { appendChild, removeChild },
    };
    (global as any).URL = {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    };

    downloadCsv('a,b,c', 'test.csv');

    expect(createElement).toHaveBeenCalledWith('a');
    expect(setAttribute).toHaveBeenCalledWith('download', 'test.csv');
    expect(appendChild).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();

    (global as any).document = origDocument;
    (global as any).URL = origURL;
  });

  it('appends, clicks, removes, and revokes the download link in order', () => {
    const order: string[] = [];
    const origURL = global.URL;
    const createdLink = document.createElement('a');
    const click = vi.spyOn(createdLink, 'click').mockImplementation(() => {
      order.push('click');
    });
    const createElement = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(createdLink);
    const appendChild = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node: Node) => {
        order.push('append');
        return node;
      });
    const removeChild = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation((node: Node) => {
        order.push('remove');
        return node;
      });
    const createObjectURL = vi.fn(() => {
        order.push('create-url');
        return 'blob:csv-download';
      });
    const revokeObjectURL = vi.fn(() => {
        order.push('revoke-url');
      });
    (global as any).URL = {
      ...origURL,
      createObjectURL,
      revokeObjectURL,
    };

    downloadCsv('id,status\r\nv-001,approved', 'validation-history.csv');

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(createElement).toHaveBeenCalledWith('a');
    expect(createdLink.getAttribute('href')).toBe('blob:csv-download');
    expect(createdLink.getAttribute('download')).toBe('validation-history.csv');
    expect(createdLink.style.display).toBe('none');
    expect(appendChild).toHaveBeenCalledWith(createdLink);
    expect(click).toHaveBeenCalledTimes(1);
    expect(removeChild).toHaveBeenCalledWith(createdLink);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv-download');
    expect(order).toEqual(['create-url', 'append', 'click', 'remove', 'revoke-url']);

    (global as any).URL = origURL;
  });

  it('is a no-op when URL is undefined', () => {
    const origURL = global.URL;
    const createElement = vi.spyOn(document, 'createElement');
    (global as any).URL = undefined;

    expect(() => downloadCsv('a,b', 'test.csv')).not.toThrow();
    expect(createElement).not.toHaveBeenCalled();

    (global as any).URL = origURL;
  });
});
