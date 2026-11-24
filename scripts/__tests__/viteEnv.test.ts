import { describe, expect, it } from "vitest";
import { ConfigError, parseIntEnv, validateProxyTarget } from "../viteEnv";

describe("parseIntEnv", () => {
  const parsePort = (value: string | undefined) => parseIntEnv(value, "VITE_DEV_PORT", 5173, 1, 65535);

  it.each([
    [undefined, 5173],
    ["", 5173],
    ["   ", 5173],
    ["1", 1],
    ["8080", 8080],
    ["65535", 65535],
  ])("returns the default or parsed port for %j", (value, expected) => {
    expect(parsePort(value)).toBe(expected);
  });

  it.each([
    ["80a", '[vite.config] VITE_DEV_PORT must be a non-negative integer, got "80a"'],
    ["-1", '[vite.config] VITE_DEV_PORT must be a non-negative integer, got "-1"'],
    ["1.5", '[vite.config] VITE_DEV_PORT must be a non-negative integer, got "1.5"'],
    ["70000", "[vite.config] VITE_DEV_PORT must be between 1 and 65535, got 70000"],
    ["0", "[vite.config] VITE_DEV_PORT must be between 1 and 65535, got 0"],
  ])("rejects invalid port %s", (value, message) => {
    expect(() => parsePort(value)).toThrow(ConfigError);
    expect(() => parsePort(value)).toThrow(message);
  });

  it("returns the supplied default for blank input", () => {
    expect(parseIntEnv("  ", "CUSTOM_PORT", 4321, 1, 65535)).toBe(4321);
  });
});

describe("validateProxyTarget", () => {
  it.each([
    [undefined, "http://localhost:3000"],
    ["", "http://localhost:3000"],
    ["   ", "http://localhost:3000"],
    ["https://api.test", "https://api.test"],
    ["http://api.test:8080/v1", "http://api.test:8080/v1"],
  ])("accepts %j", (value, expected) => {
    expect(validateProxyTarget(value, "VITE_API_TARGET")).toBe(expected);
  });

  it("returns the supplied default for blank input", () => {
    expect(validateProxyTarget(" ", "CUSTOM_TARGET", "https://fallback.test")).toBe("https://fallback.test");
  });

  it.each([
    ["ftp://x", "[vite.config] VITE_API_TARGET must use http or https, got ftp:"],
    ["http://", '[vite.config] VITE_API_TARGET must be a valid absolute URL, got "http://"'],
    ["javascript:alert(1)", "[vite.config] VITE_API_TARGET must use http or https, got javascript:"],
    ["not-a-url", '[vite.config] VITE_API_TARGET must be a valid absolute URL, got "not-a-url"'],
  ])("rejects %s", (value, message) => {
    expect(() => validateProxyTarget(value, "VITE_API_TARGET")).toThrow(ConfigError);
    expect(() => validateProxyTarget(value, "VITE_API_TARGET")).toThrow(message);
  });
});
