import { describe, expect, it } from "vitest";
import { formatAddress, formatUsdc } from "../format";

describe("formatUsdc", () => {
  it("groups whole USDC amounts and includes the currency by default", () => {
    expect(formatUsdc(0)).toBe("0 USDC");
    expect(formatUsdc(12500)).toBe("12,500 USDC");
    expect(formatUsdc("1234567890")).toBe("1,234,567,890 USDC");
  });

  it("preserves up to the 7-decimal USDC precision without locale drift", () => {
    expect(formatUsdc("0.0000001")).toBe("0.0000001 USDC");
    expect(formatUsdc("4200.5000000")).toBe("4,200.5 USDC");
    expect(formatUsdc("999999999999.1234567")).toBe("999,999,999,999.1234567 USDC");
  });

  it("respects configured fraction digits", () => {
    expect(formatUsdc("4200.5", { minFractionDigits: 2 })).toBe("4,200.50 USDC");
    expect(formatUsdc("4200.567", { maxFractionDigits: 2 })).toBe("4,200.57 USDC");
    expect(formatUsdc("999.995", { maxFractionDigits: 2 })).toBe("1,000 USDC");
    expect(formatUsdc("12500", { includeCurrency: false })).toBe("12,500");
  });

  it("rejects invalid and negative values", () => {
    expect(() => formatUsdc(-1)).toThrow(/cannot be negative/i);
    expect(() => formatUsdc("1.12345678")).toThrow(/at most 7 decimal/i);
    expect(() => formatUsdc("abc")).toThrow(/decimal value/i);
    expect(() => formatUsdc("1", { minFractionDigits: 3, maxFractionDigits: 2 })).toThrow(
      /cannot exceed/i,
    );
  });
});

describe("formatAddress", () => {
  it("truncates long addresses with configurable visible lengths", () => {
    expect(formatAddress("GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890")).toBe("GABCDE...7890");
    expect(
      formatAddress("GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", {
        prefixLength: 1,
        suffixLength: 4,
      }),
    ).toBe("G...7890");
  });

  it("handles short and empty values gracefully", () => {
    expect(formatAddress("GSHORT")).toBe("GSHORT");
    expect(formatAddress("")).toBe("");
    expect(formatAddress("   ")).toBe("");
  });
});
