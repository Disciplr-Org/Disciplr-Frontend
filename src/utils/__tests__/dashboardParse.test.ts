import { describe, it, expect } from "vitest";
import { isRecord, readVaultEntry, readVaultList } from "../dashboardParse";

const validEntry = (overrides: Record<string, unknown> = {}) => ({
  id: "v-1",
  name: "Alpha Vault",
  status: "active",
  amount: 1000,
  currency: "USDC",
  createdAt: "2026-01-01T00:00:00.000Z",
  deadline: "2026-12-01T00:00:00.000Z",
  milestones: [],
  ...overrides,
});

describe("dashboardParse", () => {
  describe("isRecord", () => {
    it.each([
      { label: "plain object", input: { a: 1 }, expected: true },
      { label: "null", input: null, expected: false },
      { label: "undefined", input: undefined, expected: false },
      { label: "array", input: [1, 2], expected: false },
      { label: "primitive string", input: "vault", expected: false },
      { label: "primitive number", input: 42, expected: false },
    ])("returns $expected for $label", ({ input, expected }) => {
      expect(isRecord(input)).toBe(expected);
    });
  });

  describe("readVaultEntry", () => {
    it("accepts a well-formed vault and strips non-object milestones", () => {
      const entry = validEntry({
        milestones: [
          { id: "m1", title: "Step 1", status: "pending" },
          null,
          "bad",
          123,
          { id: "m2", title: "Step 2", status: "validated" },
        ],
      });
      const out = readVaultEntry(entry);
      expect(out).not.toBeNull();
      expect(out?.id).toBe("v-1");
      expect(out?.milestones).toHaveLength(2);
    });

    it.each([
      { label: "null entry", input: null },
      { label: "array entry", input: [] },
      { label: "missing id", input: validEntry({ id: undefined }) },
      { label: "empty id", input: validEntry({ id: "" }) },
      { label: "prototype key id", input: validEntry({ id: "__proto__" }) },
      { label: "missing name", input: validEntry({ name: "" }) },
      { label: "unknown status", input: validEntry({ status: "archived" }) },
      { label: "NaN amount", input: validEntry({ amount: Number.NaN }) },
      { label: "string amount", input: validEntry({ amount: "abc" }) },
      { label: "zero amount", input: validEntry({ amount: 0 }) },
      { label: "negative amount", input: validEntry({ amount: -10 }) },
      { label: "infinite amount", input: validEntry({ amount: Number.POSITIVE_INFINITY }) },
      { label: "invalid currency", input: validEntry({ currency: "123" }) },
      { label: "invalid createdAt", input: validEntry({ createdAt: "not-a-date" }) },
      { label: "invalid deadline", input: validEntry({ deadline: "not-a-date" }) },
      {
        label: "deadline before createdAt",
        input: validEntry({
          createdAt: "2026-06-01T00:00:00.000Z",
          deadline: "2026-01-01T00:00:00.000Z",
        }),
      },
      { label: "non-array milestones", input: validEntry({ milestones: null }) },
    ])("rejects $label", ({ input }) => {
      expect(readVaultEntry(input)).toBeNull();
    });
  });

  describe("readVaultList", () => {
    it.each([
      { label: "null", input: null },
      { label: "undefined", input: undefined },
      { label: "object", input: { vaults: [] } },
      { label: "string", input: "not-an-array" },
      { label: "number", input: 123 },
    ])(
      "returns an empty unusable list with a reason for non-array payload ($label)",
      ({ input }) => {
        const res = readVaultList(input);
        expect(res.accepted).toEqual([]);
        expect(res.rejected).toBe(0);
        expect(res.unusable).toBe(true);
        expect(res.reason).toBe("not_an_array");
      },
    );

    it("accepts an empty array as a valid empty list", () => {
      const res = readVaultList([]);
      expect(res).toEqual({
        accepted: [],
        rejected: 0,
        unusable: false,
      });
    });

    it("marks an array of garbage as unusable with a reason", () => {
      const res = readVaultList([
        null,
        "garbage",
        123,
        { id: "bad", amount: "abc" },
      ]);
      expect(res.accepted).toEqual([]);
      expect(res.rejected).toBe(4);
      expect(res.unusable).toBe(true);
      expect(res.reason).toBe("all_entries_invalid");
    });

    it("drops an entry with amount: 'abc' while keeping valid neighbours", () => {
      const payload = [
        validEntry({ id: "v-1", name: "First" }),
        validEntry({ id: "v-2", name: "Corrupt", amount: "abc" }),
        validEntry({ id: "v-3", name: "Third" }),
      ];
      const res = readVaultList(payload);
      expect(res.accepted.map((v) => v.id)).toEqual(["v-1", "v-3"]);
      expect(res.rejected).toBe(1);
      expect(res.unusable).toBe(false);
    });

    it("drops an entry with an unknown status while keeping neighbours", () => {
      const payload = [
        validEntry({ id: "v-1" }),
        validEntry({ id: "v-2", status: "mystery_status" }),
        validEntry({ id: "v-3", status: "completed" }),
      ];
      const res = readVaultList(payload);
      expect(res.accepted.map((v) => v.id)).toEqual(["v-1", "v-3"]);
      expect(res.rejected).toBe(1);
      expect(res.unusable).toBe(false);
    });

    it("keeps the first entry when duplicate ids appear", () => {
      const payload = [
        validEntry({ id: "dup", name: "First Winner", amount: 100 }),
        validEntry({ id: "dup", name: "Second Loser", amount: 999 }),
        validEntry({ id: "unique", name: "Unique", amount: 250 }),
      ];
      const res = readVaultList(payload);
      expect(res.accepted).toHaveLength(2);
      expect(res.accepted[0].name).toBe("First Winner");
      expect(res.accepted[0].amount).toBe(100);
      expect(res.accepted[1].id).toBe("unique");
      expect(res.rejected).toBe(1);
      expect(res.unusable).toBe(false);
    });
  });
});
