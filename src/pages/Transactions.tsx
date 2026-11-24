import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Text } from "../components/Text";
import { SafeLink } from "../components/SafeLink";
import { Pagination } from "../components/Pagination";
import { listAllActivity, type VaultActivityRecord } from "../services/vaultService";
import { formatDateTime, formatUsdc } from "../utils/format";
import { useOnRecovered } from "../hooks/useOnRecovered";
import { toCsv, downloadCsv } from "../utils/csv";
import { getExplorerTxUrl } from "../utils/explorer";
import { isValidTxHash } from "../utils/vaultState";
import { truncateMiddle } from "../utils/truncate";
import { useWallet } from "../context/WalletContext";
import { paginate } from "../utils/paginate";
import { computeTxTotals } from "../utils/txTotals";
import { sortTransactions } from "../utils/sortTransactions";
import {
  TRANSACTIONS_PAGE_SIZE_OPTIONS,
  persistTransactionsPageSize,
  readTransactionsPageSize,
} from "../utils/pageSizePref";
import {
  parseTransactionsQuery,
  TRANSACTION_SORT_KEYS,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from "../utils/transactionsQuery";

type NetworkName = Parameters<typeof getExplorerTxUrl>[1] | string;

type ActivityExtras = {
  hash?: string;
  fee?: string | number;
  block?: string | number;
  from?: string;
  to?: string;
  memo?: string;
};

const LABEL: Record<VaultActivityRecord["type"], string> = {
  create: "Vault created",
  validate: "Milestone validated",
  release: "Funds released",
  redirect: "Funds redirected",
};

function TxHashCell({ hash, network }: { hash: string | undefined | null; network: NetworkName }) {
  if (!hash || typeof hash !== "string") return <span>—</span>;
  if (!isValidTxHash(hash)) return <span>{truncateMiddle(hash, 8, 6)}</span>;
  return (
    <SafeLink href={getExplorerTxUrl(hash, network)} title={hash}>
      {truncateMiddle(hash, 8, 6)}
    </SafeLink>
  );
}

  const { network } = useWallet();
function useActivityLoader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseTransactionsQuery(searchParams);
  const [rows, setRows] = useState<VaultActivityRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string>("");
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [pageSize, setPageSize] = useState(() => readTransactionsPageSize());

  const refetch = useCallback(() => setReloadVersion((version) => version + 1), []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listAllActivity()
      .then((activity) => {
        if (!cancelled) setRows(activity);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load activity.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadVersion]);

  useOnRecovered(refetch);

  const filteredRows = useMemo(
    () =>
      (rows ?? []).filter(
        (row) =>
          (query.type === "all" || row.type === query.type) &&
          (query.status === "all" || row.status === query.status),
      ),
    [rows, query.type, query.status],
  );
  const sortedRows = useMemo(
    () => sortTransactions(filteredRows, query.sort, query.dir),
    [filteredRows, query.sort, query.dir],
  );
  const totals = useMemo(() => computeTxTotals(filteredRows), [filteredRows]);
  const pagination = useMemo(
    () => paginate(sortedRows, query.page, pageSize),
    [sortedRows, query.page, pageSize],
  );

  const updateQuery = useCallback(
    (key: string, value: string, resetPage = false) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(key, value);
      else next.delete(key);
      if (resetPage) next.delete("page");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const goToPage = useCallback(
    (page: number) => updateQuery("page", page > 1 ? String(page) : ""),
    [updateQuery],
  );

  useEffect(() => {
    if (rows !== null && query.page !== pagination.currentPage) {
      goToPage(pagination.currentPage);
    }
  }, [rows, query.page, pagination.currentPage, goToPage]);

  const updatePageSize = (size: number) => {
    setPageSize(persistTransactionsPageSize(size));
    goToPage(1);
  };

  const handleExport = () => {
    if (!rows || rows.length === 0) return;
    const csvRows = rows.map((r: VaultActivityRecord) => ({
      id: r.id,
      timestamp: r.timestamp,
      type: r.type,
      label: LABEL[r.type] ?? r.type,
      vault: r.vault,
      amount: r.amount,
      hash: (r as VaultActivityRecord & ActivityExtras).hash ?? "",
      status: r.status,
      fee: (r as VaultActivityRecord & ActivityExtras).fee ?? "",
      block: (r as VaultActivityRecord & ActivityExtras).block ?? "",
      from: (r as VaultActivityRecord & ActivityExtras).from ?? "",
      to: (r as VaultActivityRecord & ActivityExtras).to ?? "",
      memo: (r as VaultActivityRecord & ActivityExtras).memo ?? "",
    }));
    const csv = toCsv(csvRows, "transactions");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadCsv(csv, `transactions-${stamp}.csv`);
    setExportMessage(`Exported ${rows.length} transactions.`);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "var(--spacing-4)" }}>
      <Text role="title" as="h1">Transactions</Text>
      <p style={{ color: "var(--muted)" }}>Every create, validate, release and redirect across your vaults.</p>
      <button type="button" onClick={handleExport} disabled={!rows || rows.length === 0}>
        Export CSV
      </button>
      <div aria-live="polite">{exportMessage}</div>
      {error && <p role="alert">{error}</p>}
      {!rows && !error && <p aria-live="polite">Loading activity...</p>}
      {rows && (
        <>
          <section
            aria-label="Transaction filters"
            style={{ display: "flex", flexWrap: "wrap", gap: 12, margin: "16px 0" }}
          >
            <label>
              Event type{" "}
              <select
                aria-label="Filter by event type"
                value={query.type}
                onChange={(event) => updateQuery("type", event.target.value === "all" ? "" : event.target.value, true)}
              >
                <option value="all">All event types</option>
                {TRANSACTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label>
              Status{" "}
              <select
                aria-label="Filter by status"
                value={query.status}
                onChange={(event) => updateQuery("status", event.target.value === "all" ? "" : event.target.value, true)}
              >
                <option value="all">All statuses</option>
                {TRANSACTION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label>
              Sort by{" "}
              <select
                aria-label="Sort transactions by"
                value={query.sort}
                onChange={(event) => updateQuery("sort", event.target.value, true)}
              >
                {TRANSACTION_SORT_KEYS.map((key) => <option key={key} value={key}>{key}</option>)}
              </select>
            </label>
            <label>
              Direction{" "}
              <select
                aria-label="Transaction sort direction"
                value={query.dir}
                onChange={(event) => updateQuery("dir", event.target.value, true)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>
            <label>
              Page size{" "}
              <select
                aria-label="Transactions page size"
                value={pageSize}
                onChange={(event) => updatePageSize(Number(event.target.value))}
              >
                {TRANSACTIONS_PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
            </label>
          </section>
          {rows.length === 0 && (
            <p>No activity yet. <Link to="/vaults/create">Create a vault</Link>.</p>
          )}
          {rows.length > 0 && filteredRows.length === 0 && (
            <p>No transactions match the selected filters.</p>
          )}
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 740 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                <th style={{ padding: 8 }}>When</th>
                <th style={{ padding: 8 }}>Event</th>
                <th style={{ padding: 8 }}>Vault</th>
                <th style={{ padding: 8, textAlign: "right" }}>Amount (USDC)</th>
                <th style={{ padding: 8 }}>Hash</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8, textAlign: "right" }}>Fee (USDC)</th>
              </tr>
            </thead>
            <tbody>
              {pagination.items.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--border, #8883)" }}>
                  <td style={{ padding: 8, whiteSpace: "nowrap" }}>{formatDateTime(r.timestamp)}</td>
                  <td style={{ padding: 8 }}>{LABEL[r.type] ?? r.type}</td>
                  <td style={{ padding: 8 }}>{r.vault}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{formatUsdc(r.amount)}</td>
                  <td style={{ padding: 8, fontFamily: "monospace" }}>
                    <TxHashCell hash={(r as { hash?: string }).hash} network={network} />
                  </td>
                  <td style={{ padding: 8 }}>{r.status}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{formatUsdc(r.fee)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--border, #8883)", fontWeight: 600 }}>
                <td style={{ padding: 8 }} colSpan={3}>
                  Filtered total ({totals.count} {totals.count === 1 ? "transaction" : "transactions"})
                </td>
                <td style={{ padding: 8, textAlign: "right" }}>{formatUsdc(totals.totalAmount)}</td>
                <td />
                <td />
                <td style={{ padding: 8, textAlign: "right" }}>{formatUsdc(totals.totalFees)}</td>
              </tr>
            </tfoot>
          </table>
          </div>
          {pagination.pageCount > 1 && (
            <Pagination pagination={pagination} onPageChange={goToPage} ariaLabel="Transactions pagination" />
          )}
        </>
      )}
    </div>
  );
}
