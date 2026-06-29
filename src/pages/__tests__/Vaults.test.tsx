import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { vi } from "vitest";
import Vaults, { VaultsInner } from "../../pages/Vaults";

// Helper to mock fetch function
const mockSuccess = <T,>(data: T) => vi.fn().mockResolvedValue(data);
const mockFailure = (message = "Network error") =>
  vi.fn().mockRejectedValue(new Error(message));

function CreateVaultStateProbe() {
  const location = useLocation();
  return (
    <pre data-testid="create-vault-state">
      {JSON.stringify(location.state ?? {})}
    </pre>
  );
}

describe("Vaults page states", () => {
  test("shows loading skeletons initially", async () => {
    render(<Vaults fetchVaults={mockSuccess([])} />);
    // Skeletons should be present immediately
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
    // Wait for loading to finish (no data)
    await waitFor(() =>
      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument(),
    );
  });

  test("shows empty state when no vaults", async () => {
    render(<Vaults fetchVaults={mockSuccess([])} />);
    await waitFor(() => screen.getByText(/You don’t have any vaults yet./i));
    expect(
      screen.getByRole("link", { name: /Create your first vault/i }),
    ).toBeInTheDocument();
  });

  test("shows data state when vaults exist", async () => {
    const mockData = [
      {
        id: "1",
        name: "Test Vault",
        amount: 1000,
        currency: "USDC",
        status: "active" as const,
        deadline: "2025-01-01T00:00:00Z",
      },
    ];
    render(<Vaults fetchVaults={mockSuccess(mockData)} />);
    await waitFor(() => screen.getByText("Test Vault"));
    expect(screen.getByText(/Test Vault/i)).toBeInTheDocument();
  });

  test("duplicate action navigates to CreateVault with prefilled state", async () => {
    const mockData = [
      {
        id: "1",
        name: "Test Vault",
        amount: 1000,
        currency: "USDC",
        status: "active" as const,
        deadline: "2025-01-01T00:00:00Z",
        successAddress: "GSUCC3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
        failureAddress: "GFAIL3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
        milestones: [{ title: "Milestone A", criteria: "Criteria A" }],
        createdAt: "2024-01-01T00:00:00Z",
        creatorAddress: "GCREA3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
        contractAddress: "GCONT3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
        transactions: [],
      },
    ];

    render(
      <MemoryRouter initialEntries={["/vaults"]}>
        <Routes>
          <Route
            path="/vaults"
            element={<VaultsInner fetchVaults={mockSuccess(mockData)} />}
          />
          <Route path="/vaults/create" element={<CreateVaultStateProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => screen.getByText("Test Vault"));
    await userEvent.click(screen.getByRole("link", { name: /duplicate/i }));

    const state = JSON.parse(
      screen.getByTestId("create-vault-state").textContent ?? "{}",
    );
    expect(state.createVaultPrefill).toMatchObject({
      sourceVaultId: "1",
      sourceVaultName: "Test Vault",
      amount: "1000",
      successAddress: "GSUCC3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
      failureAddress: "GFAIL3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK",
      milestones: [{ title: "Milestone A", criteria: "Criteria A" }],
    });
    expect(state.createVaultPrefill).not.toHaveProperty("deadline");
  });

  test("shows error state and can retry", async () => {
    const fetchMock = mockFailure();
    render(<Vaults fetchVaults={fetchMock} />);
    await waitFor(() => screen.getByText(/Failed to load vaults./i));
    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    expect(retryBtn).toBeInTheDocument();
    // Mock success on retry
    fetchMock.mockImplementationOnce(() => Promise.resolve([]));
    userEvent.click(retryBtn);
    await waitFor(() => screen.getByText(/You don’t have any vaults yet./i));
  });
});
