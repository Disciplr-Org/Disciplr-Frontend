import { describe, expect, it } from 'vitest';
import { toCsv } from '../csv';
import type { CsvColumn } from '../csv';

interface CsvFixture {
  id: string;
  name: string;
  notes?: string;
}

const columns: CsvColumn<CsvFixture>[] = [
  { header: 'ID', value: (row) => row.id },
  { header: 'Name', value: (row) => row.name },
  { header: 'Notes', value: (row) => row.notes ?? '' },
];

describe('toCsv', () => {
  it('returns the stable header row when there are no rows', () => {
    expect(toCsv([], columns)).toBe('ID,Name,Notes');
  });

  it('escapes commas, quotes, and newlines in fields', () => {
    const csv = toCsv([
      {
        id: 'v-1',
        name: 'Alpha, Vault',
        notes: 'Reviewer said "ship it"\nSecond line',
      },
    ], columns);

    expect(csv).toBe('ID,Name,Notes\r\nv-1,"Alpha, Vault","Reviewer said ""ship it""\nSecond line"');
  });

  it('preserves unicode values without unnecessary quoting', () => {
    expect(toCsv([
      {
        id: 'v-2',
        name: 'Gamma 基金',
        notes: 'approved',
      },
    ], columns)).toBe('ID,Name,Notes\r\nv-2,Gamma 基金,approved');
  });
});
