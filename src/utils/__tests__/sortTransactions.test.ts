import { describe, expect, it } from "vitest";
import { sortTransactions } from "../sortTransactions";

const rows = [
  {
    id: "older",
    type: "release",
    amount: 25,
    fee: 0.03,
    timestamp: new Date("2026-01-01T00:00:00Z"),
  },
  {
    id: "newer",
    type: "create",
    amount: 10,
    fee: 0.01,
    timestamp: new Date("2026-01-03T00:00:00Z"),
  },
  {
    id: "middle",
    type: "validate",
    amount: 50,
    fee: 0.02,
    timestamp: new Date("2026-01-02T00:00:00Z"),
  },
];

describe("sortTransactions", () => {
  it("sorts timestamps descending without mutating the source array", () => {
    const result = sortTransactions(rows, "timestamp", "desc");

    expect(result.map((row) => row.id)).toEqual(["newer", "middle", "older"]);
    expect(rows.map((row) => row.id)).toEqual(["older", "newer", "middle"]);
  });

  it("sorts numeric amount values ascending", () => {
    expect(sortTransactions(rows, "amount", "asc").map((row) => row.id)).toEqual([
      "newer",
      "older",
      "middle",
    ]);
  });

  it("sorts fee values descending", () => {
    expect(sortTransactions(rows, "fee", "desc").map((row) => row.id)).toEqual([
      "older",
      "middle",
      "newer",
    ]);
  });

  it("sorts transaction types alphabetically", () => {
    expect(sortTransactions(rows, "type", "asc").map((row) => row.id)).toEqual([
      "newer",
      "older",
      "middle",
    ]);
  });

  it("keeps missing numeric values at the end", () => {
    const withMissing = [
      { id: "missing", amount: undefined, timestamp: new Date() },
      { id: "defined", amount: 1, timestamp: new Date() },
    ];

    expect(sortTransactions(withMissing, "amount", "asc").map((row) => row.id)).toEqual([
      "defined",
      "missing",
    ]);
  });

  it("keeps missing numeric values at the end when sorting descending", () => {
    const withMissing = [
      { id: "missing", amount: undefined, timestamp: new Date() },
      { id: "low", amount: 1, timestamp: new Date() },
      { id: "high", amount: 2, timestamp: new Date() },
    ];

    expect(sortTransactions(withMissing, "amount", "desc").map((row) => row.id)).toEqual([
      "high",
      "low",
      "missing",
    ]);
  });

  it("preserves input order when compared values are equal", () => {
    const tied = [
      { id: "first", type: "create", timestamp: new Date() },
      { id: "second", type: "create", timestamp: new Date() },
    ];

    expect(sortTransactions(tied, "type", "asc").map((row) => row.id)).toEqual([
      "first",
      "second",
    ]);
  });
});
