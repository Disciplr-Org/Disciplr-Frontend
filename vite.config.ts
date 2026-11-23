import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { ConfigError, parseIntEnv, validateProxyTarget } from "./scripts/viteEnv";

/**
 * Vite configuration for the application.
 *
 * Invariants enforced here:
 * 1. Environment variables are loaded deterministically and validated before the
 *    build/dev server starts. Invalid or partial env configuration fails fast
 *    with a non-sensitive, actionable error instead of silently producing a
 *    broken bundle.
 * 2. The `A@H alias resolves to `<root>/src` using an absolute path so that
 *    resolution is stable regardless of the current working directory.
 * 3. Vendor chunks are assigned deterministically and exhaustively: every
 *    matched module maps on a single chunk, and unmatched modules return
 *    `undefined` so Rollup keeps its default grouping behavior.
 * 4. The dev server proxy target is derived from a validated env variable
 *    with a safe localhost default, so misconfiguration is detected before
 *    the server binds.
 */

const ROOT_DIR = __dirname;
const SRC_DIR = path.resolve(ROOT_DIR, "./src");

const VENDOR_CHUNK_MATCHERS: ReadonlyArray<{ pattern: RegExp; chunk: string }> = [
  { pattern: /[\\/]node_modules[\\/]recharts[\\/]/, chunk: "vendor-recharts" },
  { pattern: /[\\/]node_modules[\\/]jspdf[\\/]/, chunk: "vendor-jspdf" },
  { pattern: /[\\/]node_modules[\\/]framer-motion[\\/]/, chunk: "vendor-framer-motion" },
];

const DEFAULT_DEV_PORT = 5173;
const DEFAULT_API_TARGET = "http://localhost:3000";

/**
 * Resolve a vendor chunk name for a given module id. Returns `undefined`
 * when no matcher applies, preserving Rollup's default chunking.
 */
function resolveVendorChunk(id: string): string | undefined {
  if (typeof id !== "string" || id.length === 0) {
    return undefined;
  }
  const normalized = id.replace(/\\\\/g, "/");
  for (const { pattern, chunk } of VENDOR_CHUNK_MATCHERS) {
    if (pattern.test(normalized)) {
      return chunk;
    }
  }
  return undefined;
}

export default defineConfig(({ mode }) => {
  // Load .env files deterministically for the active mode. `loadEnv` only
  // returns variables that are explicitly prefixed with `VITE_` or are otherwise
  // exposed by Vite, so sensitive server-side variables are not leaked into
  // the client bundle.
  const env = loadEnv(mode, ROOT_DIR);

  const devPort = parseIntEnv(env.VITE_DEV_PORT, "VITE_DEV_PORT", DEFAULT_DEV_PORT, 1, 65535);
  const apiTarget = validateProxyTarget(env.VITE_API_TARGET, "VITE_API_TARGET", DEFAULT_API_TARGET);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": SRC_DIR },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            return resolveVendorChunk(id);
          },
        },
      },
    },
    server: {
      port: devPort,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
