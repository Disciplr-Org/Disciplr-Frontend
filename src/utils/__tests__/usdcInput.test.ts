import { describe, expect, it } from "vitest";
import { formatUsdcInput, parseUsdcInput } from "../usdcInput";

/* ------------------------------------------------------------------ */
/*  formatUsdcInput                                                    */
/* ------------------------------------------------------------------ */
describe("formatUsdcInput", () => {
  it("returns empty string for empty input", () => {
    expect(formatUsdcInput("")).toBe("");
  });

  it("returns the same for simple numbers without grouping", () => {
    expect(formatUsdcInput("0")).toBe("0");
    expect(formatUsdcInput("1")).toBe("1");
    expect(formatUsdcInput("55")).toBe("55");
    expect(formatUsdcInput("100")).toBe("100");
  });

  it("adds thousands grouping for four or more integer digits", () => {
    expect(formatUsdcInput("1234")).toBe("1,234");
    expect(formatUsdcInput("12345")).toBe("12,345");
    expect(formatUsdcInput("123456")).toBe("123,456");
    expect(formatUsdcInput("1234567")).toBe("1,234,567");
    expect(formatUsdcInput("12345678")).toBe("12,345,678");
  });

  it("caps decimal places at 7", () => {
    expect(formatUsdcInput("1.1234567")).toBe("1.1234567");
    expect(formatUsdcInput("1.12345678")).toBe("1.1234567");
    expect(formatUsdcInput("0.0000001")).toBe("0.0000001");
    expect(formatUsdcInput("0.00000001")).toBe("0.0000000");
  });

  it("preserves trailing decimal point when input ends with dot", () => {
    expect(formatUsdcInput("1.")).toBe("1.");
    expect(formatUsdcInput("0.")).toBe("0.");
    expect(formatUsdcInput("1234.")).toBe("1,234.");
  });

  it("formats numbers with both grouping and decimals", () => {
    expect(formatUsdcInput("1234.567")).toBe("1,234.567");
    expect(formatUsdcInput("1234567.1234567")).toBe("1,234,567.1234567");
  });
});

/* ------------------------------------------------------------------ */
/*  parseUsdcInput                                                     */
/* ------------------------------------------------------------------ */
describe("parseUsdcInput", () => {
  it("returns empty string for empty input", () => {
    expect(parseUsdcInput("")).toBe("");
  });

  it("strips non-numeric characters except dot", () => {
    expect(parseUsdcInput("abc")).toBe("");
    expect(parseUsdcInput("1a2b3c")).toBe("123");
    expect(parseUsdcInput("-1.5")).toBe("1.5");
    expect(parseUsdcInput("$1,000")).toBe("1000");
    expect(parseUsdcInput("  1.5  ")).toBe("1.5");
  });

  it("removes commas", () => {
    expect(parseUsdcInput("1,234")).toBe("1234");
    expect(parseUsdcInput("1,234,567")).toBe("1234567");
    expect(parseUsdcInput("1,234.567")).toBe("1234.567");
  });

  it("keeps only the first dot (subsequent dots are removed)", () => {
    expect(parseUsdcInput("1.2.3")).toBe("1.23");
    expect(parseUsdcInput("1.2.3.4")).toBe("1.234");
    expect(parseUsdcInput(".1.2")).toBe("0.12");
  });

  it("caps decimals at 7", () => {
    expect(parseUsdcInput("1.1234567")).toBe("1.1234567");
    expect(parseUsdcInput("1.12345678")).toBe("1.1234567");
    expect(parseUsdcInput("1.123456789")).toBe("1.1234567");
    expect(parseUsdcInput("0.0000001")).toBe("0.0000001");
    expect(parseUsdcInput("0.00000001")).toBe("0.0000000");
  });

  it("normalises leading zeros", () => {
    expect(parseUsdcInput("00")).toBe("0");
    expect(parseUsdcInput("01")).toBe("1");
    expect(parseUsdcInput("001")).toBe("1");
    expect(parseUsdcInput("00.5")).toBe("0.5");
    expect(parseUsdcInput("0")).toBe("0");
    expect(parseUsdcInput("0.0000001")).toBe("0.0000001");
    // Single zero before decimal stays
    expect(parseUsdcInput("0.")).toBe("0.");
    // The string "0." is valid
    expect(parseUsdcInput("00.")).toBe("0.");
  });

  it("handles a bare decimal point", () => {
    expect(parseUsdcInput(".")).toBe("0.");
    expect(parseUsdcInput(".5")).toBe("0.5");
  });
});

/* ------------------------------------------------------------------ */
/*  Round-trip property                                                */
/* ------------------------------------------------------------------ */
describe("round-trip parse(format(raw))", () => {
  const cases = [
    "",
    "0",
    "1",
    "100",
    "1234",
    "1234567",
    "1.5",
    "0.0000001",
    "1.1234567",
    "12345.1234567",
    "12345678.1234567",
  ];

  for (const raw of cases) {
    it(`parse(format("${raw}")) === "${raw}"`, () => {
      const formatted = formatUsdcInput(raw);
      const parsed = parseUsdcInput(formatted);
      expect(parsed).toBe(raw);
    });
  }
});
