import { describe, expect, it } from "vitest";
import { ApiError, classifyCreateError } from "../api";

describe("classifyCreateError", () => {
  it.each([
    { status: 400, expected: "rejected" },
    { status: 401, expected: "rejected" },
    { status: 403, expected: "rejected" },
    { status: 404, expected: "rejected" },
    { status: 409, expected: "rejected" },
    { status: 422, expected: "rejected" },
    { status: 408, expected: "unknown" },
    { status: 429, expected: "unknown" },
    { status: 500, expected: "unknown" },
    { status: 502, expected: "unknown" },
    { status: 503, expected: "unknown" },
    { status: 0, expected: "unknown" },
  ] as const)("classifies ApiError status $status as $expected", ({ status, expected }) => {
    expect(classifyCreateError(new ApiError("x", status))).toBe(expected);
  });

  it.each([
    { label: "plain Error", value: new Error("boom") },
    { label: "string", value: "boom" },
    { label: "undefined", value: undefined },
  ])("classifies $label as unknown", ({ value }) => {
    expect(classifyCreateError(value)).toBe("unknown");
  });
});
