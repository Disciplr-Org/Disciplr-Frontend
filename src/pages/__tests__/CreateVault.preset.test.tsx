import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CreateVault from "../CreateVault";
import { ACCOUNT_A, ACCOUNT_C, ACCOUNT_D } from "@/__tests__/fixtures/stellarAddresses";
import { saveUserTemplate } from "../../utils/vaultTemplates";

vi.mock("../../context/WalletContext", () => ({
  useWallet: () => ({
    address: ACCOUNT_A,
    network: "TESTNET",
    balance: "10000",
    balanceStatus: "success",
    isConnecting: false,
    error: null,
    connect: async () => {},
    disconnect: () => {},
    checkConnection: async () => {},
  }),
}));

describe("CreateVault preset highlight persistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("persists preset active state after 1 minute passes", async () => {
    render(
      <MemoryRouter>
        <CreateVault />
      </MemoryRouter>
    );

    const preset7dButton = screen.getByRole("button", { name: "7 days" });

    // Initially not highlighted (fontWeight not 600 or check style)
    expect(preset7dButton).toHaveStyle({ fontWeight: 400 });

    // Click preset button
    await act(async () => {
      preset7dButton.click();
    });

    // Now highlighted
    expect(preset7dButton).toHaveStyle({ fontWeight: 600 });

    // Advance clock by 2 minutes
    await act(async () => {
      vi.advanceTimersByTime(120_000);
    });

    // Preset button highlight should persist because state tracks selectedPreset
    expect(preset7dButton).toHaveStyle({ fontWeight: 600 });
  });
});

describe("CreateVault templates", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows validation error when applying a template with an invalid destination address", async () => {
    const user = userEvent.setup();
    saveUserTemplate(ACCOUNT_A, "Bad Destination", {
      amount: "250",
      deadlinePreset: "7d",
      successAddress: "NOT_A_VALID_STELLAR_ADDRESS",
      failureAddress: ACCOUNT_C,
      verifierAddress: ACCOUNT_D,
      milestones: [{ title: "Step 1", criteria: "Done" }],
    });

    render(
      <MemoryRouter>
        <CreateVault />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Templates" }));
    expect(screen.getByText("Bad Destination")).toBeInTheDocument();

    const applyButtons = screen.getAllByRole("button", { name: "Apply" });
    await user.click(applyButtons[0]);

    expect(
      screen.getAllByText(/Enter a valid Stellar public key starting with G or C/i).length
    ).toBeGreaterThan(0);
  });

  it("shows a non-blocking error when localStorage.setItem throws on save", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreateVault />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Save as template" }));
    const nameInput = screen.getByLabelText(/Template name/i);
    await user.type(nameInput, "Quota Test");

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    await user.click(screen.getByRole("button", { name: "Save template" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/browser storage/i);
    // Non-blocking: user can close modal and keep using the form
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByLabelText(/Vault name/i)).toBeInTheDocument();
  });
});
