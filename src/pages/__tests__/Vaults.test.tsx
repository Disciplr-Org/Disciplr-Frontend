import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Vaults from "../../pages/Vaults";

// Helper to mock fetch function
const mockSuccess = <T,>(data: T) => vi.fn().mockResolvedValue(data);
const mockFailure = (message = "Network error") =>
  vi.fn().mockRejectedValue(new Error(message));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("Vaults page states", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

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
    await waitFor(() => screen.getByText(/You don't have any vaults yet./i));
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
        status: "active" as any,
        deadline: "2025-01-01T00:00:00Z",
        milestones: [],
      },
    ];
    render(<Vaults fetchVaults={mockSuccess(mockData)} />);
    await waitFor(() => screen.getByText("Test Vault"));
    expect(screen.getByText(/Test Vault/i)).toBeInTheDocument();
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

describe("Vaults view toggle", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  test("defaults to list view when no preference exists", async () => {
    const mockData = [
      {
        id: "1",
        name: "Test Vault",
        amount: 1000,
        currency: "USDC",
        status: "active" as any,
        deadline: "2025-01-01T00:00:00Z",
        milestones: [],
      },
    ];
    render(<Vaults fetchVaults={mockSuccess(mockData)} />);
    await waitFor(() => screen.getByText("Test Vault"));

    const listButton = screen.getByRole("radio", { name: "List" });
    const gridButton = screen.getByRole("radio", { name: "Grid" });

    expect(listButton).toHaveAttribute("aria-checked", "true");
    expect(gridButton).toHaveAttribute("aria-checked", "false");
  });

  test("switches to grid view when grid button is clicked", async () => {
    const mockData = [
      {
        id: "1",
        name: "Test Vault",
        amount: 1000,
        currency: "USDC",
        status: "active" as any,
        deadline: "2025-01-01T00:00:00Z",
        milestones: [],
      },
    ];
    render(<Vaults fetchVaults={mockSuccess(mockData)} />);
    await waitFor(() => screen.getByText("Test Vault"));

    const gridButton = screen.getByRole("radio", { name: "Grid" });
    userEvent.click(gridButton);

    await waitFor(() =>
      expect(gridButton).toHaveAttribute("aria-checked", "true"),
    );
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute(
        "aria-checked",
        "false",
      ),
    );
  });

  test("switches back to list view when list button is clicked", async () => {
    const mockData = [
      {
        id: "1",
        name: "Test Vault",
        amount: 1000,
        currency: "USDC",
        status: "active" as any,
        deadline: "2025-01-01T00:00:00Z",
        milestones: [],
      },
    ];
    render(<Vaults fetchVaults={mockSuccess(mockData)} />);
    await waitFor(() => screen.getByText("Test Vault"));

    const gridButton = screen.getByRole("radio", { name: "Grid" });
    userEvent.click(gridButton);

    const listButton = screen.getByRole("radio", { name: "List" });
    userEvent.click(listButton);

    await waitFor(() =>
      expect(listButton).toHaveAttribute("aria-checked", "true"),
    );
    await waitFor(() =>
      expect(gridButton).toHaveAttribute("aria-checked", "false"),
    );
  });

  test("persists grid view preference to localStorage", async () => {
    const mockData = [
      {
        id: "1",
        name: "Test Vault",
        amount: 1000,
        currency: "USDC",
        status: "active" as any,
        deadline: "2025-01-01T00:00:00Z",
        milestones: [],
      },
    ];
    render(<Vaults fetchVaults={mockSuccess(mockData)} />);
    await waitFor(() => screen.getByText("Test Vault"));

    const gridButton = screen.getByRole("radio", { name: "Grid" });
    userEvent.click(gridButton);

    await waitFor(() =>
      expect(gridButton).toHaveAttribute("aria-checked", "true"),
    );
    expect(localStorageMock.getItem("vaults-view-preference")).toBe("grid");
  });

  test("persists list view preference to localStorage", async () => {
    const mockData = [
      {
        id: "1",
        name: "Test Vault",
        amount: 1000,
        currency: "USDC",
        status: "active" as any,
        deadline: "2025-01-01T00:00:00Z",
        milestones: [],
      },
    ];
    render(<Vaults fetchVaults={mockSuccess(mockData)} />);
    await waitFor(() => screen.getByText("Test Vault"));

    const gridButton = screen.getByRole("radio", { name: "Grid" });
    userEvent.click(gridButton);

    const listButton = screen.getByRole("radio", { name: "List" });
    userEvent.click(listButton);

    await waitFor(() =>
      expect(listButton).toHaveAttribute("aria-checked", "true"),
    );
    expect(localStorageMock.getItem("vaults-view-preference")).toBe("list");
  });

  test("loads grid view from localStorage preference", async () => {
    localStorageMock.setItem("vaults-view-preference", "grid");

    const mockData = [
      {
        id: "1",
        name: "Test Vault",
        amount: 1000,
        currency: "USDC",
        status: "active" as any,
        deadline: "2025-01-01T00:00:00Z",
        milestones: [],
      },
    ];
    render(<Vaults fetchVaults={mockSuccess(mockData)} />);
    await waitFor(() => screen.getByText("Test Vault"));

    const gridButton = screen.getByRole("radio", { name: "Grid" });
    const listButton = screen.getByRole("radio", { name: "List" });

    expect(gridButton).toHaveAttribute("aria-checked", "true");
    expect(listButton).toHaveAttribute("aria-checked", "false");
  });

  test("shows empty state in both views", async () => {
    render(<Vaults fetchVaults={mockSuccess([])} />);
    await waitFor(() => screen.getByText(/You don’t have any vaults yet./i));

    // Toggle buttons should still be present
    expect(screen.getByRole("radio", { name: "List" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Grid" })).toBeInTheDocument();
  });

  test("renders vaults VaultCard in grid view", async () => {
    const mockData = [
      {
        id: "1",
        name: "Test Vault",
        amount: 1000,
        currency: "USDC",
        status: "active" as any,
        deadline: "2025-01-01T00:00:00Z",
        milestones: [],
      },
    ];
    render(<Vaults fetchVaults={mockSuccess(mockData)} />);
    await waitFor(() => screen.getByText("Test Vault"));

    const gridButton = screen.getByRole("radio", { name: "Grid" });
    userEvent.click(gridButton);

    // VaultCard should be rendered with progress bar
    await waitFor(() => screen.getByLabelText(/Test Vault progress/i));
  });

  test("handles localStorage errors gracefully", async () => {
    // Mock localStorage to throw error
    const originalGetItem = localStorageMock.getItem;
    localStorageMock.getItem = vi.fn(() => {
      throw new Error("localStorage error");
    });

    const mockData = [
      {
        id: "1",
        name: "Test Vault",
        amount: 1000,
        currency: "USDC",
        status: "active" as any,
        deadline: "2025-01-01T00:00:00Z",
        milestones: [],
      },
    ];
    render(<Vaults fetchVaults={mockSuccess(mockData)} />);

    // Should still render with default list view
    await waitFor(() => screen.getByText("Test Vault"));
    expect(screen.getByRole("radio", { name: "List" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    localStorageMock.getItem = originalGetItem;
  });
});
