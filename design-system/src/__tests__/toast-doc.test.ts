import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(__dirname, "..", "..");
const DOC_PATH = resolve(REPO_ROOT, "design-system", "documentation", "toast.md");
const TOKEN_PATH = resolve(REPO_ROOT, "design-system", "tokens", "toast.json");
const STORE_PATH = resolve(REPO_ROOT, "src", "Zustand", "toastStore.ts");
const VIEWPORT_PATH = resolve(REPO_ROOT, "src", "components", "ToastViewport.tsx");
const LAYOUT_PATH = resolve(REPO_ROOT, "src", "components", "Layout.tsx");
const TOKEN_LOADER_PATH = resolve(REPO_ROOT, "design-system", "src", "utils", "token-loader.ts");

function readDoc(): string {
  expect(existsSync(DOC_PATH)).toBe(true);
  return readFileSync(DOC_PATH, "utf8");
}

describe("design-system/documentation/toast.md", () => {
  it("exists and is non-empty", () => {
    const doc = readDoc();
    expect(doc.length).toBeGreaterThan(200);
  });

  it("documents every token exported by design-system/tokens/toast.json", () => {
    const doc = readDoc();
    const tokens = JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
    const tokenNames = Object.keys(tokens.toast);

    for (const name of tokenNames) {
      expect(doc, `doc missing token "${name}"`).toContain(name);
    }
  });

  it("references the z-index.toast token used by the viewport", () => {
    const doc = readDoc();
    const zindex = JSON.parse(
      readFileSync(resolve(REPO_ROOT, "design-system", "tokens", "z-index.json"), "utf8"),
    );
    expect(zindex.zIndex.toast).toBeDefined();
    expect(doc).toMatch(/z-?[Ii]ndex.*toast|toast.*z-?[Ii]ndex/);
  });

  it("lists every exported mutator in the store", () => {
    const doc = readDoc();
    const store = readFileSync(STORE_PATH, "utf8");
    for (const mutator of ["push", "dismiss", "clear"]) {
      const re = new RegExp(`\\b${mutator}\\s*[:(]`);
      expect(store, `store missing mutator ${mutator}`).toMatch(re);
      expect(doc, `doc missing mutator ${mutator}`).toContain(`\`${mutator}\``);
    }
  });

  it("references the viewport and the layout mount", () => {
    const doc = readDoc();
    expect(doc).toContain("ToastViewport");
    expect(doc).toContain("Layout.tsx");
    expect(existsSync(VIEWPORT_PATH)).toBe(true);
    expect(existsSync(LAYOUT_PATH)).toBe(true);
    // The viewport must be mounted in the layout (not per-page).
    const layout = readFileSync(LAYOUT_PATH, "utf8");
    expect(layout).toContain("<ToastViewport");
  });

  it("documents every ToastVariant in the store source", () => {
    const doc = readDoc();
    const store = readFileSync(STORE_PATH, "utf8");
    const match = store.match(/type ToastVariant = ([^;]+);/);
    expect(match).not.toBeNull();
    const variants = (match![1] as string)
      .split("|")
      .map((v) => v.trim().replace(/['"]/g, ""))
      .filter(Boolean);

    for (const v of variants) {
      expect(doc, `doc missing variant "${v}"`).toContain(v);
    }
  });

  it("explains the reduced-motion override", () => {
    const doc = readDoc();
    expect(doc).toContain("prefers-reduced-motion");
    expect(doc).toContain("reducedMotionDurationMs");
  });

  it("is registered in the token loader (no missing-file drift)", () => {
    const loader = readFileSync(TOKEN_LOADER_PATH, "utf8");
    expect(loader).toContain("toast.json");
    expect(existsSync(TOKEN_PATH)).toBe(true);
  });
});
