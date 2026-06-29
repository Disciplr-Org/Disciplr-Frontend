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
    await waitFor(() => screen.getByText("You don't have any vaults yet"));
  });
});

describe('Vaults page filtering and sorting', () => {
  const mockVaults: Vault[] = [
    createMockVault({ id: '1', name: 'Alpha Vault', status: 'active', amount: 12500, deadline: '2024-07-15T10:00:00Z' }),
    createMockVault({ id: '2', name: 'Beta Reserve', status: 'completed', amount: 4200.5, deadline: '2024-01-01T09:00:00Z' }),
    createMockVault({ id: '3', name: 'Gamma Fund', status: 'failed', amount: 8800, deadline: '2023-12-01T08:00:00Z' }),
    createMockVault({ id: '4', name: 'Delta Cancelled', status: 'cancelled', amount: 5000, deadline: '2023-12-01T08:00:00Z' }),
    createMockVault({ id: '5', name: 'Epsilon Pending', status: 'pending_validation', amount: 15000, deadline: '2024-06-01T10:00:00Z' }),
  ];

  beforeEach(() => {
    render(<Vaults fetchVaults={mockSuccess(mockVaults)} />);
  });

  test('renders filter toolbar when data is loaded', async () => {
    await waitFor(() => screen.getByText('Your Vaults'));
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search vaults by name...')).toBeInTheDocument();
    expect(screen.getByText('Sort by:')).toBeInTheDocument();
  });

  test('status filter chips are keyboard operable with aria-pressed', async () => {
    await waitFor(() => screen.getByText('Your Vaults'));
    
    const allChip = screen.getByRole('button', { name: 'All' });
    expect(allChip).toHaveAttribute('aria-pressed', 'true');
    
    const activeChip = screen.getByRole('button', { name: 'Active' });
    expect(activeChip).toHaveAttribute('aria-pressed', 'false');
    
    // Click active chip
    await userEvent.click(activeChip);
    expect(activeChip).toHaveAttribute('aria-pressed', 'true');
    expect(allChip).toHaveAttribute('aria-pressed', 'false');
  });

  test('toggling status chips filters vaults correctly', async () => {
    await waitFor(() => screen.getByText('Your Vaults'));
    
    // Should show all 5 vaults initially
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.getByText('Beta Reserve')).toBeInTheDocument();
    expect(screen.getByText('Gamma Fund')).toBeInTheDocument();
    expect(screen.getByText('Delta Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Epsilon Pending')).toBeInTheDocument();
    
    // Click "Active" chip
    const activeChip = screen.getByRole('button', { name: 'Active' });
    await userEvent.click(activeChip);
    
    // Should only show Alpha Vault (active)
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.queryByText('Beta Reserve')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma Fund')).not.toBeInTheDocument();
    expect(screen.queryByText('Delta Cancelled')).not.toBeInTheDocument();
    expect(screen.queryByText('Epsilon Pending')).not.toBeInTheDocument();
    
    // Click "Completed" chip
    const completedChip = screen.getByRole('button', { name: 'Completed' });
    await userEvent.click(completedChip);
    
    // Should only show Beta Reserve (completed)
    expect(screen.queryByText('Alpha Vault')).not.toBeInTheDocument();
    expect(screen.getByText('Beta Reserve')).toBeInTheDocument();
    expect(screen.queryByText('Gamma Fund')).not.toBeInTheDocument();
    
    // Click "All" to reset
    const allChip = screen.getByRole('button', { name: 'All' });
    await userEvent.click(allChip);
    
    // Should show all vaults again
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.getByText('Beta Reserve')).toBeInTheDocument();
  });

  test('typing search query filters vaults by name (case-insensitive)', async () => {
    await waitFor(() => screen.getByText('Your Vaults'));
    
    const searchInput = screen.getByTestId('vault-search-input');
    
    // Type "alpha"
    await userEvent.type(searchInput, 'alpha');
    
    // Should only show Alpha Vault
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.queryByText('Beta Reserve')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma Fund')).not.toBeInTheDocument();
    
    // Clear search
    await userEvent.clear(searchInput);
    
    // Should show all vaults again
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.getByText('Beta Reserve')).toBeInTheDocument();
  });

  test('typing search query with partial match', async () => {
    await waitFor(() => screen.getByText('Your Vaults'));
    
    const searchInput = screen.getByTestId('vault-search-input');
    
    // Type "vault" (should only match "Alpha Vault")
    await userEvent.type(searchInput, 'vault');
    
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.queryByText('Beta Reserve')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma Fund')).not.toBeInTheDocument();
  });

  test('combined status filter and search query', async () => {
    await waitFor(() => screen.getByText('Your Vaults'));
    
    const searchInput = screen.getByTestId('vault-search-input');
    const activeChip = screen.getByRole('button', { name: 'Active' });
    
    // Filter by active status
    await userEvent.click(activeChip);
    
    // Type "alpha"
    await userEvent.type(searchInput, 'alpha');
    
    // Should only show Alpha Vault (active AND matches search)
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.queryByText('Beta Reserve')).not.toBeInTheDocument();
  });

  test('sort select changes sorting order', async () => {
    await waitFor(() => screen.getByText('Your Vaults'));
    
    const sortSelect = screen.getByTestId('vault-sort-select');
    
    // Default is deadline ascending (nearest first)
    expect(sortSelect).toHaveValue('deadline-asc');
    
    // Change to amount descending
    await userEvent.selectOptions(sortSelect, 'amount-desc');
    expect(sortSelect).toHaveValue('amount-desc');
  });

  test('empty result state shows clear message when filters match nothing', async () => {
    await waitFor(() => screen.getByText('Your Vaults'));
    
    const searchInput = screen.getByTestId('vault-search-input');
    
    // Type a query that matches nothing
    await userEvent.type(searchInput, 'nonexistent');
    
    // Should show empty result message
    await waitFor(() => screen.getByText('No vaults match your filters.'));
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  test('clear filters button resets all filters', async () => {
    await waitFor(() => screen.getByText('Your Vaults'));
    
    const searchInput = screen.getByTestId('vault-search-input');
    const activeChip = screen.getByRole('button', { name: 'Active' });
    
    // Apply filters
    await userEvent.click(activeChip);
    await userEvent.type(searchInput, 'nonexistent');
    
    // Should show empty result
    await waitFor(() => screen.getByText('No vaults match your filters.'));
    
    // Click clear filters
    const clearButton = screen.getByRole('button', { name: 'Clear filters' });
    await userEvent.click(clearButton);
    
    // Should show all vaults again
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.getByText('Beta Reserve')).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
  });

  test('vault rows maintain link-to-detail navigation', async () => {
    await waitFor(() => screen.getByText('Your Vaults'));
    
    const alphaVaultLink = screen.getByText('Alpha Vault').closest('a');
    expect(alphaVaultLink).toHaveAttribute('href', '/vaults/1');
    
    const betaVaultLink = screen.getByText('Beta Reserve').closest('a');
    expect(betaVaultLink).toHaveAttribute('href', '/vaults/2');
  });
});
