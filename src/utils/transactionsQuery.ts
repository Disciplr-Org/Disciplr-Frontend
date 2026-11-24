import type { VaultActivityRecord } from "../services/vaultService";
import type { TransactionSortDir, TransactionSortKey } from "./sortTransactions";

export type TransactionTypeFilter = "all" | VaultActivityRecord["type"];
export type TransactionStatusFilter = "all" | VaultActivityRecord["status"];

export interface TransactionsQueryState {
  type: TransactionTypeFilter;
  status: TransactionStatusFilter;
  sort: TransactionSortKey;
  dir: TransactionSortDir;
  page: number;
}

export const TRANSACTION_TYPES: readonly VaultActivityRecord["type"][] = [
  "create",
  "validate",
  "release",
  "redirect",
];
export const TRANSACTION_STATUSES: readonly VaultActivityRecord["status"][] = [
  "confirmed",
  "pending",
  "failed",
];
export const TRANSACTION_SORT_KEYS: readonly TransactionSortKey[] = [
  "timestamp",
  "amount",
  "fee",
  "type",
];

export const DEFAULT_TRANSACTIONS_QUERY: TransactionsQueryState = {
  type: "all",
  status: "all",
  sort: "timestamp",
  dir: "desc",
  page: 1,
};

function parseWhitelistedValue<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return value && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function parseTransactionsPage(value: string | null): number {
  if (!value) return DEFAULT_TRANSACTIONS_QUERY.page;
  const page = Number(value);
  return Number.isInteger(page) && page > 0
    ? page
    : DEFAULT_TRANSACTIONS_QUERY.page;
}

export function parseTransactionsQuery(
  searchParams: URLSearchParams,
): TransactionsQueryState {
  return {
    type: parseWhitelistedValue(
      searchParams.get("type"),
      ["all", ...TRANSACTION_TYPES],
      DEFAULT_TRANSACTIONS_QUERY.type,
    ),
    status: parseWhitelistedValue(
      searchParams.get("status"),
      ["all", ...TRANSACTION_STATUSES],
      DEFAULT_TRANSACTIONS_QUERY.status,
    ),
    sort: parseWhitelistedValue(
      searchParams.get("sort"),
      TRANSACTION_SORT_KEYS,
      DEFAULT_TRANSACTIONS_QUERY.sort,
    ),
    dir: parseWhitelistedValue(
      searchParams.get("dir"),
      ["asc", "desc"],
      DEFAULT_TRANSACTIONS_QUERY.dir,
    ),
    page: parseTransactionsPage(searchParams.get("page")),
  };
}
