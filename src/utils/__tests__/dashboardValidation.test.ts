import { describe, it, expect } from "vitest";
import { validateVaultPreview, sanitizeActivity } from "../dashboardValidation";

const VALID_PREVIEW = {
  id: "vault-1",
  name: "Emergency Fund",
  amount: 500,
  currency: "USDC",
  status: "active" as const,
  progressPct: 50,
  deadline: "2026-12-31T00:00:00Z",
};

describe("validateVaultPreview", () => {
  it("accepts a valid vault preview", () => {
    expect(validateVaultPreview(VALID_PREVIEW)).toEqual({ ok: true });
    expect(validateVaultPreview({ ...VALID_PREVIEW, amount: 0, progressPct: 0 })).toEqual({
      ok: true,
    });
    expect(validateVaultPreview({ ...VALID_PREVIEW, progressPct: 100 })).toEqual({
      ok: true,
    });
  });

  it("rejects non-objects", () => {
    for (const input of [null, undefined, "str", 42, true, []]) {
      const res = validateVaultPreview(input);
      expect(res.ok).toBe(false);
      expect(res.reason).toBeTruthy();
    }
  });

  it("rejects missing or empty id", () => {
    for (const id of [undefined, null, "", "   ", 123]) {
      const res = validateVaultPreview({ ...VALID_PREVIEW, id });
      expect(res.ok).toBe(false);
      expect(res.reason).toMatch(/id/i);
    }
  });

  it("rejects missing or empty name", () => {
    for (const name of [undefined, null, "", "   ", 123]) {
      const res = validateVaultPreview({ ...VALID_PREVIEW, name });
      expect(res.ok).toBe(false);
      expect(res.reason).toMatch(/name/i);
    }
  });

  it("rejects negative or non-finite amount", () => {
    for (const amount of [-5, NaN, Infinity, -Infinity, "100", undefined]) {
      const res = validateVaultPreview({ ...VALID_PREVIEW, amount });
      expect(res.ok).toBe(false);
      expect(res.reason).toMatch(/amount/i);
    }
  });

  it("rejects unknown status", () => {
    for (const status of ["weird", "", null, undefined, "__proto__"]) {
      const res = validateVaultPreview({ ...VALID_PREVIEW, status });
      expect(res.ok).toBe(false);
      expect(res.reason).toMatch(/status/i);
    }
  });

  it("rejects progressPct outside 0-100 or non-finite", () => {
    for (const progressPct of [-1, 101, NaN, Infinity, "50", undefined]) {
      const res = validateVaultPreview({ ...VALID_PREVIEW, progressPct });
      expect(res.ok).toBe(false);
      expect(res.reason).toMatch(/progressPct/i);
    }
  });

  it("rejects invalid deadline dates", () => {
    for (const deadline of ["not-a-date", "", "   ", null, undefined, 12345]) {
      const res = validateVaultPreview({ ...VALID_PREVIEW, deadline });
      expect(res.ok).toBe(false);
      expect(res.reason).toMatch(/deadline/i);
    }
  });

  it("never throws on hostile input with throwing getters", () => {
    const hostile = Object.defineProperty({}, "id", {
      get() {
        throw new Error("boom");
      },
    });
    const res = validateVaultPreview(hostile);
    expect(res.ok).toBe(false);
    expect(res.reason).toBeTruthy();
  });
});

describe("sanitizeActivity", () => {
  it("keeps only valid activity records and preserves order", () => {
    const input = [
      { id: "1", type: "created", vault: "V1", timestamp: "bad" },
      { id: "2", type: "released", vault: "V2", timestamp: "2025-01-01T00:00:00Z" },
      { id: "3", type: "unknown", vault: "V3", timestamp: "2025-01-02T00:00:00Z" },
      { id: "4", type: "validated", vault: "V4", timestamp: "2025-01-03T00:00:00Z" },
      { id: "5", type: "redirected", vault: "V5", timestamp: "2025-01-04T00:00:00Z" },
    ];
    const result = sanitizeActivity(input);
    expect(result).toEqual([input[1], input[3], input[4]]);
  });

  it("handles the test plan example", () => {
    const input = [
      { type: "created", timestamp: "bad" },
      { type: "released", timestamp: "2025-01-01T00:00:00Z" },
    ];
    expect(sanitizeActivity(input)).toEqual([
      { type: "released", timestamp: "2025-01-01T00:00:00Z" },
    ]);
  });

  it("returns empty array for non-array hostile inputs without throwing", () => {
    for (const input of [null, undefined, "bad", 123, {}, true]) {
      expect(sanitizeActivity(input)).toEqual([]);
    }
  });

  it("drops hostile elements including prototype keys and throwing getters", () => {
    const throwingItem = Object.defineProperty({}, "type", {
      get() {
        throw new Error("boom");
      },
    });
    const valid = { type: "created", timestamp: "2025-01-01T00:00:00Z" };
    const input = [
      null,
      undefined,
      42,
      [],
      { type: "__proto__", timestamp: "2025-01-01T00:00:00Z" },
      { type: "toString", timestamp: "2025-01-01T00:00:00Z" },
      throwingItem,
      valid,
    ];
    expect(sanitizeActivity(input)).toEqual([valid]);
  });
});
