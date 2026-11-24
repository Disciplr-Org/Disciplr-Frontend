import { DEADLINE_PRESETS, type DeadlinePreset } from "./deadlinePresets";

export const VAULT_TEMPLATES_STORAGE_PREFIX = "disciplr:vault-templates:v1::";
export const VAULT_TEMPLATES_VERSION = 1;
export const MAX_USER_TEMPLATES = 20;
export const TEMPLATE_NAME_MAX = 80;

export interface VaultTemplateMilestone {
  title: string;
  criteria: string;
}

/**
 * Only reusable vault configuration fields are serialized.
 * Vault name (unique per vault) and absolute deadlines (which can become past)
 * are intentionally excluded.
 */
export interface VaultTemplateConfig {
  amount: string;
  deadlinePreset?: DeadlinePreset | null;
  successAddress: string;
  failureAddress: string;
  verifierAddress: string;
  milestones: VaultTemplateMilestone[];
}

export interface VaultTemplate extends VaultTemplateConfig {
  id: string;
  name: string;
  builtIn?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type TemplateOperationResult<T = VaultTemplate[]> =
  | { ok: true; data: T }
  | { ok: false; error: string };

interface StoredTemplatesPayload {
  v: number;
  templates: VaultTemplate[];
}

export const BUILT_IN_VAULT_TEMPLATES: readonly VaultTemplate[] = Object.freeze([
  {
    id: "builtin-weekly-sprint",
    name: "Weekly Sprint",
    builtIn: true,
    amount: "250",
    deadlinePreset: "7d",
    successAddress: "",
    failureAddress: "",
    verifierAddress: "",
    milestones: [
      {
        title: "Mid-week check-in",
        criteria: "Share work-in-progress update and confirm scope is on track.",
      },
      {
        title: "Final sprint delivery",
        criteria: "Deliver completed sprint output for verifier sign-off.",
      },
    ],
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "builtin-monthly-goal",
    name: "Monthly Goal",
    builtIn: true,
    amount: "500",
    deadlinePreset: "30d",
    successAddress: "",
    failureAddress: "",
    verifierAddress: "",
    milestones: [
      {
        title: "Progress checkpoint",
        criteria: "Demonstrate 50% completion with supporting evidence.",
      },
      {
        title: "Final deliverable",
        criteria: "Submit completed goal deliverables for final verification.",
      },
    ],
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: "builtin-quarterly-milestone",
    name: "Quarterly Milestone",
    builtIn: true,
    amount: "1000",
    deadlinePreset: "90d",
    successAddress: "",
    failureAddress: "",
    verifierAddress: "",
    milestones: [
      {
        title: "Phase 1 kickoff",
        criteria: "Finalize specification and initial implementation plan.",
      },
      {
        title: "Mid-quarter review",
        criteria: "Complete core deliverable and pass interim verifier review.",
      },
      {
        title: "Final completion",
        criteria: "Ship production-ready output and pass final verification.",
      },
    ],
    createdAt: 0,
    updatedAt: 0,
  },
]);

export function getVaultTemplatesKey(
  ownerKey: string | null | undefined,
): string | null {
  if (typeof ownerKey !== "string") return null;
  const trimmed = ownerKey.trim();
  if (!trimmed) return null;
  return `${VAULT_TEMPLATES_STORAGE_PREFIX}${trimmed}`;
}

export function isBuiltInTemplate(id: string): boolean {
  return BUILT_IN_VAULT_TEMPLATES.some((t) => t.id === id);
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDeadlinePreset(value: unknown): value is DeadlinePreset {
  return (
    typeof value === "string" &&
    (DEADLINE_PRESETS as readonly string[]).includes(value)
  );
}

/**
 * Validates and normalizes a single raw template object.
 * Returns null if the entry is corrupt or schema-mismatched.
 */
export function parseTemplateEntry(entry: unknown): VaultTemplate | null {
  if (!isRecord(entry)) return null;

  if (typeof entry.id !== "string" || !entry.id.trim()) return null;
  if (typeof entry.name !== "string" || !entry.name.trim()) return null;
  if (typeof entry.amount !== "string") return null;
  if (typeof entry.successAddress !== "string") return null;
  if (typeof entry.failureAddress !== "string") return null;
  if (typeof entry.verifierAddress !== "string") return null;

  if (
    entry.deadlinePreset !== undefined &&
    entry.deadlinePreset !== null &&
    !isDeadlinePreset(entry.deadlinePreset)
  ) {
    return null;
  }

  if (!Array.isArray(entry.milestones)) return null;
  const milestones: VaultTemplateMilestone[] = [];
  for (const m of entry.milestones) {
    if (!isRecord(m)) return null;
    if (typeof m.title !== "string" || typeof m.criteria !== "string") {
      return null;
    }
    milestones.push({ title: m.title, criteria: m.criteria });
  }

  const createdAt =
    typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt)
      ? entry.createdAt
      : 0;
  const updatedAt =
    typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt)
      ? entry.updatedAt
      : createdAt;

  return {
    id: entry.id,
    name: entry.name.trim(),
    builtIn: false,
    amount: entry.amount,
    deadlinePreset: entry.deadlinePreset ?? null,
    successAddress: entry.successAddress,
    failureAddress: entry.failureAddress,
    verifierAddress: entry.verifierAddress,
    milestones,
    createdAt,
    updatedAt,
  };
}

/**
 * Loads user-saved templates for a wallet.
 * Corrupt or schema-mismatched entries are ignored without throwing
 * and without wiping valid entries.
 */
export function loadUserTemplates(
  ownerKey: string | null | undefined,
): VaultTemplate[] {
  const key = getVaultTemplatesKey(ownerKey);
  if (!key) return [];

  const store = getStorage();
  if (!store) return [];

  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch {
    return [];
  }
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!isRecord(parsed)) return [];
  if (parsed.v !== VAULT_TEMPLATES_VERSION) return [];
  if (!Array.isArray(parsed.templates)) return [];

  const valid: VaultTemplate[] = [];
  const seenIds = new Set<string>();
  for (const item of parsed.templates) {
    const parsedEntry = parseTemplateEntry(item);
    if (!parsedEntry) continue;
    if (isBuiltInTemplate(parsedEntry.id) || seenIds.has(parsedEntry.id)) {
      continue;
    }
    seenIds.add(parsedEntry.id);
    valid.push(parsedEntry);
  }

  return valid;
}

/**
 * Returns user-saved templates followed by the three read-only built-in starters.
 */
export function loadAllTemplates(
  ownerKey: string | null | undefined,
): VaultTemplate[] {
  return [...loadUserTemplates(ownerKey), ...BUILT_IN_VAULT_TEMPLATES];
}

function writeUserTemplates(
  ownerKey: string | null | undefined,
  templates: VaultTemplate[],
): TemplateOperationResult<VaultTemplate[]> {
  const key = getVaultTemplatesKey(ownerKey);
  if (!key) {
    return {
      ok: false,
      error: "Connect your wallet to save templates.",
    };
  }

  const store = getStorage();
  if (!store) {
    return {
      ok: false,
      error: "Browser storage is unavailable. Template could not be saved.",
    };
  }

  const payload: StoredTemplatesPayload = {
    v: VAULT_TEMPLATES_VERSION,
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      amount: t.amount,
      deadlinePreset: t.deadlinePreset ?? null,
      successAddress: t.successAddress,
      failureAddress: t.failureAddress,
      verifierAddress: t.verifierAddress,
      milestones: t.milestones.map(({ title, criteria }) => ({
        title,
        criteria,
      })),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  };

  try {
    store.setItem(key, JSON.stringify(payload));
    return { ok: true, data: templates };
  } catch {
    return {
      ok: false,
      error: "Could not save template to browser storage (storage may be full or restricted).",
    };
  }
}

function generateTemplateId(now: number): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `tpl-${now}-${rand}`;
}

export function saveUserTemplate(
  ownerKey: string | null | undefined,
  templateName: string,
  config: VaultTemplateConfig,
  now: number = Date.now(),
): TemplateOperationResult<VaultTemplate> {
  const trimmedName = templateName.trim();
  if (!trimmedName) {
    return { ok: false, error: "Enter a template name." };
  }
  if (trimmedName.length > TEMPLATE_NAME_MAX) {
    return {
      ok: false,
      error: `Template name must be ${TEMPLATE_NAME_MAX} characters or fewer.`,
    };
  }

  const existing = loadUserTemplates(ownerKey);
  if (existing.length >= MAX_USER_TEMPLATES) {
    return {
      ok: false,
      error: `Template limit reached (max ${MAX_USER_TEMPLATES}). Delete an existing template before saving a new one.`,
    };
  }

  const newTemplate: VaultTemplate = {
    id: generateTemplateId(now),
    name: trimmedName,
    builtIn: false,
    amount: config.amount,
    deadlinePreset: isDeadlinePreset(config.deadlinePreset)
      ? config.deadlinePreset
      : null,
    successAddress: config.successAddress,
    failureAddress: config.failureAddress,
    verifierAddress: config.verifierAddress,
    milestones: config.milestones.map(({ title, criteria }) => ({
      title,
      criteria,
    })),
    createdAt: now,
    updatedAt: now,
  };

  const writeResult = writeUserTemplates(ownerKey, [newTemplate, ...existing]);
  if (!writeResult.ok) {
    return writeResult;
  }

  return { ok: true, data: newTemplate };
}

export function renameUserTemplate(
  ownerKey: string | null | undefined,
  templateId: string,
  newName: string,
  now: number = Date.now(),
): TemplateOperationResult<VaultTemplate> {
  if (isBuiltInTemplate(templateId)) {
    return { ok: false, error: "Built-in templates are read-only." };
  }

  const trimmedName = newName.trim();
  if (!trimmedName) {
    return { ok: false, error: "Enter a template name." };
  }
  if (trimmedName.length > TEMPLATE_NAME_MAX) {
    return {
      ok: false,
      error: `Template name must be ${TEMPLATE_NAME_MAX} characters or fewer.`,
    };
  }

  const existing = loadUserTemplates(ownerKey);
  const index = existing.findIndex((t) => t.id === templateId);
  if (index === -1) {
    return { ok: false, error: "Template not found." };
  }

  const updated: VaultTemplate = {
    ...existing[index],
    name: trimmedName,
    updatedAt: now,
  };
  const next = [...existing];
  next[index] = updated;

  const writeResult = writeUserTemplates(ownerKey, next);
  if (!writeResult.ok) {
    return writeResult;
  }

  return { ok: true, data: updated };
}

export function deleteUserTemplate(
  ownerKey: string | null | undefined,
  templateId: string,
): TemplateOperationResult<VaultTemplate[]> {
  if (isBuiltInTemplate(templateId)) {
    return { ok: false, error: "Built-in templates are read-only." };
  }

  const existing = loadUserTemplates(ownerKey);
  const next = existing.filter((t) => t.id !== templateId);
  if (next.length === existing.length) {
    return { ok: false, error: "Template not found." };
  }

  return writeUserTemplates(ownerKey, next);
}
