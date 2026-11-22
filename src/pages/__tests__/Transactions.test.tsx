import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Transactions from "../Transactions";
import { useConnectivityStore } from "../../services/connectivity";
import * as vaultService from "../../services/vaultService";
import type { VaultActivityRecord } from "../../services/vaultService";

vi.mock("../../services/api", () => ({
  isApiEnabled: () => true,
  API_BASE: "https://api.disciplr.app",
}));

function makeRecord(overrides: Partial<VaultActivityRecord> & { id: string; vault: string; timestamp: Date }): VaultActivityRecord {
  return {
    type: "create",
    amount: 100,
    fee: 0.0001,
    block: 100,
    hash: "abcdef1234567890abcdef",
    status: "confirmed",
    from: "GFROM",
    to: "GTO",
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("Transactions", () => {
  beforeEach(() => {
    useConnectivityStore.getState().reset();
    vi.restoreAllMocks();
  });

  it("shows loading state then renders rows sorted by timestamp descending", async () => {
    const older = makeRecord({ id: "tx-old", vault: "Older Vault", timestamp: new Date("2025-01-01T00:00:00Z") });
    const newer = makeRecord({ id: "tx-new", vault: "Newer Vault", timestamp: new Date("2025-01-02T00:00:00Z") });
    const req = deferred<VaultActivityRecord[]>();
    vi.spyOn(vaultService, "listAllActivity").mockReturnValueOnce(req.promise);

    render(
      <MemoryRouter>
        <Transactions />
      </MemoryRouter>
    );

    expect(screen.getByText("Loading activity...")).toBeInTheDocument();

    await act(async () => {
      req.resolve([older, newer]);
      await req.promise;
    });

    const rows = screen.getAllByRole("row");
    // row[0] is header, row[1] should be newer, row[2] should be older
    expect(rows[1]).toHaveTextContent("Newer Vault");
    expect(rows[2]).toHaveTextContent("Older Vault");
  });

  it("clears previous error on recovery reload and applies latest response", async () => {
    const listSpy = vi.spyOn(vaultService, "listAllActivity");
    listSpy.mockRejectedValueOnce(new Error("Network down"));

    useConnectivityStore.getState().setStatus("api-down");

    render(
      <MemoryRouter>
        <Transactions />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Network down");
    });

    const recoveryReq = deferred<VaultActivityRecord[]>();
    listSpy.mockReturnValueOnce(recoveryReq.promise);

    act(() => {
      useConnectivityStore.getState().setStatus("online");
    });

    // Error should be cleared immediately at start of load
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Loading activity...")).toBeInTheDocument();

    await act(async () => {
      recoveryReq.resolve([
        makeRecord({ id: "tx-rec", vault: "Recovered Vault", timestamp: new Date("2025-02-01T00:00:00Z") }),
      ]);
      await recoveryReq.promise;
    });

    expect(screen.getByText("Recovered Vault")).toBeInTheDocument();
  });

  it("ignores stale responses when two overlapping calls resolve out of order", async () => {
    const first = deferred<VaultActivityRecord[]>();
    const second = deferred<VaultActivityRecord[]>();

    const listSpy = vi.spyOn(vaultService, "listAllActivity");
    listSpy.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    useConnectivityStore.getState().setStatus("api-down");

    render(
      <MemoryRouter>
        <Transactions />
      </MemoryRouter>
    );

    expect(listSpy).toHaveBeenCalledTimes(1);

    // Trigger a second overlapping load via connectivity recovery before the first resolves
    act(() => {
      useConnectivityStore.getState().setStatus("online");
    });

    expect(listSpy).toHaveBeenCalledTimes(2);

    // Second request resolves first
    await act(async () => {
      second.resolve([
        makeRecord({ id: "tx-2", vault: "Second Response Vault", timestamp: new Date("2025-03-02T00:00:00Z") }),
      ]);
      await second.promise;
    });

    expect(screen.getByText("Second Response Vault")).toBeInTheDocument();

    // First (stale) request resolves last and must be ignored
    await act(async () => {
      first.resolve([
        makeRecord({ id: "tx-1", vault: "First Stale Vault", timestamp: new Date("2025-03-01T00:00:00Z") }),
      ]);
      await first.promise;
    });

    expect(screen.getByText("Second Response Vault")).toBeInTheDocument();
    expect(screen.queryByText("First Stale Vault")).not.toBeInTheDocument();
  });

  it("does not update state or log console errors when unmounted before resolve", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const pending = deferred<VaultActivityRecord[]>();
    vi.spyOn(vaultService, "listAllActivity").mockReturnValueOnce(pending.promise);

    const { unmount } = render(
      <MemoryRouter>
        <Transactions />
      </MemoryRouter>
    );

    unmount();

    await act(async () => {
      pending.resolve([
        makeRecord({ id: "tx-late", vault: "Late Vault", timestamp: new Date("2025-04-01T00:00:00Z") }),
      ]);
      await pending.promise;
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
