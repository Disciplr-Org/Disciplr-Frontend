// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useVaultDetail } from "../useVaultDetail";
import { getVault } from "../../services/vaultService";
import { MASTER_VAULTS } from "../../fixtures/vaults";
import type { Vault } from "../../types/vault";

vi.mock("../../services/vaultService", () => ({
  getVault: vi.fn(),
}));

const mockGetVault = vi.mocked(getVault);

const validVault: Vault = MASTER_VAULTS["1"];

describe("useVaultDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in loading while the fetch is in flight", () => {
    mockGetVault.mockImplementation(() => new Promise<Vault | undefined>(() => {}));

    const { result } = renderHook(() => useVaultDetail("1"));

    expect(result.current.view.status).toBe("loading");
  });

  it("returns invalid-id for an undefined route id without calling getVault", () => {
    const { result } = renderHook(() => useVaultDetail(undefined));

    expect(result.current.view.status).toBe("invalid-id");
    expect(mockGetVault).not.toHaveBeenCalled();
  });

  it("returns invalid-id for a hostile '__proto__' id without calling getVault", async () => {
    const { result } = renderHook(() => useVaultDetail("__proto__"));

    await waitFor(() => expect(result.current.view.status).toBe("invalid-id"));
    expect(mockGetVault).not.toHaveBeenCalled();
  });

  it("returns not-found when getVault resolves undefined", async () => {
    mockGetVault.mockResolvedValue(undefined);

    const { result } = renderHook(() => useVaultDetail("missing"));

    await waitFor(() => expect(result.current.view.status).toBe("not-found"));
    expect(result.current.view).toEqual({ status: "not-found", id: "missing" });
  });

  it("returns malformed with issues when the response fails validation", async () => {
    mockGetVault.mockResolvedValue({ ...validVault, amount: -1 });

    const { result } = renderHook(() => useVaultDetail("1"));

    await waitFor(() => expect(result.current.view.status).toBe("malformed"));
    if (result.current.view.status !== "malformed") {
      throw new Error("expected malformed view");
    }
    expect(result.current.view.issues.length).toBeGreaterThan(0);
  });

  it("returns ready with the validated vault", async () => {
    mockGetVault.mockResolvedValue(validVault);

    const { result } = renderHook(() => useVaultDetail("1"));

    await waitFor(() => expect(result.current.view.status).toBe("ready"));
    if (result.current.view.status !== "ready") {
      throw new Error("expected ready view");
    }
    expect(result.current.view.vault).toEqual(validVault);
  });

  it("enters error on rejection and reaches ready after retry", async () => {
    mockGetVault
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(validVault);

    const { result } = renderHook(() => useVaultDetail("1"));

    await waitFor(() => expect(result.current.view.status).toBe("error"));

    act(() => {
      result.current.retry();
    });

    expect(result.current.view.status).toBe("loading");

    await waitFor(() => expect(result.current.view.status).toBe("ready"));
    expect(mockGetVault).toHaveBeenCalledTimes(2);
  });

  it("does not update state when unmounted before the promise resolves", async () => {
    let resolveVault!: (vault: Vault | undefined) => void;
    mockGetVault.mockImplementation(
      () =>
        new Promise<Vault | undefined>((resolve) => {
          resolveVault = resolve;
        }),
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = renderHook(() => useVaultDetail("1"));

    unmount();

    await act(async () => {
      resolveVault(validVault);
      await Promise.resolve();
    });

    expect(mockGetVault).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
