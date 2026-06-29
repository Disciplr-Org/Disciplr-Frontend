import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import CreateVault from "../CreateVault";

vi.mock("../../context/WalletContext", () => ({
  useWallet: vi.fn(() => ({ balance: null, balanceStatus: "idle" })),
}));

import { useWallet } from "../../context/WalletContext";
const mockUseWallet = vi.mocked(useWallet);

const successAddress = `G${"A".repeat(55)}`;
const failureAddress = `G${"B".repeat(55)}`;
const milestoneTitle = "Launch MVP";
const milestoneCriteria = "All core features shipped and tested.";

function fillField(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function renderCreateVault(state?: unknown) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/vaults/create",
          state,
        },
      ]}
    >
      <CreateVault />
    </MemoryRouter>,
  );
}

describe("CreateVault", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockUseWallet.mockReturnValue({
      balance: null,
      balanceStatus: "idle",
    } as ReturnType<typeof useWallet>);
  });

  it("renders accessible inline errors and blocks invalid submissions", () => {
    const consoleDebug = vi
      .spyOn(console, "debug")
      .mockImplementation(() => undefined);
    renderCreateVault();

    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please fix the highlighted fields before creating the vault.",
    );
    expect(
      screen.getAllByText(
        "Enter a positive USDC amount with up to 7 decimal places.",
      ),
    ).toHaveLength(2);
    expect(screen.getAllByText("Choose a future deadline.")).toHaveLength(2);
    expect(
      screen.getAllByText("Enter a valid Stellar public key starting with G."),
    ).toHaveLength(2);
    expect(screen.getByText("Enter a milestone title.")).toBeInTheDocument();
    expect(screen.getByText("Enter the milestone criteria.")).toBeInTheDocument();

    const amount = screen.getByLabelText(/amount/i);
    expect(amount).toHaveAttribute("aria-invalid", "true");
    expect(amount).toHaveAttribute(
      "aria-describedby",
      "create-vault-amount-error",
    );
    expect(amount).toHaveFocus();

    const deadline = screen.getByLabelText(/deadline/i);
    expect(deadline).toHaveAttribute(
      "aria-describedby",
      "create-vault-deadline-error",
    );

    const success = screen.getByLabelText(/success destination/i);
    expect(success).toHaveAttribute(
      "aria-describedby",
      "create-vault-success-address-error",
    );

    const failure = screen.getByLabelText(/failure destination/i);
    expect(failure).toHaveAttribute(
      "aria-describedby",
      "create-vault-failure-address-error",
    );
    expect(consoleDebug).not.toHaveBeenCalled();
  });

  it("rejects identical destination addresses", () => {
    renderCreateVault();

    fillField(/amount/i, "100");
    fillField(/deadline/i, "2030-01-01T00:00");
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, successAddress);
    fillField(/milestone title/i, milestoneTitle);
    fillField(/milestone criteria/i, milestoneCriteria);
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    expect(
      screen.getAllByText(
        "Failure destination must be different from success destination.",
      ),
    ).toHaveLength(2);
    expect(screen.getByLabelText(/failure destination/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("shows the review step for valid values and confirms once", () => {
    const consoleDebug = vi
      .spyOn(console, "debug")
      .mockImplementation(() => undefined);
    renderCreateVault();

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    expect(
      screen.getByRole("heading", { name: /review vault details/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Enter a positive USDC amount/),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirm vault/i }));

    expect(consoleDebug).toHaveBeenCalledWith("CreateVault confirm", {
      amount: "100.1234567",
      deadline: "2030-01-01T00:00",
      successAddress,
      failureAddress,
      milestoneTitle,
      milestoneCriteria,
      evidenceUrl: undefined,
    });
    expect(consoleDebug).toHaveBeenCalledTimes(1);
  });

  it("returns to edit mode without losing entered values", () => {
    renderCreateVault();

    fillField(/amount/i, "55");
    fillField(/deadline/i, "2030-02-02T00:00");
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, failureAddress);
    fillField(/milestone title/i, milestoneTitle);
    fillField(/milestone criteria/i, milestoneCriteria);
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    fireEvent.click(screen.getByRole("button", { name: /back to edit/i }));

    expect(screen.getByLabelText(/amount/i)).toHaveValue("55");
    expect(screen.getByLabelText(/deadline/i)).toHaveValue("2030-02-02T00:00");
    expect(screen.getByLabelText(/success destination/i)).toHaveValue(
      successAddress,
    );
    expect(screen.getByLabelText(/failure destination/i)).toHaveValue(
      failureAddress,
    );
    expect(screen.getByLabelText(/milestone title/i)).toHaveValue(milestoneTitle);
    expect(screen.getByLabelText(/milestone criteria/i)).toHaveValue(milestoneCriteria);
  });

  it("keeps the blank form unchanged when no duplicate prefill is present", () => {
    renderCreateVault();

    expect(screen.getByLabelText(/amount/i)).toHaveValue("");
    expect(screen.getByLabelText(/deadline/i)).toHaveValue("");
    expect(screen.getByLabelText(/success destination/i)).toHaveValue("");
    expect(screen.getByLabelText(/failure destination/i)).toHaveValue("");
    expect(screen.queryByText(/duplicating/i)).not.toBeInTheDocument();
  });

  it("prefills duplicated vault amount and destinations while clearing deadline", () => {
    renderCreateVault({
      createVaultPrefill: {
        sourceVaultName: "Alpha Vault",
        amount: "12500",
        successAddress,
        failureAddress,
        milestones: [{ title: "Phase 1", criteria: "Ship it" }],
      },
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      /duplicating alpha vault/i,
    );
    expect(screen.getByLabelText(/amount/i)).toHaveValue("12,500");
    expect(screen.getByLabelText(/deadline/i)).toHaveValue("");
    expect(screen.getByLabelText(/success destination/i)).toHaveValue(
      successAddress,
    );
    expect(screen.getByLabelText(/failure destination/i)).toHaveValue(
      failureAddress,
    );
  });

  it("surfaces validation errors for invalid duplicated values", () => {
    renderCreateVault({
      createVaultPrefill: {
        sourceVaultName: "Broken Vault",
        amount: "0",
        successAddress: "not-a-stellar-address",
        failureAddress: failureAddress,
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    expect(
      screen.getAllByText(
        "Enter a positive USDC amount with up to 7 decimal places.",
      ),
    ).toHaveLength(2);
    expect(screen.getAllByText("Choose a future deadline.")).toHaveLength(2);
    expect(
      screen.getAllByText("Enter a valid Stellar public key starting with G."),
    ).toHaveLength(2);
  });

  it("formats amount with thousands grouping while typing", () => {
    renderCreateVault();
    const input = screen.getByLabelText(/amount/i);

    fireEvent.change(input, { target: { value: "1234" } });
    expect(input).toHaveValue("1,234");

    fireEvent.change(input, { target: { value: "12345" } });
    expect(input).toHaveValue("12,345");

    fireEvent.change(input, { target: { value: "1234567" } });
    expect(input).toHaveValue("1,234,567");
  });

  it("caps decimal places at 7 while typing", () => {
    renderCreateVault();
    const input = screen.getByLabelText(/amount/i);

    fireEvent.change(input, { target: { value: "1.123456789" } });
    expect(input).toHaveValue("1.1234567");
  });

  it("strips non-numeric paste content", () => {
    renderCreateVault();
    const input = screen.getByLabelText(/amount/i);

    fireEvent.change(input, { target: { value: "abc1.5def" } });
    expect(input).toHaveValue("1.5");
  });

  it("normalises leading zeros", () => {
    renderCreateVault();
    const input = screen.getByLabelText(/amount/i);

    fireEvent.change(input, { target: { value: "001" } });
    expect(input).toHaveValue("1");
  });

  it("handles empty input gracefully", () => {
    renderCreateVault();
    const input = screen.getByLabelText(/amount/i);

    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue("");
  });

  it("keeps underlying raw value compatible with isValidUsdcAmount", () => {
    const consoleDebug = vi
      .spyOn(console, "debug")
      .mockImplementation(() => undefined);
    renderCreateVault();

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "1234.5678" },
    });
    fireEvent.change(screen.getByLabelText(/deadline/i), {
      target: { value: "2030-01-01T00:00" },
    });
    fireEvent.change(screen.getByLabelText(/success destination/i), {
      target: { value: successAddress },
    });
    fireEvent.change(screen.getByLabelText(/failure destination/i), {
      target: { value: failureAddress },
    });
    fireEvent.change(screen.getByLabelText(/milestone title/i), {
      target: { value: milestoneTitle },
    });
    fireEvent.change(screen.getByLabelText(/milestone criteria/i), {
      target: { value: milestoneCriteria },
    });

    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm vault/i }));

    expect(consoleDebug).toHaveBeenCalledWith(
      "CreateVault confirm",
      expect.objectContaining({ amount: "1234.5678" }),
    );
  });

  /* ------------------------------------------------------------------ */
  /*  Milestone fields                                                   */
  /* ------------------------------------------------------------------ */
  it("shows milestone title error when title is empty", () => {
    render(<CreateVault />);
    fillField(/amount/i, "100");
    fillField(/deadline/i, "2030-01-01T00:00");
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, failureAddress);
    fillField(/milestone criteria/i, milestoneCriteria);
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    expect(screen.getByText("Enter a milestone title.")).toBeInTheDocument();
    expect(screen.getByLabelText(/milestone title/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("shows milestone criteria error when criteria is empty", () => {
    render(<CreateVault />);
    fillField(/amount/i, "100");
    fillField(/deadline/i, "2030-01-01T00:00");
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, failureAddress);
    fillField(/milestone title/i, milestoneTitle);
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    expect(screen.getByText("Enter the milestone criteria.")).toBeInTheDocument();
    expect(screen.getByLabelText(/milestone criteria/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("clears milestone title error on change", () => {
    render(<CreateVault />);
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));
    expect(screen.getByText("Enter a milestone title.")).toBeInTheDocument();

    fillField(/milestone title/i, "Fixed");
    expect(screen.queryByText("Enter a milestone title.")).not.toBeInTheDocument();
  });

  it("clears milestone criteria error on change", () => {
    render(<CreateVault />);
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));
    expect(screen.getByText("Enter the milestone criteria.")).toBeInTheDocument();

    fillField(/milestone criteria/i, "Fixed criteria");
    expect(screen.queryByText("Enter the milestone criteria.")).not.toBeInTheDocument();
  });

  it("includes milestoneTitle and milestoneCriteria in confirm payload", () => {
    const consoleDebug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    render(<CreateVault />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm vault/i }));

    expect(consoleDebug).toHaveBeenCalledWith(
      'CreateVault confirm',
      expect.objectContaining({ milestoneTitle, milestoneCriteria }),
    );
  });

  /* ------------------------------------------------------------------ */
  /*  Balance warning                                                    */
  /* ------------------------------------------------------------------ */
  it("shows insufficient balance warning when amount exceeds balance", () => {
    mockUseWallet.mockReturnValue({
      balance: "50",
      balanceStatus: "success",
    } as ReturnType<typeof useWallet>);
    renderCreateVault();

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "100" },
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      /exceeds your available usdc balance/i,
    );
  });

  it("does not show warning when amount equals balance", () => {
    mockUseWallet.mockReturnValue({
      balance: "100",
      balanceStatus: "success",
    } as ReturnType<typeof useWallet>);
    renderCreateVault();

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "100" },
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Deadline preset buttons                                            */
  /* ------------------------------------------------------------------ */
  it("renders deadline preset buttons", () => {
    renderCreateVault();

    expect(screen.getByRole("button", { name: "7 days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30 days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "90 days" })).toBeInTheDocument();
  });

  it("preset buttons populate deadline field with future timestamp", () => {
    renderCreateVault();

    const now = new Date();
    fireEvent.click(screen.getByRole("button", { name: "7 days" }));

    const deadlineInput = screen.getByLabelText(/deadline/i);
    const value = deadlineInput.getAttribute("value");
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

    const futureDate = new Date(value!);
    expect(futureDate.getTime()).toBeGreaterThan(now.getTime());
  });

  it("selecting preset clears deadline error", () => {
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    renderCreateVault();

    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));
    expect(
      screen.getAllByText("Choose a future deadline.").length,
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "30 days" }));
    expect(
      screen.queryByText("Choose a future deadline."),
    ).not.toBeInTheDocument();
  });

  it("computed deadline satisfies isFutureDeadline validation", () => {
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    renderCreateVault();

    fillField(/amount/i, "100");
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, failureAddress);

    fireEvent.click(screen.getByRole("button", { name: "90 days" }));
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    expect(
      screen.queryByText("Choose a future deadline."),
    ).not.toBeInTheDocument();
  });

  it('accepts valid optional verifier address', () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    render(<CreateVault />);

    fillField(/amount/i, '100');
    fillField(/deadline/i, '2030-01-01T00:00');
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, failureAddress);
    fillField(/verifier/i, verifierAddress);
    fireEvent.click(screen.getByRole('button', { name: /create vault/i }));

    expect(screen.queryByText(/Enter a valid Stellar public key/)).not.toBeInTheDocument();
    expect(consoleLog).toHaveBeenCalledWith({
      amount: '100',
      deadline: '2030-01-01T00:00',
      successAddress,
      failureAddress,
      verifierAddress,
    });
  });

  it('rejects verifier matching success destination', () => {
    render(<CreateVault />);

    fillField(/amount/i, '100');
    fillField(/deadline/i, '2030-01-01T00:00');
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, failureAddress);
    fillField(/verifier/i, successAddress);
    fireEvent.click(screen.getByRole('button', { name: /create vault/i }));

    expect(
      screen.getByText('Verifier must be different from the success destination.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/verifier/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('rejects verifier matching failure destination', () => {
    render(<CreateVault />);

    fillField(/amount/i, '100');
    fillField(/deadline/i, '2030-01-01T00:00');
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, failureAddress);
    fillField(/verifier/i, failureAddress);
    fireEvent.click(screen.getByRole('button', { name: /create vault/i }));

    expect(
      screen.getByText('Verifier must be different from the failure destination.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/verifier/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('rejects invalid verifier address', () => {
    render(<CreateVault />);

    fillField(/amount/i, '100');
    fillField(/deadline/i, '2030-01-01T00:00');
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, failureAddress);
    fillField(/verifier/i, 'bad');
    fireEvent.click(screen.getByRole('button', { name: /create vault/i }));

    expect(
      screen.getByText('Enter a valid Stellar public key starting with G.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/verifier/i)).toHaveAttribute('aria-invalid', 'true');
  });
});
