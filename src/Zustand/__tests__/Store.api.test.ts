import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockSubmitValidation, mockListPendingValidations } = vi.hoisted(() => ({
  mockSubmitValidation: vi.fn(),
  mockListPendingValidations: vi.fn(),
}));

vi.mock("../../services/vaultService", () => ({
  submitValidation: mockSubmitValidation,
  listPendingValidations: mockListPendingValidations,
}));

import { useVerifierStore, type ValidationTask } from "../Store";

const task = (id: string, extra: Partial<ValidationTask> = {}): ValidationTask => ({
  id,
  vaultName: `Vault ${id}`,
  owner: "0xowner",
  amount: "1,000 USDC",
  deadline: "2026-06-01",
  status: "pending",
  milestone: `Milestone ${id}`,
  ...extra,
});

describe("verifier store — API mode", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API", "https://api.test/api");
    mockSubmitValidation.mockReset();
    mockListPendingValidations.mockReset();
    mockSubmitValidation.mockResolvedValue(undefined);
    mockListPendingValidations.mockResolvedValue([]);
    useVerifierStore.setState({
      pendingValidations: [
        task("a", { vaultId: "vault-a", milestoneId: "m-a" }),
        task("b", { vaultId: "vault-b", milestoneId: "m-b" }),
        task("c", { vaultId: "vault-c", milestoneId: "m-c" }),
      ],
      validationHistory: [],
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("loads the queue from the API and honours force", async () => {
    mockListPendingValidations
      .mockResolvedValueOnce([task("api-1")])
      .mockResolvedValueOnce([task("api-2")]);

    await useVerifierStore.getState().loadQueue();
    expect(mockListPendingValidations).toHaveBeenLastCalledWith(undefined);
    expect(useVerifierStore.getState().pendingValidations.map((item) => item.id)).toEqual(["api-1"]);

    await useVerifierStore.getState().loadQueue({ force: true });
    expect(mockListPendingValidations).toHaveBeenLastCalledWith({ force: true });
    expect(useVerifierStore.getState().pendingValidations.map((item) => item.id)).toEqual(["api-2"]);
  });

  it("returns per-item outcomes and rolls back only failed batch decisions", async () => {
    mockSubmitValidation.mockImplementation((input: { id: string }) =>
      input.id === "b" ? Promise.reject(new Error("HTTP 409 Conflict")) : Promise.resolve(),
    );

    const outcomes = await useVerifierStore.getState().batchApprove(["a", "b"], "note");

    expect(outcomes).toEqual([
      { id: "a", ok: true },
      { id: "b", ok: false, error: "HTTP 409 Conflict" },
    ]);
    const state = useVerifierStore.getState();
    expect(state.pendingValidations.map((item) => item.id)).toEqual(["b", "c"]);
    expect(state.pendingValidations[0]).toMatchObject({ id: "b", status: "pending" });
    expect(state.pendingValidations[0].decidedAt).toBeUndefined();
    expect(state.validationHistory.map((item) => item.id)).toEqual(["a"]);
    expect(mockSubmitValidation).toHaveBeenCalledTimes(2);
    expect(mockSubmitValidation).toHaveBeenCalledWith({
      id: "a",
      vaultId: "vault-a",
      milestoneId: "m-a",
      decision: "approve",
      notes: "note",
      verifier: undefined,
    });
  });

  it("throws and restores state when a single decision fails", async () => {
    mockSubmitValidation.mockRejectedValueOnce(new Error("network down"));

    await expect(useVerifierStore.getState().approveValidation("a", "note")).rejects.toThrow(
      "network down",
    );

    const state = useVerifierStore.getState();
    expect(state.pendingValidations.map((item) => item.id)).toEqual(["a", "b", "c"]);
    expect(state.validationHistory).toEqual([]);
  });

  it("does not submit a task twice for concurrent confirm clicks", async () => {
    let resolveSubmit!: () => void;
    mockSubmitValidation.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    useVerifierStore.setState({ pendingValidations: [task("a")], validationHistory: [] });

    const first = useVerifierStore.getState().approveValidation("a", "note");
    const second = useVerifierStore.getState().approveValidation("a", "note");

    await Promise.resolve();
    expect(mockSubmitValidation).toHaveBeenCalledTimes(1);
    resolveSubmit();
    await Promise.all([first, second]);
    expect(useVerifierStore.getState().validationHistory.map((item) => item.id)).toEqual(["a"]);
  });

  it("ignores a queued task that is already in history after recovery reload", async () => {
    useVerifierStore.setState({
      pendingValidations: [task("a", { vaultId: "vault-a", milestoneId: "m-a" })],
      validationHistory: [task("a", { status: "approved" })],
    });

    const outcomes = await useVerifierStore.getState().batchApprove(["a"], "note");

    expect(outcomes).toEqual([]);
    expect(mockSubmitValidation).not.toHaveBeenCalled();
    expect(useVerifierStore.getState().validationHistory).toHaveLength(1);
  });

  it("keeps the synchronous fixture behaviour when the API is unset", async () => {
    vi.stubEnv("VITE_API", "");

    await useVerifierStore.getState().batchApprove(["a"], "offline");

    expect(mockSubmitValidation).not.toHaveBeenCalled();
    expect(useVerifierStore.getState().validationHistory.map((item) => item.id)).toEqual(["a"]);
  });
});
