import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Text } from "../components/Text";
import Skeleton from "../components/Skeleton";
import Breadcrumb from "../components/Breadcrumb";
import { Pagination } from "../components/Pagination";
import { useWallet } from "../context/WalletContext";
import { getVault, getTransactions } from "../services/vaultService";
import { isValidVaultRouteId } from "../utils/vaultState";
import { getExplorerTxUrl } from "../utils/explorer";
import { truncateMiddle } from "../utils/truncate";
import { formatUsdc } from "../utils/format";
import { computeTxTotals } from "../utils/txTotals";
import { paginate } from "../utils/paginate";
import { readValidationHistoryPageSize } from "../utils/pageSizePref";
import type { Vault, VaultTransaction } from "../types/vault";
import { InvalidIdView, NotFoundView } from "../components/vault/VaultStateViews";

const TX_LABELS: Record<string, string> = {
  create: "Vault Created",
  validate: "Milestone Validated",
  release: "Funds Released",
  redirect: "Funds Redirected",
  unknown: "Unknown Transaction",
};

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Parse the `?page=` search param into a positive integer (default 1). */
function parsePageParam(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default function VaultTransactions() {
  const { id } = useParams<{ id: string }>();
  const { network } = useWallet();
  const [searchParams, setSearchParams] = useSearchParams();

  // Page lives in the URL so it survives refreshes and back/forward.
  const page = parsePageParam(searchParams.get("page"));

  const [loading, setLoading] = useState(true);
  const [vault, setVault] = useState<Vault | null>(null);
  const [transactions, setTransactions] = useState<VaultTransaction[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [pageSize] = useState(() => readValidationHistoryPageSize());

  const isValidId = isValidVaultRouteId(id);

  useEffect(() => {
    if (!isValidId || !id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

    Promise.all([getVault(id), getTransactions(id)])
      .then(([vaultData, txs]) => {
        if (cancelled) return;
        if (!vaultData) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setVault(vaultData);
        setTransactions(txs ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load transactions.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isValidId]);

  useEffect(() => {
    if (vault?.name) {
      document.title = `${vault.name} · Disciplr`;
    }
  }, [vault?.name]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return sortOrder === "desc" ? diff : -diff;
    });
  }, [transactions, sortOrder]);

  const totals = useMemo(() => computeTxTotals(transactions), [transactions]);

  const pagination = useMemo(
    () => paginate(sortedTransactions, page, pageSize),
    [sortedTransactions, page, pageSize],
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      const next = new URLSearchParams(searchParams);
      if (nextPage > 1) next.set("page", String(nextPage));
      else next.delete("page");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Keep ?page within range when the list shrinks or the sort order changes.
  // Guard on a non-empty list so the clamp does not fire while data is loading
  // (an empty list would otherwise reset a deep-linked page back to 1).
  useEffect(() => {
    if (sortedTransactions.length > 0 && page > pagination.currentPage) {
      goToPage(pagination.currentPage);
    }
  }, [sortedTransactions.length, page, pagination.currentPage, goToPage]);

  const handleToggleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    goToPage(1);
  };

  if (!isValidId) {
    return <InvalidIdView id={id ?? ""} />;
  }

  if (loading) {
    return (
      <div style={{ maxWidth: "var(--container-detail, 1024px)", margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
        <Skeleton className="w-full h-12" style={{ marginBottom: "1.5rem" }} />
        <Skeleton className="w-full h-64" />
      </div>
    );
  }

  if (notFound || !vault) {
    return <NotFoundView id={id ?? ""} />;
  }

  return (
    <div style={{ maxWidth: "var(--container-detail, 1024px)", margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <Breadcrumb
        segments={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Vaults", to: "/vaults" },
          { label: vault.name, to: `/vaults/${vault.id}` },
          { label: "Transactions" },
        ]}
      />

      <Link
        to={`/vaults/${vault.id}`}
        style={{
          display: "inline-block",
          marginBottom: "1rem",
          color: "var(--muted)",
          textDecoration: "none",
          fontSize: 13,
        }}
      >
        ← Back to Vault
      </Link>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <Text role="title" as="h1" style={{ margin: 0, marginBottom: "0.25rem" }}>
              {vault.name} Transactions
            </Text>
            <Text role="caption" as="p" style={{ margin: 0, color: "var(--muted)" }}>
              On-chain transaction activity for this vault
            </Text>
          </div>

          <button
            type="button"
            onClick={handleToggleSort}
            aria-label="Toggle sort order"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text)",
              borderRadius: "var(--radius)",
              padding: "0.4rem 0.8rem",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Sort: {sortOrder === "desc" ? "Newest first" : "Oldest first"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ color: "var(--danger)", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {totals.count > 0 && (
        <dl
          aria-label="Transaction totals"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            margin: "0 0 1rem",
            padding: "1rem 1.25rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
          }}
        >
          <div>
            <dt style={{ color: "var(--muted)", fontSize: 12 }}>Transactions</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>
              {totals.count} {totals.count === 1 ? "transaction" : "transactions"}
            </dd>
          </div>
          <div>
            <dt style={{ color: "var(--muted)", fontSize: 12 }}>Total amount</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{formatUsdc(totals.totalAmount)} USDC</dd>
          </div>
          <div>
            <dt style={{ color: "var(--muted)", fontSize: 12 }}>Total fees</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{formatUsdc(totals.totalFees)} USDC</dd>
          </div>
        </dl>
      )}

      {sortedTransactions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
          }}
        >
          <Text role="body" as="p" style={{ color: "var(--muted)", margin: 0 }}>
            No transactions found for this vault.
          </Text>
        </div>
      ) : (
        <>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1.25rem",
            }}
          >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {pagination.items.map((tx) => (
              <div
                key={tx.id}
                data-testid={`vault-tx-${tx.id}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  padding: "0.75rem",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
              >
                <div>
                  <Text
                    role="caption"
                    as="div"
                    style={{ fontWeight: 600, marginBottom: 2 }}
                  >
                    {TX_LABELS[tx.type] ?? tx.type}
                  </Text>
                  <Text role="caption" as="div" style={{ color: "var(--muted)" }}>
                    {fmtDateTime(tx.timestamp)}
                  </Text>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {tx.amount != null && (
                    <Text
                      role="caption"
                      as="span"
                      style={{ color: "var(--text)", fontWeight: 600 }}
                    >
                      {formatUsdc(tx.rawAmount ?? tx.amount)} {vault.currency}
                    </Text>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Text
                      role="mono"
                      as="span"
                      style={{ color: "var(--muted)", fontSize: 11 }}
                    >
                      {truncateMiddle(tx.hash, 8, 6)}
                    </Text>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(tx.hash).catch(() => {});
                      }}
                      title="Copy hash"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--muted)",
                        padding: "0 4px",
                        fontSize: 13,
                        lineHeight: 1,
                      }}
                    >
                      ⎘
                    </button>
                    {(() => {
                      const txUrl = getExplorerTxUrl(tx.hash, network);
                      return txUrl ? (
                        <a
                          href={txUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--accent)", fontSize: 11 }}
                        >
                          ↗
                        </a>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>

          {pagination.pageCount > 1 && (
            <div style={{ marginTop: 24 }}>
              <Pagination
                pagination={pagination}
                onPageChange={goToPage}
                ariaLabel="Vault transaction pagination"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
