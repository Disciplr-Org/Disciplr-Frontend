import type { NotificationItem } from "../Zustand/Store";
import type { VaultActivityRecord } from "../services/vaultService";

export type NotificationBuildPreferences = {
  disabledCategories?: Iterable<string>;
  vaultOverrides?: Record<string, boolean>;
};

const ACTIVITY_TYPES: Record<
  VaultActivityRecord["type"],
  { type: NotificationItem["type"]; category: string; title: string; verb: string; urgent: boolean }
> = {
  create: { type: "vault_created_successfully", category: "vault", title: "Vault Created", verb: "was created", urgent: false },
  validate: { type: "milestone_validated", category: "milestone", title: "Milestone Validated", verb: "was validated", urgent: false },
  release: { type: "funds_released", category: "funds", title: "Funds Released", verb: "released funds", urgent: false },
  redirect: { type: "funds_redirected", category: "funds", title: "Funds Redirected", verb: "redirected funds", urgent: true },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const validDate = (value: unknown): Date | null => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const enabledFor = (
  category: string,
  vaultId: string | undefined,
  preferences: NotificationBuildPreferences,
): boolean => {
  if (new Set(preferences.disabledCategories ?? []).has(category)) return false;
  return vaultId === undefined || preferences.vaultOverrides?.[vaultId] !== false;
};

export function buildNotifications(
  activity: unknown,
  vaults: unknown,
  now: Date,
  preferences: NotificationBuildPreferences = {},
): NotificationItem[] {
  const referenceNow = validDate(now) ?? new Date(0);
  const notifications = new Map<string, NotificationItem>();
  const records = Array.isArray(activity) ? activity : [];
  const vaultRecords = Array.isArray(vaults) ? vaults : [];
  const validVaults = vaultRecords.filter(isRecord);

  for (const item of records) {
    if (!isRecord(item) || typeof item.id !== "string" || item.id.length === 0) continue;
    const mapping = ACTIVITY_TYPES[item.type as VaultActivityRecord["type"]];
    if (!mapping || typeof item.vault !== "string") continue;

    const vault = validVaults.find((candidate) => candidate.name === item.vault);
    const vaultId = typeof vault?.id === "string" ? vault.id : undefined;
    if (!enabledFor(mapping.category, vaultId, preferences)) continue;

    const timestamp = validDate(item.timestamp) ?? referenceNow;
    const amount = typeof item.amount === "number" && Number.isFinite(item.amount)
      ? ` (${item.amount} ${typeof vault?.currency === "string" ? vault.currency : ""})`
      : "";
    const message = mapping.type === "vault_created_successfully"
      ? `Vault '${item.vault}' was created.`
      : mapping.type === "milestone_validated"
        ? `A milestone in '${item.vault}' was validated.`
        : `The '${item.vault}' vault ${mapping.verb}${amount}.`;

    notifications.set(`activity:${item.id}`, {
      id: `activity:${item.id}`,
      type: mapping.type,
      isUrgent: mapping.urgent,
      title: mapping.title,
      message,
      timestamp: timestamp.toISOString(),
      isRead: false,
      category: mapping.category,
    });
  }

  for (const candidate of validVaults) {
    if (typeof candidate.id !== "string" || typeof candidate.name !== "string") continue;
    if (!enabledFor("vault", candidate.id, preferences)) continue;
    const deadline = validDate(candidate.deadline);
    if (!deadline) continue;
    const hours = (deadline.getTime() - referenceNow.getTime()) / 3_600_000;
    if (hours <= 0 || hours > 24) continue;
    notifications.set(`deadline:${candidate.id}:24h`, {
      id: `deadline:${candidate.id}:24h`,
      type: "vault_deadline_approaching",
      isUrgent: true,
      title: "Urgent: Deadline Approaching",
      message: `The '${candidate.name}' vault is due within 24 hours.`,
      timestamp: referenceNow.toISOString(),
      isRead: false,
      category: "vault",
    });
  }

  return [...notifications.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
