import type { Activity } from "./dashboard";
import {
  isFiniteAmount,
  isNonEmptyString,
  isValidIsoTimestamp,
  isVaultStatus,
} from "./vaultState";

const VALID_ACTIVITY_TYPES = new Set<string>([
  "created",
  "validated",
  "released",
  "redirected",
]);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validates a VaultPreview object before it is rendered on the Dashboard.
 * Never throws on hostile input.
 */
export function validateVaultPreview(
  preview: unknown,
): { ok: boolean; reason?: string } {
  try {
    if (!isPlainRecord(preview)) {
      return { ok: false, reason: "Vault preview must be an object." };
    }

    if (!isNonEmptyString(preview.id)) {
      return { ok: false, reason: "Vault preview id must be a non-empty string." };
    }

    if (!isNonEmptyString(preview.name)) {
      return { ok: false, reason: "Vault preview name must be a non-empty string." };
    }

    if (!isFiniteAmount(preview.amount)) {
      return {
        ok: false,
        reason: "Vault preview amount must be a finite non-negative number.",
      };
    }

    if (!isVaultStatus(preview.status)) {
      return {
        ok: false,
        reason: "Vault preview status is unknown.",
      };
    }

    if (
      typeof preview.progressPct !== "number" ||
      !Number.isFinite(preview.progressPct) ||
      preview.progressPct < 0 ||
      preview.progressPct > 100
    ) {
      return {
        ok: false,
        reason: "Vault preview progressPct must be a finite number between 0 and 100.",
      };
    }

    if (!isValidIsoTimestamp(preview.deadline)) {
      return {
        ok: false,
        reason: "Vault preview deadline must be a valid date.",
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "Vault preview could not be read safely." };
  }
}

/**
 * Filters an activity list, keeping only records with a recognized type
 * (created, validated, released, redirected) and a parseable timestamp,
 * while preserving original order. Never throws on hostile input.
 */
export function sanitizeActivity<
  T extends { type?: unknown; timestamp?: unknown },
>(list: readonly T[]): T[];
export function sanitizeActivity(list: unknown): Activity[];
export function sanitizeActivity(list: unknown): unknown[] {
  if (!Array.isArray(list)) {
    return [];
  }

  const result: unknown[] = [];
  for (let i = 0; i < list.length; i++) {
    try {
      const item: unknown = list[i];
      if (!isPlainRecord(item)) {
        continue;
      }
      if (typeof item.type !== "string" || !VALID_ACTIVITY_TYPES.has(item.type)) {
        continue;
      }
      if (!isValidIsoTimestamp(item.timestamp)) {
        continue;
      }
      result.push(item);
    } catch {
      continue;
    }
  }
  return result;
}
