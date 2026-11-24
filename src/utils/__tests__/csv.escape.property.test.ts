import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { toCsv } from '../csv';
import type { AnalyticsRow } from '../csv';
import type { ValidationTask } from '../../Zustand/Store';
import type { VaultActivityRecord } from '../../services/vaultService';

/**
 * Minimal RFC 4180 reader: quoted fields, "" as an escaped quote, CRLF rows.
 * Used to recover the cells a spreadsheet would actually see.
 */
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"' && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\r' && input[i + 1] === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i++;
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

const DANGEROUS_PREFIXES = ['=', '+', '-', '@', '\t', '\r'] as const;
const DANGEROUS_START = /^[=+\-@\t\r]/;

const baseTask: ValidationTask = {
  id: 'v-001',
  vaultName: 'Alpha Vault',
  owner: 'GOWNER...ALPHA',
  amount: '100 USDC',
  deadline: '2026-01-01',
  status: 'approved',
  milestone: 'Launch',
  notes: '',
};

const baseTx: VaultActivityRecord = {
  id: 'tx-001',
  type: 'create',
  vault: 'Alpha Vault',
  amount: 100,
  fee: 0,
  block: 1,
  hash: 'hash123',
  status: 'confirmed',
  from: 'G1',
  to: 'G2',
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
  memo: '',
};

const baseAnalytics: AnalyticsRow = {
  name: 'Week 1',
  success: 100,
  failed: 0,
  capital: 500,
  milestones: 2,
};

const MODES = ['task', 'transactions', 'analytics'] as const;
type Mode = (typeof MODES)[number];

/** Returns the parsed value of the free-text cell for the given export mode. */
function parsedFreeTextCell(mode: Mode, text: string): string {
  if (mode === 'task') {
    const csv = toCsv([{ ...baseTask, notes: text }]);
    return parseCsv(csv)[1][7];
  }
  if (mode === 'transactions') {
    const csv = toCsv([{ ...baseTx, memo: text }], 'transactions');
    return parseCsv(csv)[1][11];
  }
  const csv = toCsv([{ ...baseAnalytics, name: text }], 'analytics');
  return parseCsv(csv)[1][0];
}

/** Arbitrary strings that reliably mix in commas, quotes, newlines and prefixes. */
const noisyString = fc
  .array(
    fc.oneof(
      fc.string(),
      fc.constantFrom('"', ',', '\n', '\r', '\t', '=', '+', '-', '@', ' ', 'a', '1'),
    ),
    { maxLength: 8 },
  )
  .map((parts) => parts.join(''));

/** Arbitrary text stitched from a dangerous prefix and an arbitrary remainder. */
const prefixedString = fc
  .tuple(fc.constantFrom(...DANGEROUS_PREFIXES), fc.string())
  .map(([prefix, rest]) => `${prefix}${rest}`);

describe('CSV escapeCell property: formula prefix neutralisation', () => {
  // Feature: csv-escape-property, Property 1: parsed cells never begin with a formula prefix
  it('never yields a parsed cell starting with a dangerous character', () => {
    fc.assert(
      fc.property(noisyString, fc.constantFrom(...MODES), (text, mode) => {
        const cell = parsedFreeTextCell(mode, text);
        expect(DANGEROUS_START.test(cell)).toBe(false);
      }),
      { numRuns: 250 },
    );
  });

  // Feature: csv-escape-property, Property 2: every formula prefix is neutralised by a leading quote
  it('prefixes every dangerous character with a single quote in all modes', () => {
    fc.assert(
      fc.property(prefixedString, fc.constantFrom(...MODES), (text, mode) => {
        const cell = parsedFreeTextCell(mode, text);
        expect(cell.startsWith("'")).toBe(true);
        // The original text survives intact behind the neutralising quote.
        expect(cell.slice(1)).toBe(text);
      }),
      { numRuns: 250 },
    );
  });

  // Feature: csv-escape-property, Property 3: commas, quotes and newlines round-trip
  it('round-trips cells containing commas, quotes or newlines through the reader', () => {
    fc.assert(
      fc.property(noisyString, fc.constantFrom(...MODES), (text, mode) => {
        const cell = parsedFreeTextCell(mode, text);
        const expected = DANGEROUS_START.test(text) ? `'${text}` : text;
        expect(cell).toBe(expected);
      }),
      { numRuns: 250 },
    );
  });

  it('round-trips text mixing a prefix, quotes, commas and CRLF', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...DANGEROUS_PREFIXES),
        fc.string(),
        fc.constantFrom(...MODES),
        (prefix, rest, mode) => {
          const text = `${prefix}${rest},"quoted",\r\nnext`;
          const cell = parsedFreeTextCell(mode, text);
          expect(cell).toBe(`'${text}`);
        },
      ),
      { numRuns: 250 },
    );
  });
});
