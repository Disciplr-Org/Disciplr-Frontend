import { useCallback, useEffect, useState } from "react";
import { ACTIVITY, DEADLINES } from "../fixtures/dashboard";
import { isApiEnabled, type ApiStats } from "../services/api";
import {
  getStats,
  listTransactionsForVaults,
  listVaults,
} from "../services/vaultService";
import type { Activity, Deadline, VaultPreview } from "../utils/dashboard";
import {
  deriveActivity,
  deriveDeadlines,
  mergeUserVaults,
  sortActiveFirst,
} from "../utils/dashboardDerive";
import {
  toSafePreviews,
  type AcceptedVault,
  type VaultLoadFailureCode,
} from "../utils/dashboardParse";
import { logger } from "../utils/logger";
import { useOnRecovered } from "./useOnRecovered";

export type DashboardVaultStatus = "loading" | "empty" | "data" | "error";

export interface DashboardDataState {
  status: DashboardVaultStatus;
  loading: boolean;
  error: boolean;
  data: {
    vaults: VaultPreview[];
    fullVaults: AcceptedVault[];
    activity: Activity[];
    deadlines: Deadline[];
    stats: ApiStats | null;
    rejectedCount: number;
  };
  retry: () => void;
}

/** Stable empty identities so render-time gating never invalidates memos. */
const NO_VAULTS: VaultPreview[] = [];
const NO_ACCEPTED_VAULTS: AcceptedVault[] = [];
const NO_ACTIVITY: Activity[] = [];
const NO_DEADLINES: Deadline[] = [];

/**
 * Loads and scopes dashboard vault data for the connected wallet address.
 * Refetches automatically when connectivity recovers via `useOnRecovered`.
 */
export function useDashboardData(address: string | null): DashboardDataState {
  const [vaults, setVaults] = useState<VaultPreview[]>(NO_VAULTS);
  const [fullVaults, setFullVaults] = useState<AcceptedVault[]>(NO_ACCEPTED_VAULTS);
  const [activity, setActivity] = useState<Activity[]>(NO_ACTIVITY);
  const [deadlines, setDeadlines] = useState<Deadline[]>(NO_DEADLINES);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const rejectedCount = 0;
  // `loadedFor` records which wallet the data on screen belongs to, so data for
  // a previous wallet is never rendered after a switch (see isCurrent below).
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [vaultStatus, setVaultStatus] = useState<DashboardVaultStatus>("loading");
  const [retryCount, setRetryCount] = useState(0);

  // Load the connected wallet's vaults. Each run owns a `cancelled` flag that
  // its cleanup flips, so a slow response for the previous wallet can never
  // overwrite the new wallet's data. Concurrent identical requests are
  // de-duplicated by the service cache.
  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setVaultStatus("loading");
    setLoadedFor(null);
    setVaults(NO_VAULTS);
    setFullVaults(NO_ACCEPTED_VAULTS);
    setActivity(NO_ACTIVITY);
    setDeadlines(NO_DEADLINES);
    setStats(null);

    (async () => {
      // The API has no ?verifier= yet: fetch creator-scoped vaults plus the full
      // list, then pick out vaults this address verifies client-side.
      const [created, all, creatorStats] = await Promise.all([
        listVaults({ creator: address }),
        listVaults(),
        getStats({ creator: address }).catch(() => null),
      ]);
      const mine = mergeUserVaults(created, all, address);
      const txs = await listTransactionsForVaults(mine).catch(() => []);
      return { mine, txs, creatorStats };
    })()
      .then(({ mine, txs, creatorStats }) => {
        if (cancelled) return;
        const safePreviews = sortActiveFirst(toSafePreviews(mine));
        setFullVaults(mine as AcceptedVault[]);
        setVaults(safePreviews);
        setStats(creatorStats);
        // Fixtures are used for offline mode only.
        setActivity(isApiEnabled() ? deriveActivity(txs, mine) : ACTIVITY);
        setDeadlines(isApiEnabled() ? deriveDeadlines(mine) : DEADLINES);
        setLoadedFor(address);
        setVaultStatus(safePreviews.length === 0 ? "empty" : "data");
      })
      .catch(() => {
        if (cancelled) return;
        logger.error("[dashboard] vault_load_failed", {
          code: "unavailable" satisfies VaultLoadFailureCode,
          attempt: retryCount + 1,
        });
        setLoadedFor(address);
        setVaultStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [address, retryCount]);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  useOnRecovered(retry);

  // INVARIANT: wallet-derived state is surfaced only in the "data" state AND
  // only for the wallet it was loaded for. Gating at render time means the
  // summary cards can never contradict the vault list or show a previous
  // wallet's data during a switch.
  const isCurrent = address !== null && loadedFor === address;
  const showData = vaultStatus === "data" && isCurrent;
  const viewStatus: DashboardVaultStatus = isCurrent ? vaultStatus : "loading";

  return {
    status: viewStatus,
    loading: viewStatus === "loading",
    error: viewStatus === "error",
    data: {
      vaults: showData ? vaults : NO_VAULTS,
      fullVaults: showData ? fullVaults : NO_ACCEPTED_VAULTS,
      activity: showData ? activity : NO_ACTIVITY,
      deadlines: showData ? deadlines : NO_DEADLINES,
      stats: showData ? stats : null,
      rejectedCount: showData ? rejectedCount : 0,
    },
    retry,
  };
}
