import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiListPendingValidations, apiSubmitValidation } from "../api";

const apiResponse = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => ({ data }),
});

const rawVault = {
  id: "vault-1",
  name: "API Vault",
  creator: "GOWNER",
  amount: "5000",
  status: "active",
  startDate: "2026-01-01T00:00:00.000Z",
  endDate: "2026-12-31T00:00:00.000Z",
  verifier: "GVERIFIER",
  successDestination: "GSUCCESS",
  failureDestination: "GFAILURE",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  milestones: [
    {
      id: "m-1",
      title: "Ship release",
      amount: "2500",
      dueDate: "2026-06-01",
      status: "pending",
    },
    {
      id: "m-2",
      title: "Done",
      amount: "2500",
      dueDate: "2026-05-01",
      status: "completed",
    },
  ],
};

describe("verifier queue API helpers", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("VITE_API", "https://api.test/api");
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("lists pending validations derived from pending API milestones", async () => {
    fetchMock.mockResolvedValueOnce(apiResponse([rawVault]));

    const tasks = await apiListPendingValidations();

    expect(tasks.map((task) => task.id)).toEqual(["vault-1:m-1"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://api.test/api/vaults");
  });

  it("submits an approval to the milestone validate endpoint", async () => {
    fetchMock.mockResolvedValueOnce(apiResponse({}));

    await apiSubmitValidation({
      id: "vault-1:m-1",
      vaultId: "vault-1",
      milestoneId: "m-1",
      decision: "approve",
      notes: "looks good",
      verifier: "GVERIFIER",
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/api/vaults/vault-1/milestones/m-1/validate");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      verifier: "GVERIFIER",
      notes: "looks good",
    });
  });

  it("submits a rejection to the vault fail endpoint with a reason", async () => {
    fetchMock.mockResolvedValueOnce(apiResponse({}));

    await apiSubmitValidation({
      id: "vault-1:m-1",
      vaultId: "vault-1",
      milestoneId: "m-1",
      decision: "reject",
      notes: "evidence missing",
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test/api/vaults/vault-1/fail");
    expect(JSON.parse(String(init.body))).toMatchObject({ reason: "evidence missing" });
  });

  it("does not fetch when the API is unset", async () => {
    vi.stubEnv("VITE_API", "");

    await expect(apiListPendingValidations()).rejects.toThrow("API not configured");
    await expect(
      apiSubmitValidation({
        id: "vault-1:m-1",
        vaultId: "vault-1",
        milestoneId: "m-1",
        decision: "approve",
      }),
    ).rejects.toThrow("API not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
