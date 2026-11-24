import { describe, it, expect } from "vitest";
import { buildVaultQuery } from "../api";

describe("buildVaultQuery multi-status", () => {
  it("encodes a status array as repeated parameters", () => {
    expect(buildVaultQuery({ status: ["active", "pending_validation"] })).toBe(
      "?status=active&status=pending_validation",
    );
  });

  it("keeps the single-string API unchanged", () => {
    expect(buildVaultQuery({ status: "active" })).toBe("?status=active");
    expect(buildVaultQuery({ creator: "GABC", status: "active" })).toBe(
      "?creator=GABC&status=active",
    );
  });

  it("URI-encodes every value, including special characters", () => {
    expect(encodeURIComponent("a&b=c")).toBe("a%26b%3Dc");
    expect(buildVaultQuery({ status: ["a&b=c"] })).toBe("?status=a%26b%3Dc");
    expect(buildVaultQuery({ status: "a&b=c" })).toBe("?status=a%26b%3Dc");
  });

  it("omits empty arrays and blank strings", () => {
    expect(buildVaultQuery({ status: [] })).toBe("");
    expect(buildVaultQuery({ status: ["", "  "] })).toBe("");
    expect(buildVaultQuery({ status: ["active", ""] })).toBe("?status=active");
  });

  it("orders statuses deterministically so cache keys are stable", () => {
    const forward = buildVaultQuery({ status: ["active", "pending_validation"] });
    const reversed = buildVaultQuery({ status: ["pending_validation", "active"] });
    expect(reversed).toBe(forward);
    expect(forward).toBe("?status=active&status=pending_validation");
  });
});
