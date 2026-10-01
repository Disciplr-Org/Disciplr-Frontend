export type TransactionSortKey = "timestamp" | "amount" | "fee" | "type";
export type TransactionSortDir = "asc" | "desc";

interface SortableTransaction {
  timestamp?: Date | string | number | null;
  amount?: number | null;
  fee?: number | null;
  type?: string | null;
}

type SortValue = number | string | null;

function compareMissing(a: SortValue, b: SortValue): number | null {
  const aMissing = a === null || a === "";
  const bMissing = b === null || b === "";

  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return null;
}

function numericValue(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function timestampValue(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const timestamp =
    value instanceof Date
      ? value.getTime()
      : new Date(value as string | number).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function sortValue<T extends SortableTransaction>(
  row: T,
  key: TransactionSortKey,
): SortValue {
  switch (key) {
    case "timestamp":
      return timestampValue(row.timestamp);
    case "amount":
      return numericValue(row.amount);
    case "fee":
      return numericValue(row.fee);
    case "type":
      return row.type ?? null;
  }
}

export function sortTransactions<T extends SortableTransaction>(
  rows: T[],
  key: TransactionSortKey,
  dir: TransactionSortDir,
): T[] {
  const direction = dir === "asc" ? 1 : -1;

  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const leftValue = sortValue(left.row, key);
      const rightValue = sortValue(right.row, key);
      const missing = compareMissing(leftValue, rightValue);
      if (missing !== null) return missing;

      const primary =
        typeof leftValue === "number" && typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue), undefined, {
              sensitivity: "base",
            });

      if (primary !== 0) return primary * direction;
      return left.index - right.index;
    })
    .map(({ row }) => row);
}
