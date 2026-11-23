import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConnectivityStore } from "../../services/connectivity";
import type { Vault } from "../../types/vault";
import { useDashboardData } from "../useDashboardData";

const listVaults = vi.fn();
const getStats = vi.fn();
const listTransactionsForVaults = vi.fn();

vi.mock("../../services/vaultService", () => ({
  listVaults: (...a: unknown[]) => listVaults(...a),
  getStats: (...a: unknown[]) => getStats(...a),
  listTransactionsForVaults: (...a: unknown[]) => listTransactionsForVaults(...a),
}));

vi.mock("../../services/api", () => ({
  isApiEnabled: () => true,
}));

const mkVault = (id: string, name: string, creator: string): Vault =>
  ({
    id,
    name,
    status: "active",
    amount: 500,
    currency: "USDC",
    createdAt: "2026-01-01T00:00:00.000Z",
    deadline: "2099-12-01T00:00:00.000Z",
    creatorAddress: creator,
    verifierAddress: "NOBODY",
    milestones: [],
    transactions: [],
  }) as Vault;

describe("useDashboardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConnectivityStore.getState().reset();
    getStats.mockResolvedValue({ totalLocked: 500, active: 1 });
    listTransactionsForVaults.mockResolvedValue([]);
  });

  it("transitions from loading to error when listVaults rejects, then recovers to data on connectivity recovery", async () => {
    const vault = mkVault("1", "Alpha Vault", "ADDR_A");

    // First attempt rejects (created + all calls)
    listVaults.mockRejectedValueOnce(new Error("Network failure"));
    listVaults.mockRejectedValueOnce(new Error("Network failure"));

    useConnectivityStore.getState().setStatus("api-down");

    const { result } = renderHook(() => useDashboardData("ADDR_A"));

    expect(result.current.loading).toBe(true);
    expect(result.current.status).toBe("loading");

    await waitFor(() => {
      expect(result.current.error).toBe(true);
    });
    expect(result.current.status).toBe("error");
    expect(result.current.loading).toBe(false);
    expect(result.current.data.vaults).toEqual([]);

    // Next attempt succeeds
    listVaults.mockImplementation(async (filter?: { creator?: string }) =>
      filter?.creator ? [vault] : [vault],
    );

    act(() => {
      useConnectivityStore.getState().setStatus("online");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("data");
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
    expect(result.current.data.vaults).toHaveLength(1);
    expect(result.current.data.vaults[0].name).toBe("Alpha Vault");
  });

  it("does not fetch when address is null", () => {
    const { result } = renderHook(() => useDashboardData(null));
    expect(result.current.loading).toBe(true);
    expect(result.current.data.vaults).toEqual([]);
    expect(listVaults).not.toHaveBeenCalled();
  });
});
