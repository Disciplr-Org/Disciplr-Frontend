import { render, screen, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../Dashboard";
import { MASTER_VAULTS } from "../../fixtures/vaults";
import { computeDashboardSummary } from "../../utils/dashboard";
import { listVaults } from "../../services/vaultService";

// Dashboard fetches its vault list asynchronously via vaultService.listVaults()
// rather than accepting vaults/summary as props, so tests mock that service
// call and await the resulting render instead of passing data in directly.
vi.mock("../../services/vaultService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../services/vaultService")>();
  return { ...actual, listVaults: vi.fn(actual.listVaults) };
});

const mockedListVaults = vi.mocked(listVaults);

describe("Dashboard page", () => {
  beforeEach(() => {
    mockedListVaults.mockClear();
  });

  test("renders successfully with real vault data once loaded", async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    // Verify header title
    expect(
      screen.getByRole("heading", { level: 1, name: /Dashboard/i }),
    ).toBeInTheDocument();

    // Verify cards and sections
    expect(screen.getByText(/Total Locked/i)).toBeInTheDocument();
    const expectedActiveVaults = computeDashboardSummary(
      Object.values(MASTER_VAULTS),
    ).activeVaults;
    await waitFor(() => {
      expect(
        screen.getByText(/Active Vaults/i, { selector: ".text-caption" })
          .parentElement,
      ).toHaveTextContent(String(expectedActiveVaults));
    });
    expect(screen.getByText(/Pending Milestones/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Recent Activity/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Upcoming Deadlines/i }),
    ).toBeInTheDocument();
  });

  test("renders empty state when no vaults are returned", async () => {
    mockedListVaults.mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    // Verify empty state message
    await waitFor(() => {
      expect(screen.getByText(/No vaults yet/i)).toBeInTheDocument();
    });
  });
});
