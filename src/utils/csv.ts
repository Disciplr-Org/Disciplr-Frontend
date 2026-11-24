import type { ValidationTask } from '../Zustand/Store';

export type AnalyticsRow = {
  name: string;
  success: number;
  failed: number;
  capital: number;
  milestones: number;
};

/** Transaction row shape consumed by the transactions CSV export. */
export type Transaction = {
  id: string;
  type: string;
  vault: string;
  amount: number | string;
  fee?: number | string | null;
  status: string;
  timestamp: Date | string;
  hash: string;
  block?: number | null;
  from?: string | null;
  to?: string | null;
  memo?: string | null;
};

const TASK_HEADERS: string[] = ['ID', 'Status', 'Vault Name', 'Owner', 'Amount', 'Deadline', 'Milestone', 'Notes'];
const TX_HEADERS: string[] = ['ID', 'Type', 'Vault', 'Amount (USDC)', 'Fee (USDC)', 'Status', 'Timestamp', 'Hash', 'Block', 'From', 'To', 'Memo'];
const ANALYTICS_HEADERS: string[] = ['Period', 'Success %', 'Failed %', 'Capital (USDC)', 'Milestones'];

/** Safe placeholder for amount/fee cells that are not finite numbers after normalization. */
export const NON_FINITE_NUMERIC_PLACEHOLDER = '';

/** Placeholder for optional cells (fee, block) the data source did not provide. */
export const MISSING_VALUE_PLACEHOLDER = '\u2014';

/**
 * Normalizes a numeric CSV cell to a canonical dot-decimal, ungrouped string.
 * Non-finite values (NaN, ±Infinity) and unparseable input resolve to
 * {@link NON_FINITE_NUMERIC_PLACEHOLDER}. Call this before {@link escapeCell}.
 */
export function normalizeNumericCell(value: number | string): string {
  let n: number;
  if (typeof value === 'number') {
    n = value;
  } else if (typeof value === 'string') {
    const stripped = value.replace(/,/g, '').trim();
    if (stripped.length === 0) return NON_FINITE_NUMERIC_PLACEHOLDER;
    n = Number(stripped);
  } else {
    return NON_FINITE_NUMERIC_PLACEHOLDER;
  }

  if (!Number.isFinite(n)) {
    return NON_FINITE_NUMERIC_PLACEHOLDER;
  }

  return new Intl.NumberFormat('en-US', {
    useGrouping: false,
    maximumSignificantDigits: 21,
  }).format(n);
}

export function escapeCell(value: string): string {
  if (value.length > 0 && /^[=+\-@\t\r]/.test(value)) {
    value = `'${value}`;
  }
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function taskToRow(task: ValidationTask): string {
  const cells: string[] = [
    String(task.id),
    String(task.status),
    String(task.vaultName),
    String(task.owner),
    String(task.amount),
    String(task.deadline),
    String(task.milestone),
    task.notes == null ? '' : String(task.notes),
  ];
  return cells.map(escapeCell).join(',');
}

function analyticsRowToRow(row: AnalyticsRow): string {
  const cells: string[] = [
    row.name,
    String(row.success),
    String(row.failed),
    String(row.capital),
    String(row.milestones),
  ];
  return cells.map(escapeCell).join(',');
}

function txToRow(tx: Transaction): string {
  const feeCell: string = tx.fee == null ? MISSING_VALUE_PLACEHOLDER : normalizeNumericCell(tx.fee);
  const blockCell: string = tx.block == null ? MISSING_VALUE_PLACEHOLDER : String(tx.block);
  const timestampCell: string = tx.timestamp instanceof Date ? tx.timestamp.toISOString() : String(tx.timestamp);
  const cells: string[] = [
    tx.id,
    tx.type,
    tx.vault,
    normalizeNumericCell(tx.amount),
    feeCell,
    tx.status,
    timestampCell,
    tx.hash,
    blockCell,
    tx.from ?? '',
    tx.to ?? '',
    tx.memo ?? '',
  ];
  return cells.map(escapeCell).join(',');
}

export function toCsv(tasks: ValidationTask[]): string;
export function toCsv(txs: Transaction[], type: 'transactions'): string;
export function toCsv(rows: AnalyticsRow[], type: 'analytics'): string;
export function toCsv(
  data: ValidationTask[] | Transaction[] | AnalyticsRow[],
  type?: 'transactions' | 'analytics',
): string {
  if (type === 'analytics') {
    const headerRow = ANALYTICS_HEADERS.join(',');
    const rowsIn = data as AnalyticsRow[];
    if (rowsIn.length === 0) return headerRow;
    const rows = rowsIn.map((r) => analyticsRowToRow(r));
    return [headerRow, ...rows].join('\r\n');
  } else if (type === 'transactions') {
    const headerRow = TX_HEADERS.join(',');
    const txs = data as Transaction[];
    if (txs.length === 0) return headerRow;
    const rows = txs.map((t) => txToRow(t));
    return [headerRow, ...rows].join('\r\n');
  } else {
    const headerRow = TASK_HEADERS.join(',');
    const tasks = data as ValidationTask[];
    if (tasks.length === 0) return headerRow;
    const rows = tasks.map((t) => taskToRow(t));
    return [headerRow, ...rows].join('\r\n');
  }
}

export function downloadCsv(csv: string, filename: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
