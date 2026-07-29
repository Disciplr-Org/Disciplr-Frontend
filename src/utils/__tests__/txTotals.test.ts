import { describe, expect, it } from "vitest";
import { computeTxTotals } from "../txTotals";

describe("computeTxTotals", () => {
  it("returns zeroed totals for an empty array", () => {
    const result = computeTxTotals([]);
    expect(result).toEqual({ count: 0, totalAmount: 0, totalFees: 0 });
  });

  it("sums a single transaction", () => {
    const result = computeTxTotals([{ amount: 100, fee: 0.5 }]);
    expect(result).toEqual({ count: 1, totalAmount: 100, totalFees: 0.5 });
  });

  it("sums amounts and fees across multiple transactions", () => {
    const result = computeTxTotals([
      { amount: 100, fee: 0.1 },
      { amount: 200, fee: 0.2 },
      { amount: 300, fee: 0.3 },
    ]);
    expect(result.count).toBe(3);
    expect(result.totalAmount).toBeCloseTo(600, 10);
    expect(result.totalFees).toBeCloseTo(0.6, 10);
  });

  it("handles fractional fees without floating-point precision issues", () => {
    const result = computeTxTotals([
      { amount: 100, fee: 0.00001 },
      { amount: 200, fee: 0.00002 },
      { amount: 300, fee: 0.00003 },
    ]);
    expect(result.totalFees).toBeCloseTo(0.00006, 10);
  });

  it("handles zero amounts correctly", () => {
    const result = computeTxTotals([
      { amount: 0, fee: 0.00008 },
      { amount: 0, fee: 0.00009 },
    ]);
    expect(result).toEqual({ count: 2, totalAmount: 0, totalFees: 0.00017 });
  });

  it("handles large numbers", () => {
    const result = computeTxTotals([
      { amount: 1_000_000, fee: 0.001 },
      { amount: 2_500_000, fee: 0.002 },
    ]);
    expect(result).toEqual({
      count: 2,
      totalAmount: 3_500_000,
      totalFees: 0.003,
    });
  });

  it("does not mutate the input array", () => {
    const input = [{ amount: 100, fee: 0.01 }];
    const copy = [...input];
    computeTxTotals(input);
    expect(input).toEqual(copy);
  });

  it("works with ReadonlyArray input", () => {
    const input: ReadonlyArray<{ amount: number; fee: number }> = [
      { amount: 5, fee: 0.01 },
    ];
    const result = computeTxTotals(input);
    expect(result).toEqual({ count: 1, totalAmount: 5, totalFees: 0.01 });
  });
});
