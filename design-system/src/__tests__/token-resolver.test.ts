import { getTokenValue } from "../utils/token-loader";
import { DesignTokens } from "../types/tokens";

const tokens: DesignTokens = {
  color: {
    brand: {
      primary: { $type: "color", $value: "#1d4ed8" },
      secondary: { $type: "color", $value: "#9333ea" },
    },
    feedback: {
      ok: { $type: "color", $value: "#10b981" },
      danger: { $type: "color", $value: "#ef4444" },
    },
  },
  spacing: {
    md: { $type: "dimension", $value: "16px" },
  },
  contrast: {
    pair: { light: 4.5, dark: 7.2 },
  },
} as unknown as DesignTokens;

describe("getTokenValue", () => {
  it("returns the $value of a leaf token at a known path", () => {
    expect(getTokenValue(tokens, "color.brand.primary")).toBe("#1d4ed8");
  });

  it("returns undefined when an intermediate sub-property doesn't exist", () => {
    // The token has no `contrast` field, so walking past $value returns undefined.
    expect(getTokenValue(tokens, "color.brand.primary.contrast")).toBeUndefined();
  });

  it("returns the $value of a different category", () => {
    expect(getTokenValue(tokens, "spacing.md")).toBe("16px");
  });

  it("returns undefined for a missing intermediate segment", () => {
    expect(getTokenValue(tokens, "color.unknown.primary")).toBeUndefined();
    expect(getTokenValue(tokens, "totally.absent")).toBeUndefined();
  });

  it("returns undefined for an empty path", () => {
    expect(getTokenValue(tokens, "")).toBeUndefined();
    expect(getTokenValue(tokens, ".")).toBeUndefined();
    expect(getTokenValue(tokens, "...")).toBeUndefined();
  });

  it("does not throw on nullish segments or trailing dots", () => {
    expect(() => getTokenValue(tokens, "color.brand.primary.")).not.toThrow();
    expect(getTokenValue(tokens, "color.brand.primary.")).toBe("#1d4ed8");
  });

  it("returns the leaf object (not $value) when the path lands on a plain object", () => {
    const result = getTokenValue(tokens, "contrast.pair");
    expect(result).toEqual({ light: 4.5, dark: 7.2 });
  });
});
