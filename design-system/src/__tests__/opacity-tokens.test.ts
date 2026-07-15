import { describe, expect, it } from "vitest";
import { getAllTokens, loadTokens } from "../utils/token-loader";
import { DesignTokens } from "../types/tokens";

describe("opacity tokens", () => {
  it("loads the opacity.json file", () => {
    const tokens = loadTokens("opacity.json") as DesignTokens;
    expect(tokens.opacity).toBeDefined();
  });

  it("includes the full 0-100 scale", () => {
    const tokens = loadTokens("opacity.json") as DesignTokens;
    expect(tokens.opacity?.["0"]?.$value).toBe(0);
    expect(tokens.opacity?.["5"]?.$value).toBe(0.05);
    expect(tokens.opacity?.["10"]?.$value).toBe(0.1);
    expect(tokens.opacity?.["20"]?.$value).toBe(0.2);
    expect(tokens.opacity?.["40"]?.$value).toBe(0.4);
    expect(tokens.opacity?.["60"]?.$value).toBe(0.6);
    expect(tokens.opacity?.["80"]?.$value).toBe(0.8);
    expect(tokens.opacity?.["100"]?.$value).toBe(1);
  });

  it("includes the semantic aliases (disabled, overlay, hoverTint)", () => {
    const tokens = loadTokens("opacity.json") as DesignTokens;
    expect(tokens.opacity?.["disabled"]?.$value).toBe(0.4);
    expect(tokens.opacity?.["overlay"]?.$value).toBe(0.5);
    expect(tokens.opacity?.["hoverTint"]?.$value).toBe(0.08);
  });

  it("every opacity value is a number in the inclusive range [0, 1]", () => {
    const tokens = loadTokens("opacity.json") as DesignTokens;
    for (const [name, token] of Object.entries(tokens.opacity ?? {})) {
      const value = token.$value;
      expect(typeof value, `${name}.$value should be a number`).toBe("number");
      expect(value, `${name}.$value should be in [0, 1]`).toBeGreaterThanOrEqual(0);
      expect(value, `${name}.$value should be in [0, 1]`).toBeLessThanOrEqual(1);
    }
  });

  it("every token is typed as 'number'", () => {
    const tokens = loadTokens("opacity.json") as DesignTokens;
    for (const [name, token] of Object.entries(tokens.opacity ?? {})) {
      expect(token.$type, `${name} should be a number token`).toBe("number");
    }
  });

  it("is included in getAllTokens() output", () => {
    const all = getAllTokens();
    expect(all.opacity).toBeDefined();
    expect((all.opacity as Record<string, { $value: number }>)?.["100"]?.$value).toBe(1);
  });
});
