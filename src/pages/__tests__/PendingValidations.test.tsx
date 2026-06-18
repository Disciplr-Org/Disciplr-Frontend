import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import PendingValidations from "../PendingValidations";
import { useVerifierStore } from "../../Zustand/Store";

vi.mock("../../Zustand/Store", () => ({
  useVerifierStore: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const makeTasks = () => [
  {
    id: "v-1",
    vaultName: "Alpha Vault",
    owner: "0xAAAA",
    amount: "10,000 USDC",
    deadline: "2026-07-01",
    daysRemaining: 10,
    status: "pending" as const,
    milestone: "Phase 1",
  },
  {
    id: "v-2",
    vaultName: "Beta Vault",
    owner: "0xBBBB",
    amount: "5,000 USDC",
    deadline: "2026-06-20",
    daysRemaining: 2,
    status: "pending" as const,
    milestone: "Phase 2",
  },
  {
    id: "v-3",
    vaultName: "Gamma Vault",
    owner: "0xCCCC",
    amount: "20,000 USDC",
    deadline: "2026-07-10",
    daysRemaining: 20,
    status: "pending" as const,
    milestone: "Phase 3",
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <PendingValidations />
    </MemoryRouter>,
  );
}

describe("PendingValidations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useVerifierStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      pendingValidations: makeTasks(),
    });
  });

  it("renders the page heading", () => {
    renderPage();
    expect(screen.getByText("Pending Validations")).toBeInTheDocument();
  });

  it('shows "All caught up!" when there are no pending validations', () => {
    (useVerifierStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      pendingValidations: [],
    });
    renderPage();
    expect(screen.getByText("All caught up!")).toBeInTheDocument();
    expect(screen.getByText(/no pending validations/i)).toBeInTheDocument();
  });

  it("does not render the table when queue is empty", () => {
    (useVerifierStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      pendingValidations: [],
    });
    renderPage();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders a row for each pending task", () => {
    renderPage();
    expect(screen.getByText("Alpha Vault")).toBeInTheDocument();
    expect(screen.getByText("Beta Vault")).toBeInTheDocument();
    expect(screen.getByText("Gamma Vault")).toBeInTheDocument();
  });

  it('default sort is ascending (most urgent first) and button shows "High to Low"', () => {
    renderPage();
    expect(
      screen.getByRole("button", { name: /High to Low/i }),
    ).toBeInTheDocument();

    const vaultCells = screen.getAllByText(/Vault$/);
    expect(vaultCells[0].textContent).toBe("Beta Vault");
    expect(vaultCells[1].textContent).toBe("Alpha Vault");
    expect(vaultCells[2].textContent).toBe("Gamma Vault");
  });

  it('toggling sort reverses the order and button shows "Low to High"', () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /High to Low/i }));

    expect(
      screen.getByRole("button", { name: /Low to High/i }),
    ).toBeInTheDocument();

    const vaultCells = screen.getAllByText(/Vault$/);
    expect(vaultCells[0].textContent).toBe("Gamma Vault");
    expect(vaultCells[1].textContent).toBe("Alpha Vault");
    expect(vaultCells[2].textContent).toBe("Beta Vault");
  });

  it("toggling twice returns to original ascending order", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /High to Low/i }));
    fireEvent.click(screen.getByRole("button", { name: /Low to High/i }));

    expect(
      screen.getByRole("button", { name: /High to Low/i }),
    ).toBeInTheDocument();

    const vaultCells = screen.getAllByText(/Vault$/);
    expect(vaultCells[0].textContent).toBe("Beta Vault");
    expect(vaultCells[1].textContent).toBe("Alpha Vault");
    expect(vaultCells[2].textContent).toBe("Gamma Vault");
  });

  it("clicking Review navigates to the correct ValidationDetail route", () => {
    renderPage();
    const reviewButtons = screen.getAllByRole("button", { name: /Review/i });
    fireEvent.click(reviewButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/verifier/queue/v-2");
  });

  it("clicking Back navigates to /verifier", () => {
    renderPage();
    fireEvent.click(screen.getByText(/Back to Dashboard/i));
    expect(mockNavigate).toHaveBeenCalledWith("/verifier");
  });

  it("renders a single task without crashing", () => {
    (useVerifierStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      pendingValidations: [makeTasks()[0]],
    });
    renderPage();
    expect(screen.getByText("Alpha Vault")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("handles ties in daysRemaining", () => {
    (useVerifierStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      pendingValidations: [
        { ...makeTasks()[0], id: "v-a", daysRemaining: 5 },
        { ...makeTasks()[1], id: "v-b", daysRemaining: 5 },
      ],
    });
    renderPage();
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(screen.getAllByText("5 days left")).toHaveLength(2);
  });

  it("marks tasks with 3 or fewer days using the tokenized urgent state", () => {
    renderPage();
    expect(screen.getByText("2 days left")).toHaveClass("is-urgent");
  });

  it("keeps non-urgent deadlines on the base tokenized state", () => {
    renderPage();
    const safeSpan = screen.getByText("10 days left");
    expect(safeSpan).toHaveClass("verifier-table__deadline");
    expect(safeSpan).not.toHaveClass("is-urgent");
  });

  it("uses tokenized verifier page classes for styling", () => {
    renderPage();

    expect(screen.getByRole("table")).toHaveClass("verifier-table");
    expect(screen.getByText("2 days left")).toHaveClass(
      "verifier-table__deadline",
    );
    expect(
      screen.getByRole("button", { name: /Back to Dashboard/i }),
    ).toHaveClass("verifier-page__link-button");
  });
});
