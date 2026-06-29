import { describe, expect, it } from "vitest";
import { sortTransactions } from "../sortTransactions";

const baseRows = [
  {
    id: "a",
    timestamp: new Date("2026-06-29T12:00:00Z"),
    amount: 25,
    fee: 0.0004,
    type: "release",
  },
  {
    id: "b",
    timestamp: new Date("2026-06-29T09:00:00Z"),
    amount: 5,
    fee: 0.0001,
    type: "create",
  },
  {
    id: "c",
    timestamp: new Date("2026-06-29T15:00:00Z"),
    amount: 100,
    fee: 0.0009,
    type: "validate",
  },
];

describe("sortTransactions", () => {
  it("sorts timestamps newest first when requested", () => {
    const sorted = sortTransactions(baseRows, "timestamp", "desc");
    expect(sorted.map((row) => row.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts numeric amount and fee values numerically", () => {
    expect(sortTransactions(baseRows, "amount", "asc").map((row) => row.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(sortTransactions(baseRows, "fee", "desc").map((row) => row.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("sorts type labels alphabetically", () => {
    const sorted = sortTransactions(baseRows, "type", "asc");
    expect(sorted.map((row) => row.type)).toEqual(["create", "release", "validate"]);
  });

  it("handles undefined numeric values as zero", () => {
    const sorted = sortTransactions(
      [
        { id: "defined", amount: 10 },
        { id: "missing" },
        { id: "string", amount: "2.5" },
      ],
      "amount",
      "asc",
    );

    expect(sorted.map((row) => row.id)).toEqual(["missing", "string", "defined"]);
  });

  it("keeps equal values in their original order", () => {
    const rows = [
      { id: "first", fee: 1 },
      { id: "second", fee: 1 },
      { id: "third", fee: 2 },
    ];

    const sorted = sortTransactions(rows, "fee", "asc");
    expect(sorted.map((row) => row.id)).toEqual(["first", "second", "third"]);
  });
});
