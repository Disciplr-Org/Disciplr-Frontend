import type { Milestone, Vault, VaultStatus } from "../types/vault";
import type { VaultPreview } from "./dashboard";
import { validateVaultPreview } from "./dashboardValidation";
import { logger } from "./logger";
import { vaultProgressPct } from "./vaultLifecycle";
import {
  isValidVaultRouteId,
  isNonEmptyString,
  isVaultStatus,
  isPositiveAmount,
  isValidCurrency,
  isValidIsoTimestamp,
} from "./vaultState";

/**
 * Stable, aggregatable failure codes. These are the only values recorded for a
 * load failure: no vault names, ids, addresses, amounts, or raw error messages
 * cross this boundary, so a failure stays diagnosable without leaking user
 * data into logs or metrics.
 */
export type VaultLoadFailureCode = "unavailable" | "invalid_response";

/**
 * A vault that cleared the boundary. `milestones` is narrowed to a real array
 * of objects because `computeDashboardSummary` dereferences
 * `milestone.status` while counting pending milestones.
 */
export type AcceptedVault = Vault & { milestones: Milestone[] };

export type VaultListDiscardReason =
  | "not_an_array"
  | "all_entries_invalid";

export interface VaultListRead {
  /** Vaults that cleared the boundary, in response order, ids unique. */
  accepted: AcceptedVault[];
  /** Entries refused: malformed, hostile, or a repeated id. */
  rejected: number;
  /**
   * True when the payload yielded nothing renderable even though it claimed to
   * carry vaults (or was not an array). The page must show a retryable error
   * here rather than the "No vaults yet" empty state, which would assert a
   * falsehood.
   */
  unusable: boolean;
  /** Reason the payload was marked unusable, when applicable. */
  reason?: VaultListDiscardReason;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validates one service entry against exactly the fields this page consumes:
 * id, name, status, amount, currency, createdAt, deadline and milestones.
 * Fields the dashboard never renders (addresses, transactions, milestone
 * details) are deliberately not gated — refusing to show a summary because an
 * unrendered address is oddly shaped would drop real vaults for no user benefit.
 *
 * Returns null for anything that must not reach render.
 */
export function readVaultEntry(entry: unknown): AcceptedVault | null {
  if (!isRecord(entry)) return null;

  const { id, name, status, amount, currency, createdAt, deadline, milestones } =
    entry;

  // The id becomes a React key and a `/vaults/:id` URL segment, so it must be a
  // safe, bounded, non-prototype string.
  if (!isValidVaultRouteId(id)) return null;
  if (!isNonEmptyString(name)) return null;
  if (!isVaultStatus(status)) return null;
  // A non-finite amount would render as "NaN" and poison totalLocked.
  if (!isPositiveAmount(amount)) return null;
  if (!isValidCurrency(currency)) return null;
  if (!isValidIsoTimestamp(createdAt)) return null;
  if (!isValidIsoTimestamp(deadline)) return null;
  if (!Array.isArray(milestones)) return null;

  // A deadline at or before creation is an impossible vault; timelineProgress
  // would report it as 0% or 100% without ever saying why.
  if (new Date(deadline).getTime() <= new Date(createdAt).getTime()) {
    return null;
  }

  return {
    ...(entry as unknown as Vault),
    // Milestone elements are untrusted too: drop holes rather than let the
    // summary's `milestone.status` read dereference null.
    milestones: milestones.filter(isRecord) as unknown as Milestone[],
  };
}

/**
 * Applies the boundary to a whole service payload.
 *
 * Invariants:
 * - A non-array payload is unusable, never an empty vault list.
 * - Ids are unique: a repeated id is refused, so React keys stay unique and a
 *   duplicated record cannot be counted twice in the summary.
 * - Refusing one entry never discards its siblings (partial failure tolerance).
 */
export function readVaultList(payload: unknown): VaultListRead {
  if (!Array.isArray(payload)) {
    return {
      accepted: [],
      rejected: 0,
      unusable: true,
      reason: "not_an_array",
    };
  }

  const accepted: AcceptedVault[] = [];
  const seenIds = new Set<string>();
  let rejected = 0;

  for (const entry of payload) {
    const vault = readVaultEntry(entry);
    if (vault === null || seenIds.has(vault.id)) {
      rejected++;
      continue;
    }
    seenIds.add(vault.id);
    accepted.push(vault);
  }

  const unusable = payload.length > 0 && accepted.length === 0;
  return {
    accepted,
    rejected,
    unusable,
    ...(unusable ? { reason: "all_entries_invalid" } : {}),
  };
}

/**
 * Invariant: only vaults whose preview passes validation are rendered.
 * Invalid entries are dropped and logged (no sensitive fields) so that
 * malformed upstream data cannot produce inconsistent summaries or cards.
 */
export function toSafePreviews(loaded: Vault[]): VaultPreview[] {
  const safe: VaultPreview[] = [];
  for (const v of loaded) {
    const preview: VaultPreview = {
      id: v.id,
      name: v.name,
      amount: v.amount,
      currency: v.currency,
      status: v.status as VaultStatus,
      deadline: v.deadline,
      progressPct: vaultProgressPct(v),
    };
    const result = validateVaultPreview(preview);
    if (result.ok) {
      safe.push(preview);
    } else {
      logger.warn("[Dashboard] dropped invalid vault preview", {
        id: v.id,
        reason: result.reason,
      });
    }
  }
  return safe;
}
