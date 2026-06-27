import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    const task = baseTask({ vaultName: 'Café & réservé' });
    const result = toCsv([task]);
    expect(result).toContain('Café & réservé');
  });

  it('preserves Unicode in notes', () => {
    const task = baseTask({ notes: '验证通过 ✓' });
    const result = toCsv([task]);
    expect(result).toContain('验证通过 ✓');
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

  it('escapes commas in transactions by wrapping the field in double quotes', () => {
    const tx = {
      id: 'tx-001',
      type: 'create' as const,
      vault: 'Alpha, Vault',
      amount: 100,
      fee: 0.0001,
      status: 'confirmed' as const,
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
      hash: 'hash123',
      block: 12345,
      from: 'G1',
      to: 'G2',
      memo: 'Initial, deposit',
    };
    const result = toCsv([tx], 'transactions');
    expect(result).toContain('"Alpha, Vault"');
    expect(result).toContain('"Initial, deposit"');
  });

  describe('CSV injection mitigation', () => {
    it('escapes cells starting with =', () => {
      const task = baseTask({ vaultName: '=cmd' });
      const result = toCsv([task]);
      expect(result).toContain("v-001,approved,'=cmd,");
    });

    it('escapes cells starting with +', () => {
      const task = baseTask({ vaultName: '+1-1' });
      const result = toCsv([task]);
      expect(result).toContain("v-001,approved,'+1-1,");
    });

    it('escapes cells starting with -', () => {
      const task = baseTask({ vaultName: '-1+1' });
      const result = toCsv([task]);
      expect(result).toContain("v-001,approved,'-1+1,");
    });

    it('escapes cells starting with @', () => {
      const task = baseTask({ vaultName: '@SUM' });
      const result = toCsv([task]);
      expect(result).toContain("v-001,approved,'@SUM,");
    });

    it('escapes cells starting with tab', () => {
      const task = baseTask({ vaultName: '\tcmd' });
      const result = toCsv([task]);
      expect(result).toContain("v-001,approved,'\tcmd,");
    });

    it('escapes cells starting with CR', () => {
      const task = baseTask({ vaultName: '\rcmd' });
      const result = toCsv([task]);
      // Should prepend ' and since it has a CR, also escape and quote it
      expect(result).toContain('v-001,approved,"\'\rcmd",');
    });

    it('does not escape benign positive numbers', () => {
      const task = baseTask({ vaultName: '123' });
      const result = toCsv([task]);
      expect(result).toContain('v-001,approved,123,');
    });

    it('does not escape empty cells or cells starting with normal characters', () => {
      const task = baseTask({ vaultName: 'Alpha Vault', notes: '' });
      const result = toCsv([task]);
      expect(result).toContain('v-001,approved,Alpha Vault,GOWNER...ALPHA,"1,000 USDC",2026-01-01,Launch,');
    });
  });
});

describe('downloadCsv', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is a no-op when URL is undefined', () => {
    const createElement = vi.fn();
    const appendChild = vi.fn();
    const removeChild = vi.fn();

    vi.stubGlobal('document', {
      createElement,
      body: { appendChild, removeChild },
    } as unknown as Document);
    vi.stubGlobal('URL', undefined as unknown as typeof URL);

    expect(() => downloadCsv('a,b', 'test.csv')).not.toThrow();
    expect(createElement).not.toHaveBeenCalled();
    expect(appendChild).not.toHaveBeenCalled();
    expect(removeChild).not.toHaveBeenCalled();
  });

  it('creates an anchor, wires the blob url, and cleans up in order', () => {
    const lifecycle: string[] = [];
    const anchor = {
      click: vi.fn(() => lifecycle.push('click')),
      setAttribute: vi.fn(),
      style: {},
    } as unknown as HTMLAnchorElement;

    const createElement = vi.fn(() => anchor);
    const appendChild = vi.fn((node: Node) => {
      lifecycle.push('appendChild');
      return node;
    });
    const removeChild = vi.fn((node: Node) => {
      lifecycle.push('removeChild');
      return node;
    });

    vi.stubGlobal('document', {
      createElement,
      body: { appendChild, removeChild },
    } as unknown as Document);

    const createObjectURL = vi.fn(() => {
      lifecycle.push('createObjectURL');
      return 'blob:mock';
    });
    const revokeObjectURL = vi.fn(() => {
      lifecycle.push('revokeObjectURL');
    });

    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    } as unknown as typeof URL);

    downloadCsv('a,b,c', 'test.csv');

    expect(createElement).toHaveBeenCalledWith('a');
    expect(anchor.setAttribute).toHaveBeenCalledWith('href', 'blob:mock');
    expect(anchor.setAttribute).toHaveBeenCalledWith('download', 'test.csv');
    expect(appendChild).toHaveBeenCalledWith(anchor);
    expect(anchor.click).toHaveBeenCalledTimes(1);
    expect(removeChild).toHaveBeenCalledWith(anchor);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    expect(lifecycle).toEqual([
      'createObjectURL',
      'appendChild',
      'click',
      'removeChild',
      'revokeObjectURL',
    ]);
  });
});
