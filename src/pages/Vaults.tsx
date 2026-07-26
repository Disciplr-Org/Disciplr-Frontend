import { useCallback, useEffect, useRef, useState } from "react";
import { Link, MemoryRouter, useInRouterContext } from "react-router-dom";
import { StatusChip } from "../components/StatusChip";
import { Text } from "../components/Text";
import VaultCard from "../components/VaultCard";
import { VaultFilterBar } from "../components/VaultFilterBar";
import { listVaults } from "../services/vaultService";
import type { Vault } from "../types/vault";
import { createVaultPrefillFromVault } from "../utils/vaultPrefill";
import type { VaultFilters } from "../utils/filterVaults";
import { filterVaults, sortVaults } from "../utils/vaultFilter";
import type { VaultSortOptions } from "../utils/vaultFilter";

const STORAGE_KEY = "vaults-view-preference";
const DEFAULT_VIEW: "list" | "grid" = "list";

function getViewPreference(): "list" | "grid" {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "list" || stored === "grid") return stored;
  } catch {
    // localStorage may be disabled
  }
  return DEFAULT_VIEW;
}

function setViewPreference(view: "list" | "grid") {
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // localStorage may be disabled
  }
}

function calculateProgressPct(vault: Vault): number {
  if (!vault.milestones || vault.milestones.length === 0) return 0;
  const validated = vault.milestones.filter(
    (m) => m.status === "validated",
  ).length;
  return Math.round((validated / vault.milestones.length) * 100);
}

const DEFAULT_FETCH = () => listVaults();

function Skeleton() {
  return (
    <div
      data-testid="skeleton"
      style={{
        height: 72,
        background: "var(--surface, #1e293b)",
        border: "1px solid var(--border, #334155)",
        borderRadius: "var(--radius, 8px)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

interface VaultsInnerProps {
  fetchVaults?: () => Promise<Vault[]>;
}

export function VaultsInner({ fetchVaults = DEFAULT_FETCH }: VaultsInnerProps) {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [status, setStatus] = useState<"loading" | "empty" | "data" | "error">(
    "loading",
  );
  const [retryCount, setRetryCount] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "grid">(getViewPreference);

  const [filters, setFilters] = useState<VaultFilters>({ status: "all", query: "" });
  const [sortOptions, setSortOptions] = useState<VaultSortOptions>({
    by: "deadline",
    dir: "asc",
  });

  // Use a ref so changing the fetchVaults prop identity doesn't re-trigger the effect
  const fetchRef = useRef(fetchVaults);
  fetchRef.current = fetchVaults;

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchRef
      .current()
      .then((data) => {
        if (cancelled) return;
        setVaults(data);
        setStatus(data.length === 0 ? "empty" : "data");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [retryCount]); // only re-run on explicit retry

  const retry = useCallback(() => setRetryCount((c) => c + 1), []);

  const handleViewChange = useCallback((newView: "list" | "grid") => {
    setViewMode(newView);
    setViewPreference(newView);
  }, []);

  // Apply filters and sorting
  const filteredVaults = filterVaults(vaults, filters);
  const sortedVaults = sortVaults(filteredVaults, sortOptions);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <Text role="display" as="h1" style={{ marginBottom: "0.25rem" }}>
            Your Vaults
          </Text>
          <Text role="body" as="p" style={{ color: "var(--muted)", margin: 0 }}>
            View and manage your productivity vaults.
          </Text>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div
            role="radiogroup"
            aria-label="View mode"
            style={{
              display: "flex",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "0.25rem",
            }}
          >
            <button
              onClick={() => handleViewChange("list")}
              aria-pressed={viewMode === "list"}
              role="radio"
              aria-checked={viewMode === "list"}
              style={{
                background:
                  viewMode === "list" ? "var(--accent)" : "transparent",
                color: viewMode === "list" ? "var(--bg)" : "var(--muted)",
                border: "none",
                padding: "0.4rem 0.8rem",
                borderRadius: "calc(var(--radius) - 0.25rem)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              List
            </button>
            <button
              onClick={() => handleViewChange("grid")}
              aria-pressed={viewMode === "grid"}
              role="radio"
              aria-checked={viewMode === "grid"}
              style={{
                background:
                  viewMode === "grid" ? "var(--accent)" : "transparent",
                color: viewMode === "grid" ? "var(--bg)" : "var(--muted)",
                border: "none",
                padding: "0.4rem 0.8rem",
                borderRadius: "calc(var(--radius) - 0.25rem)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Grid
            </button>
          </div>
          <Link
            to="/vaults/create"
            style={{
              background: "var(--accent)",
              color: "var(--bg)",
              padding: "0.6rem 1.25rem",
              borderRadius: "var(--radius)",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            + Create Vault
          </Link>
        </div>
      </div>

      <VaultFilterBar value={filters} onChange={setFilters} />

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
          margin: "1rem 0",
          flexWrap: "wrap",
        }}
      >
        <label htmlFor="vault-sort-by" style={{ fontSize: 14, color: "var(--muted)" }}>
          Sort by
        </label>
        <select
          id="vault-sort-by"
          aria-label="Sort vaults by"
          value={sortOptions.by}
          onChange={(e) =>
            setSortOptions((prev) => ({
              ...prev,
              by: e.target.value as VaultSortOptions["by"],
            }))
          }
          style={{
            background: "var(--surface)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "0.5rem 0.75rem",
            fontSize: 14,
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          <option value="deadline">Deadline</option>
          <option value="amount">Amount</option>
        </select>
        <button
          aria-label={`Sort ${sortOptions.dir === "asc" ? "descending" : "ascending"}`}
          onClick={() =>
            setSortOptions((prev) => ({
              ...prev,
              dir: prev.dir === "asc" ? "desc" : "asc",
            }))
          }
          style={{
            background: "var(--surface)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "0.5rem 0.75rem",
            fontSize: 14,
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          {sortOptions.dir === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>
      </div>

      {status === "loading" && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      )}

      {status === "empty" && (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <Text role="body" as="p">
            You don’t have any vaults yet.
          </Text>
          <Link to="/vaults/create">Create your first vault</Link>
        </div>
      )}

      {status === "error" && (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <Text role="body" as="p">
            Failed to load vaults.
          </Text>
          <button onClick={retry}>Retry</button>
        </div>
      )}

      {status === "data" && (
        <>
          {viewMode === "list" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {sortedVaults.map((vault) => (
                <div
                  key={vault.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <Text
                      role="body"
                      as="div"
                      style={{ fontWeight: 600, marginBottom: 4 }}
                    >
                      {vault.name}
                    </Text>
                    <Text
                      role="caption"
                      as="div"
                      style={{ color: "var(--muted)" }}
                    >
                      Deadline:{" "}
                      {new Date(vault.deadline).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <Text
                      role="body"
                      as="span"
                      style={{ fontWeight: 700, color: "var(--accent)" }}
                    >
                      {vault.amount.toLocaleString()} {vault.currency}
                    </Text>
                    <StatusChip status={vault.status} />
                    <Link
                      to={`/vaults/${vault.id}`}
                      style={{
                        color: "var(--accent)",
                        fontSize: 14,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      View Details
                    </Link>
                    <Link
                      to="/vaults/create"
                      state={createVaultPrefillFromVault(vault)}
                      style={{
                        color: "var(--accent)",
                        fontSize: 14,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Duplicate
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          {viewMode === "grid" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1rem",
              }}
            >
              {sortedVaults.map((vault) => (
                <VaultCard
                  key={vault.id}
                  id={vault.id}
                  name={vault.name}
                  amount={vault.amount}
                  currency={vault.currency}
                  status={vault.status}
                  deadline={vault.deadline}
                  progressPct={calculateProgressPct(vault)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Vaults(props: VaultsInnerProps) {
  return <VaultsInner {...props} />;
}
