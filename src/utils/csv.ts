export type CsvCell = string | number | boolean | Date | null | undefined;

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => CsvCell;
}

function formatCsvCell(value: CsvCell): string {
  const text = value instanceof Date ? value.toISOString() : String(value ?? '');

  if (!/[",\r\n]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const headerRow = columns.map((column) => column.header);
  const dataRows = rows.map((row) => columns.map((column) => column.value(row)));

  return [headerRow, ...dataRows]
    .map((row) => row.map(formatCsvCell).join(','))
    .join('\r\n');
}
