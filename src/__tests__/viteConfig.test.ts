/**
 * Authorization and validation regression coverage for vite.config.ts.
 *
 * What this module owns (see header invariants in vite.config.ts):
 *  - deterministic env parsing for VITE_DEV_PORT / VITE_API_TARGET,
 *  - an absolute `@` -> <root>/src alias,
 *  - exhaustive, single-chunk vendor routing for recharts/jspdf/framer-motion
 *    (unmatched ids return `undefined` so Rollup keeps default grouping),
 *  - a validated dev-server proxy target with a safe localhost default.
 *
 * Threats pinned here:
 *  - invalid/partial env silently producing a broken bundle or open proxy,
 *  - secret-bearing (non-VITE_) variables leaking into the client bundle,
 *  - chunk misrouting from substring/case confusion,
 *  - retry/duplicate/concurrent resolution diverging.
 */
import path from "path";
import viteConfigFn, {
  ConfigError,
  DEFAULT_API_TARGET,
  DEFAULT_DEV_PORT,
  parseIntEnv,
  resolveVendorChunk,
  SRC_DIR,
  validateProxyTarget,
  VENDOR_CHUNK_MATCHERS,
} from "../../vite.config";
import type { PluginOption, UserConfig } from "vite";

type Factory = (env: { mode: string; command: string }) => UserConfig;

function resolve(mode = "test"): UserConfig {
  return (viteConfigFn as unknown as Factory)({ mode, command: "serve" });
}

/** Unwrap rollup's single-or-array output into the object we assert on. */
function outputOf(config: UserConfig) {
  const output = config.build?.rollupOptions?.output;
  return (Array.isArray(output) ? output[0] : output) ?? {};
}

function manualChunksOf(config: UserConfig) {
  return outputOf(config).manualChunks as unknown as (
    id: string,
  ) => string | undefined;
}

describe("vite.config.ts — module shape (public interface)", () => {
  it("preserves the default-export factory interface", () => {
    expect(typeof viteConfigFn).toBe("function");
    const config = resolve();
    expect(config).toBeTypeOf("object");
    expect(config).not.toBeInstanceOf(Promise);
  });

  it("exposes pure validators for testability without changing the default export", () => {
    expect(typeof parseIntEnv).toBe("function");
    expect(typeof validateProxyTarget).toBe("function");
    expect(typeof resolveVendorChunk).toBe("function");
    expect(ConfigError).toBeTypeOf("function");
  });

  it("registers the react and tailwind plugins, all well-formed", () => {
    const plugins = (resolve().plugins ?? []) as PluginOption[];
    expect(plugins).toHaveLength(2);
    const flatten = (entries: PluginOption[]): Array<{ name?: string }> => {
      const out: Array<{ name?: string }> = [];
      for (const entry of entries) {
        if (Array.isArray(entry)) out.push(...flatten(entry as PluginOption[]));
        else if (entry) out.push(entry as { name?: string });
      }
      return out;
    };
    const flat = flatten(plugins);
    expect(flat.length).toBeGreaterThanOrEqual(2);
    for (const plugin of flat) {
      expect(plugin).toBeTruthy();
      expect(typeof plugin.name).toBe("string");
      expect((plugin.name ?? "").length).toBeGreaterThan(0);
    }
    const names = flat.map((p) => p.name);
    expect(names).toContain("vite:react-babel");
    expect(names).toContain("vite:react-refresh");
    expect(names.some((n) => n?.includes("tailwind"))).toBe(true);
  });

  it("aliases '@' to the real src directory via an absolute path", () => {
    const alias = resolve().resolve?.alias as Record<string, string>;
    expect(alias["@"]).toBe(path.resolve(__dirname, "../../src"));
    expect(alias["@"]).toBe(SRC_DIR);
    expect(path.isAbsolute(alias["@"])).toBe(true);
  });
});

describe("vite.config.ts — resolveVendorChunk (routing invariants)", () => {
  it("routes each known vendor to its own chunk (posix + windows separators)", () => {
    expect(resolveVendorChunk("/repo/node_modules/recharts/es/index.js")).toBe(
      "vendor-recharts",
    );
    expect(resolveVendorChunk("/repo/node_modules/jspdf/dist/jspdf.es.min.js")).toBe(
      "vendor-jspdf",
    );
    expect(
      resolveVendorChunk("/repo/node_modules/framer-motion/dist/es/index.mjs"),
    ).toBe("vendor-framer-motion");
    expect(resolveVendorChunk("C:\\repo\\node_modules\\recharts\\es\\index.js")).toBe(
      "vendor-recharts",
    );
  });

  it("returns undefined for ordinary modules so rollup chunks them normally", () => {
    expect(resolveVendorChunk("/repo/src/components/Button.tsx")).toBeUndefined();
    expect(resolveVendorChunk("/repo/node_modules/react/index.js")).toBeUndefined();
    expect(resolveVendorChunk("")).toBeUndefined();
    expect(resolveVendorChunk(" ")).toBeUndefined();
    expect(
      resolveVendorChunk("/repo/node_modules/recharts-theme/index.js"),
    ).toBeUndefined();
  });

  it("rejects non-string input without throwing (fail-closed to default chunking)", () => {
    expect(
      resolveVendorChunk(undefined as unknown as string),
    ).toBeUndefined();
    expect(resolveVendorChunk(null as unknown as string)).toBeUndefined();
    expect(resolveVendorChunk(42 as unknown as string)).toBeUndefined();
  });

  it("never returns an empty string (rollup treats it as falsy)", () => {
    for (const id of [
      "",
      " ",
      "/repo/src/app.tsx",
      "/repo/node_modules/react/index.js",
      "recharts",
      "jspdf",
      "framer-motion",
    ]) {
      expect(resolveVendorChunk(id)).not.toBe("");
    }
  });

  it("is deterministic and stateless across duplicate calls (retry-safe)", () => {
    const id = "/repo/node_modules/recharts/es/index.js";
    expect(resolveVendorChunk(id)).toBe(resolveVendorChunk(id));
    // Routing a vendor id must not change routing of a later non-vendor id.
    expect(resolveVendorChunk("/repo/src/app.tsx")).toBeUndefined();
    expect(resolveVendorChunk(id)).toBe("vendor-recharts");
    // Repeated invalid input throws nothing and stays undefined (safe to retry).
    for (let i = 0; i < 3; i++) {
      expect(resolveVendorChunk("")).toBeUndefined();
    }
  });

  it("matches case-sensitively and on path segment, not bare substring", () => {
    expect(resolveVendorChunk("/repo/node_modules/RECHARTS/index.js")).toBeUndefined();
    expect(resolveVendorChunk("/repo/node_modules/JSPDF/index.js")).toBeUndefined();
    // Bare tokens without the node_modules segment must NOT route: this pins
    // the hardened contract (segment matchers), guarding against wrapper
    // files being pulled into vendor chunks.
    expect(resolveVendorChunk("/repo/my-recharts-wrapper.ts")).toBeUndefined();
    expect(resolveVendorChunk("/repo/src/legacy/jspdf-fallback.ts")).toBeUndefined();
    expect(
      resolveVendorChunk("/repo/src/lib/framer-motion-shim.ts"),
    ).toBeUndefined();
  });

  it("assigns at most one chunk per id, in stable matcher order", () => {
    const both = resolveVendorChunk("/repo/node_modules/recharts-jspdf/index.js");
    // Hyphenated directory is a single segment, matching neither rule.
    expect(both).toBeUndefined();
    expect(VENDOR_CHUNK_MATCHERS[0]?.chunk).toBe("vendor-recharts");
  });

  it("keeps vendor chunk names distinct and non-empty", () => {
    const names = VENDOR_CHUNK_MATCHERS.map((m) => m.chunk);
    expect(names).toEqual([
      "vendor-recharts",
      "vendor-jspdf",
      "vendor-framer-motion",
    ]);
    expect(new Set(names).size).toBe(3);
  });
});

describe("vite.config.ts — parseIntEnv (validation invariants)", () => {
  const MIN = 1;
  const MAX = 65535;

  it("accepts valid ports and trims surrounding whitespace", () => {
    expect(parseIntEnv("5173", "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX)).toBe(5173);
    expect(parseIntEnv(" 3000 ", "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX)).toBe(3000);
    expect(parseIntEnv(String(MIN), "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX)).toBe(MIN);
    expect(parseIntEnv(String(MAX), "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX)).toBe(MAX);
  });

  it("falls back to the default on absent/empty input (stale-state safe)", () => {
    expect(parseIntEnv(undefined, "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX)).toBe(
      DEFAULT_DEV_PORT,
    );
    expect(parseIntEnv("", "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX)).toBe(
      DEFAULT_DEV_PORT,
    );
    expect(parseIntEnv("   ", "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX)).toBe(
      DEFAULT_DEV_PORT,
    );
  });

  it("rejects non-numeric, float, and negative input deterministically", () => {
    for (const raw of ["abc", "12.5", "-1", "0x10", "1e3", "+5173", "51 73"]) {
      expect(() => parseIntEnv(raw, "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX)).toThrow(
        ConfigError,
      );
      // Retry of the same invalid input fails identically (no partial state).
      expect(() => parseIntEnv(raw, "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX)).toThrow(
        /must be a non-negative integer/,
      );
    }
  });

  it("rejects out-of-range ports at both boundaries", () => {
    expect(() => parseIntEnv("0", "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX)).toThrow(
      /must be between 1 and 65535/,
    );
    expect(() => parseIntEnv("65536", "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX)).toThrow(
      /must be between 1 and 65535/,
    );
  });

  it("rejects unsafe integers without lossy coercion", () => {
    expect(() =>
      parseIntEnv("9007199254740993", "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX),
    ).toThrow(ConfigError);
  });

  it("recovers after a rejection: valid input still parses (failure recovery)", () => {
    expect(() => parseIntEnv("nope", "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX)).toThrow();
    expect(parseIntEnv("5173", "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX)).toBe(5173);
  });

  it("emits diagnosable, non-sensitive errors", () => {
    try {
      parseIntEnv("abc", "VITE_DEV_PORT", DEFAULT_DEV_PORT, MIN, MAX);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      const message = (err as Error).message;
      expect(message).toMatch(/^\[vite\.config\] VITE_DEV_PORT/);
      expect(message).toContain('"abc"');
    }
  });
});

describe("vite.config.ts — validateProxyTarget (authorization invariants)", () => {
  it("accepts absolute http/https origins and trims whitespace", () => {
    expect(validateProxyTarget("http://localhost:3000", "VITE_API_TARGET")).toBe(
      "http://localhost:3000",
    );
    expect(
      validateProxyTarget("  https://api.example.com/v1  ", "VITE_API_TARGET"),
    ).toBe("https://api.example.com/v1");
  });

  it("falls back to the safe localhost default on absent/empty input", () => {
    expect(validateProxyTarget(undefined, "VITE_API_TARGET")).toBe(DEFAULT_API_TARGET);
    expect(validateProxyTarget("", "VITE_API_TARGET")).toBe(DEFAULT_API_TARGET);
    expect(validateProxyTarget("   ", "VITE_API_TARGET")).toBe(DEFAULT_API_TARGET);
    expect(DEFAULT_API_TARGET).toMatch(/^http:\/\/localhost:/);
  });

  it("rejects relative URLs that would misroute dev traffic", () => {
    for (const raw of ["/api", "api/v1", "//evil.example.com", "localhost:3000"]) {
      expect(() => validateProxyTarget(raw, "VITE_API_TARGET")).toThrow(ConfigError);
      // Retry is deterministic: same input, same rejection.
      expect(() => validateProxyTarget(raw, "VITE_API_TARGET")).toThrow(
        /must be a valid absolute URL|must use http or https/,
      );
    }
  });

  it("rejects non-http schemes to prevent open-proxy / scheme confusion", () => {
    for (const raw of [
      "ftp://example.com",
      "ws://example.com/socket",
      "file:///etc/passwd",
      "data:text/plain,hi",
      "javascript:alert(1)",
    ]) {
      expect(() => validateProxyTarget(raw, "VITE_API_TARGET")).toThrow(
        /must use http or https/,
      );
    }
  });

  it("rejects garbage without leaking anything beyond the supplied value", () => {
    for (const raw of ["http://", "://missing-scheme"]) {
      try {
        validateProxyTarget(raw, "VITE_API_TARGET");
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigError);
        const message = (err as Error).message;
        expect(message).toMatch(/^\[vite\.config\] VITE_API_TARGET/);
        expect(message).not.toContain("SECRET");
        expect(message).not.toContain("PRIVATE_KEY");
      }
    }
  });

  it("recovers after a rejection (failure recovery)", () => {
    expect(() => validateProxyTarget("ftp://x.example", "VITE_API_TARGET")).toThrow();
    expect(validateProxyTarget("http://localhost:3000", "VITE_API_TARGET")).toBe(
      "http://localhost:3000",
    );
  });
});

describe("vite.config.ts — resolved factory (integration + concurrency)", () => {
  it("resolves deterministic defaults when no env files are present", () => {
    const config = resolve();
    expect(config.server?.port).toBe(DEFAULT_DEV_PORT);
    expect(config.server?.port).toBe(5173);
    const proxy = config.server?.proxy as Record<
      string,
      { target: string; changeOrigin: boolean }
    >;
    expect(proxy["/api"].target).toBe(DEFAULT_API_TARGET);
    expect(proxy["/api"].changeOrigin).toBe(true);
    expect(proxy["/api"].target).toMatch(/^https?:\/\//);
  });

  it("only proxies the /api prefix, not every request", () => {
    const proxy = resolve().server?.proxy as Record<string, unknown>;
    expect(Object.keys(proxy)).toEqual(["/api"]);
    expect(proxy["/"]).toBeUndefined();
    expect(proxy["/api/users"]).toBeUndefined();
  });

  it("delegates manualChunks to the tested routing table", () => {
    const manualChunks = manualChunksOf(resolve());
    expect(typeof manualChunks).toBe("function");
    expect(manualChunks("/repo/node_modules/recharts/es/index.js")).toBe(
      resolveVendorChunk("/repo/node_modules/recharts/es/index.js"),
    );
    expect(manualChunks("/repo/src/app.tsx")).toBeUndefined();
    expect(manualChunks("")).not.toBe("");
  });

  it("returns fresh, independent objects per invocation (no stale shared state)", () => {
    const first = resolve();
    const second = resolve();
    expect(first).not.toBe(second);
    expect(first.server).not.toBe(second.server);
    // Mutating one resolved config must not affect the next (retry-safe).
    (first.server as { port?: number }).port = 9999;
    expect(resolve().server?.port).toBe(DEFAULT_DEV_PORT);
  });

  it("resolves identically under concurrent invocation (concurrency boundary)", async () => {
    const results = await Promise.all(
      Array.from({ length: 16 }, async () => resolve()),
    );
    for (const config of results) {
      expect(config.server?.port).toBe(DEFAULT_DEV_PORT);
      const proxy = config.server?.proxy as Record<string, { target: string }>;
      expect(proxy["/api"].target).toBe(DEFAULT_API_TARGET);
      expect(manualChunksOf(config)("/repo/node_modules/jspdf/dist/x.js")).toBe(
        "vendor-jspdf",
      );
    }
    // Validators are pure under concurrency too.
    const chunks = await Promise.all([
      Promise.resolve(resolveVendorChunk("/repo/node_modules/recharts/a.js")),
      Promise.resolve(resolveVendorChunk("/repo/node_modules/recharts/a.js")),
      Promise.resolve(resolveVendorChunk("/repo/src/a.ts")),
    ]);
    expect(chunks).toEqual(["vendor-recharts", "vendor-recharts", undefined]);
  });

  it("resolves identically across modes when no mode-specific env exists", () => {
    // No .env* files exist in this repo, so loadEnv returns {} for every
    // mode: resolution must not vary by mode string (timing/mode boundary).
    const development = resolve("development");
    const production = resolve("production");
    expect(development.server?.port).toBe(production.server?.port);
    const devProxy = development.server?.proxy as Record<string, { target: string }>;
    const prodProxy = production.server?.proxy as Record<string, { target: string }>;
    expect(devProxy["/api"].target).toBe(prodProxy["/api"].target);
  });

  it("does not leak non-VITE_ process secrets into the resolved config", () => {
    process.env.SECRET_SHOULD_NOT_LEAK = "s3cr3t-marker";
    const serialized = JSON.stringify(resolve());
    expect(serialized).not.toContain("s3cr3t-marker");
    delete process.env.SECRET_SHOULD_NOT_LEAK;
  });

  it("does not define a base or outDir that would silently relocate output", () => {
    const config = resolve() as UserConfig;
    if (config.base !== undefined) {
      expect(config.base).not.toBe("");
      expect(
        config.base.startsWith("/") || /^https?:\/\//.test(config.base),
      ).toBe(true);
    }
    if (config.build?.outDir !== undefined) {
      expect(config.build.outDir).not.toBe("");
    }
  });
});
