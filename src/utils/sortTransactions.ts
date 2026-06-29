export type TransactionSortKey = "timestamp" | "amount" | "fee" | "type";
export type TransactionSortDir = "asc" | "desc";

type SortableTransaction = {
  timestamp?: Date | string | number | null;
  amount?: number | string | null;
  fee?: number | string | null;
  type?: string | null;
};

function numericValue(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function timestampValue(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function compareValues<T extends SortableTransaction>(
  a: T,
  b: T,
  key: TransactionSortKey,
): number {
  if (key === "timestamp") {
    return timestampValue(a.timestamp) - timestampValue(b.timestamp);
  }
  if (key === "amount" || key === "fee") {
    return numericValue(a[key]) - numericValue(b[key]);
  }
  return String(a.type ?? "").localeCompare(String(b.type ?? ""), "en", {
    sensitivity: "base",
  });
}

export function sortTransactions<T extends SortableTransaction>(
  rows: readonly T[],
  key: TransactionSortKey,
  dir: TransactionSortDir,
): T[] {
  const direction = dir === "asc" ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const result = compareValues(a.row, b.row, key);
      if (result !== 0) return result * direction;
      return a.index - b.index;
    })
    .map(({ row }) => row);
}
