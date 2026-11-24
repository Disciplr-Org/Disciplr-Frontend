import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  BUILT_IN_VAULT_TEMPLATES,
  MAX_USER_TEMPLATES,
  VAULT_TEMPLATES_VERSION,
  deleteUserTemplate,
  getVaultTemplatesKey,
  loadAllTemplates,
  loadUserTemplates,
  renameUserTemplate,
  saveUserTemplate,
  type VaultTemplateConfig,
} from "../vaultTemplates";
import {
  ACCOUNT_A,
  ACCOUNT_B,
  ACCOUNT_C,
  ACCOUNT_D,
} from "@/__tests__/fixtures/stellarAddresses";

const sampleConfig: VaultTemplateConfig = {
  amount: "500",
  deadlinePreset: "30d",
  successAddress: ACCOUNT_B,
  failureAddress: ACCOUNT_C,
  verifierAddress: ACCOUNT_D,
  milestones: [
    { title: "Design", criteria: "Approved mockups" },
    { title: "Build", criteria: "Deployed to staging" },
  ],
};

describe("vaultTemplates", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("save then load round-trips per wallet and serializes only reusable fields", () => {
    const saveResult = saveUserTemplate(ACCOUNT_A, "Client Retainer", sampleConfig, 1_700_000_000_000);
    expect(saveResult.ok).toBe(true);
    if (!saveResult.ok) return;

    const loadedA = loadUserTemplates(ACCOUNT_A);
    expect(loadedA).toHaveLength(1);
    expect(loadedA[0]).toMatchObject({
      id: saveResult.data.id,
      name: "Client Retainer",
      builtIn: false,
      amount: "500",
      deadlinePreset: "30d",
      successAddress: ACCOUNT_B,
      failureAddress: ACCOUNT_C,
      verifierAddress: ACCOUNT_D,
      milestones: sampleConfig.milestones,
    });

    // Scoped per wallet: ACCOUNT_B does not see ACCOUNT_A's templates
    expect(loadUserTemplates(ACCOUNT_B)).toEqual([]);

    // Raw JSON never contains an absolute deadline field
    const key = getVaultTemplatesKey(ACCOUNT_A)!;
    const raw = JSON.parse(localStorage.getItem(key)!);
    expect(raw.templates[0]).not.toHaveProperty("deadline");
  });

  it("includes three read-only built-in starters in loadAllTemplates", () => {
    expect(BUILT_IN_VAULT_TEMPLATES).toHaveLength(3);
    const all = loadAllTemplates(ACCOUNT_A);
    expect(all).toHaveLength(3);
    expect(all.every((t) => t.builtIn)).toBe(true);

    const builtInId = BUILT_IN_VAULT_TEMPLATES[0].id;
    const renameRes = renameUserTemplate(ACCOUNT_A, builtInId, "Hacked");
    expect(renameRes.ok).toBe(false);
    if (!renameRes.ok) {
      expect(renameRes.error).toMatch(/read-only/i);
    }

    const deleteRes = deleteUserTemplate(ACCOUNT_A, builtInId);
    expect(deleteRes.ok).toBe(false);
    if (!deleteRes.ok) {
      expect(deleteRes.error).toMatch(/read-only/i);
    }
  });

  it("filters out a template whose JSON lacks milestones without wiping valid entries", () => {
    const key = getVaultTemplatesKey(ACCOUNT_A)!;
    const payload = {
      v: VAULT_TEMPLATES_VERSION,
      templates: [
        {
          id: "valid-1",
          name: "Valid Template",
          amount: "100",
          deadlinePreset: "7d",
          successAddress: ACCOUNT_B,
          failureAddress: ACCOUNT_C,
          verifierAddress: ACCOUNT_D,
          milestones: [{ title: "M1", criteria: "C1" }],
          createdAt: 1000,
          updatedAt: 1000,
        },
        {
          id: "corrupt-no-milestones",
          name: "Missing Milestones",
          amount: "200",
          deadlinePreset: "30d",
          successAddress: ACCOUNT_B,
          failureAddress: ACCOUNT_C,
          verifierAddress: ACCOUNT_D,
          createdAt: 1001,
          updatedAt: 1001,
        },
      ],
    };
    const raw = JSON.stringify(payload);
    localStorage.setItem(key, raw);

    const loaded = loadUserTemplates(ACCOUNT_A);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("valid-1");
    // Storage was not wiped on read
    expect(localStorage.getItem(key)).toBe(raw);
  });

  it("ignores corrupt JSON without throwing and without wiping storage", () => {
    const key = getVaultTemplatesKey(ACCOUNT_A)!;
    localStorage.setItem(key, "{not-valid-json");

    expect(() => loadUserTemplates(ACCOUNT_A)).not.toThrow();
    expect(loadUserTemplates(ACCOUNT_A)).toEqual([]);
    expect(localStorage.getItem(key)).toBe("{not-valid-json");
  });

  it("rejects the 21st save with a clear limit message", () => {
    for (let i = 1; i <= MAX_USER_TEMPLATES; i += 1) {
      const res = saveUserTemplate(ACCOUNT_A, `Template ${i}`, sampleConfig, 1000 + i);
      expect(res.ok).toBe(true);
    }
    expect(loadUserTemplates(ACCOUNT_A)).toHaveLength(MAX_USER_TEMPLATES);

    const extra = saveUserTemplate(ACCOUNT_A, "Template 21", sampleConfig, 2000);
    expect(extra.ok).toBe(false);
    if (!extra.ok) {
      expect(extra.error).toMatch(/20/);
    }
    expect(loadUserTemplates(ACCOUNT_A)).toHaveLength(MAX_USER_TEMPLATES);
  });

  it("supports renaming and deleting user templates", () => {
    const saved = saveUserTemplate(ACCOUNT_A, "Original", sampleConfig, 1000);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;

    const renamed = renameUserTemplate(ACCOUNT_A, saved.data.id, "Renamed", 2000);
    expect(renamed.ok).toBe(true);
    expect(loadUserTemplates(ACCOUNT_A)[0].name).toBe("Renamed");

    const deleted = deleteUserTemplate(ACCOUNT_A, saved.data.id);
    expect(deleted.ok).toBe(true);
    expect(loadUserTemplates(ACCOUNT_A)).toHaveLength(0);
  });

  it("returns a non-blocking error when localStorage.setItem throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    const result = saveUserTemplate(ACCOUNT_A, "Will Fail", sampleConfig);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/storage/i);
    }
  });
});
