import { describe, expect, it } from "vitest";
import { resolveVendorChunk } from "../../vite.config";

describe("resolveVendorChunk", () => {
  it("normalises single Windows backslashes before matching", () => {
    expect(resolveVendorChunk("C:\\app\\node_modules\\recharts\\lib\\x.js")).toBe("vendor-recharts");
    expect(resolveVendorChunk("C:\\app\\node_modules\\jspdf\\dist\\jspdf.js")).toBe("vendor-jspdf");
    expect(resolveVendorChunk("C:\\app\\node_modules\\framer-motion\\dist\\es\\index.js")).toBe(
      "vendor-framer-motion",
    );
  });

  it("leaves POSIX ids unchanged", () => {
    expect(resolveVendorChunk("/a/node_modules/recharts/index.js")).toBe("vendor-recharts");
    expect(resolveVendorChunk("/a/node_modules/jspdf/dist/jspdf.js")).toBe("vendor-jspdf");
    expect(resolveVendorChunk("/a/node_modules/framer-motion/dist/es/index.js")).toBe(
      "vendor-framer-motion",
    );
    expect(resolveVendorChunk("/a/node_modules/react/index.js")).toBeUndefined();
  });

  it("returns undefined for non-matching and empty ids", () => {
    expect(resolveVendorChunk("/a/src/index.ts")).toBeUndefined();
    expect(resolveVendorChunk("")).toBeUndefined();
  });
});
