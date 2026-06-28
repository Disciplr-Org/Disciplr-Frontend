import type { ValidationTask } from '../Zustand/Store';
import type { Transaction } from '../pages/VaultTransactions';

const TASK_HEADERS: string[] = ['ID', 'Status', 'Vault Name', 'Owner', 'Amount', 'Deadline', 'Milestone', 'Notes'];
const TX_HEADERS: string[] = ['ID', 'Type', 'Vault', 'Amount (XLM)', 'Fee (XLM)', 'Status', 'Timestamp', 'Hash', 'Block', 'From', 'To', 'Memo'];
const NON_FINITE_NUMERIC_PLACEHOLDER = '0';

function escapeCell(value: string): string {
  if (value.length > 0 && /^[=+\-@\t\r]/.test(value)) {
    value = `'${value}`;
  }
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Canonical dot-decimal string for CSV amount/fee cells; non-finite values become a safe placeholder. */
function normalizeNumericCell(value: unknown): string {
  if (value === null || value === undefined) {
    return NON_FINITE_NUMERIC_PLACEHOLDER;
  }

  let numeric: number;
  if (typeof value === 'number') {
    numeric = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return NON_FINITE_NUMERIC_PLACEHOLDER;
    }
    numeric = Number(trimmed.replace(/,/g, ''));
  } else {
    return NON_FINITE_NUMERIC_PLACEHOLDER;
  }

  if (!Number.isFinite(numeric)) {
    return NON_FINITE_NUMERIC_PLACEHOLDER;
  }

  return Object.is(numeric, -0) ? '0' : numeric.toString();
}

function taskToRow(task: ValidationTask): string {
  const cells = [
    task.id,
    task.status,
    task.vaultName,
    task.owner,
    task.amount,
    task.deadline,
    task.milestone,
    task.notes ?? '',
  ];
  return cells.map(escapeCell).join(',');
}

function txToRow(tx: Transaction): string {
  const cells = [
    tx.id,
    tx.type,
    tx.vault,
    normalizeNumericCell(tx.amount),
    normalizeNumericCell(tx.fee),
    tx.status,
    tx.timestamp instanceof Date ? tx.timestamp.toISOString() : String(tx.timestamp),
    tx.hash,
    String(tx.block),
    tx.from,
    tx.to,
    tx.memo,
  ];
  return cells.map(escapeCell).join(',');
}

export function toCsv(tasks: ValidationTask[]): string;
export function toCsv(txs: Transaction[], type: 'transactions'): string;
export function toCsv(data: Array<ValidationTask | Transaction>, type?: 'transactions'): string {
  if (type === 'transactions') {
    const headerRow = TX_HEADERS.join(',');
    if (data.length === 0) return headerRow;
    const rows = (data as Transaction[]).map(txToRow);
    return [headerRow, ...rows].join('\r\n');
  } else {
    const headerRow = TASK_HEADERS.join(',');
    if (data.length === 0) return headerRow;
    const rows = (data as ValidationTask[]).map(taskToRow);
    return [headerRow, ...rows].join('\r\n');
  }
}

export function downloadCsv(csv: string, filename: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
