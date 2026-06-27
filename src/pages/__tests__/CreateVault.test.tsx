import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CreateVault from "../CreateVault";

vi.mock("../../context/WalletContext", () => ({
  useWallet: vi.fn(() => ({ balance: null, balanceStatus: 'idle' })),
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

function fillValidForm() {
  fillField(/amount/i, "100.1234567");
  fillField(/deadline/i, "2030-01-01T00:00");
  fillField(/success destination/i, successAddress);
  fillField(/failure destination/i, failureAddress);
  fillField(/milestone title/i, milestoneTitle);
  fillField(/milestone criteria/i, milestoneCriteria);
}

describe("CreateVault", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockUseWallet.mockReturnValue({ balance: null, balanceStatus: 'idle' } as ReturnType<typeof useWallet>);
  });

  it("renders accessible inline errors and blocks invalid submissions", () => {
    const consoleDebug = vi
      .spyOn(console, "debug")
      .mockImplementation(() => undefined);
    render(<CreateVault />);

    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    expect(
      screen.getByText(
        "Enter a positive USDC amount with up to 7 decimal places.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Choose a future deadline.")).toBeInTheDocument();
    expect(
      screen.getAllByText("Enter a valid Stellar public key starting with G."),
    ).toHaveLength(2);
    expect(screen.getByText("Enter a milestone title.")).toBeInTheDocument();
    expect(screen.getByText("Enter the milestone criteria.")).toBeInTheDocument();

    const amount = screen.getByLabelText(/amount/i);
    expect(amount).toHaveAttribute("aria-invalid", "true");
    expect(amount).toHaveAttribute(
      "aria-describedby",
      "field-amount-(usdc)-error",
    );
    expect(consoleDebug).not.toHaveBeenCalled();
  });

  it("rejects identical destination addresses", () => {
    render(<CreateVault />);

    fillField(/amount/i, "100");
    fillField(/deadline/i, "2030-01-01T00:00");
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, successAddress);
    fillField(/milestone title/i, milestoneTitle);
    fillField(/milestone criteria/i, milestoneCriteria);
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    expect(
      screen.getByText(
        "Failure destination must be different from success destination.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/failure destination/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("shows the review step for valid values and confirms once", () => {
    const consoleDebug = vi
      .spyOn(console, "debug")
      .mockImplementation(() => undefined);
    render(<CreateVault />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    expect(
      screen.getByRole("heading", { name: /review vault details/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Enter a positive USDC amount/),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirm vault/i }));

    expect(consoleDebug).toHaveBeenCalledWith('CreateVault confirm', {
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
    render(<CreateVault />);

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

  /* ------------------------------------------------------------------ */
  /*  Amount input mask                                                  */
  /* ------------------------------------------------------------------ */
  it("formats amount with thousands grouping while typing", () => {
    render(<CreateVault />);
    const input = screen.getByLabelText(/amount/i);

    fireEvent.change(input, { target: { value: "1234" } });
    expect(input).toHaveValue("1,234");

    fireEvent.change(input, { target: { value: "12345" } });
    expect(input).toHaveValue("12,345");

    fireEvent.change(input, { target: { value: "1234567" } });
    expect(input).toHaveValue("1,234,567");
  });

  it("caps decimal places at 7 while typing", () => {
    render(<CreateVault />);
    const input = screen.getByLabelText(/amount/i);

    fireEvent.change(input, { target: { value: "1.123456789" } });
    expect(input).toHaveValue("1.1234567");
  });

  it("strips non-numeric paste content", () => {
    render(<CreateVault />);
    const input = screen.getByLabelText(/amount/i);

    fireEvent.change(input, { target: { value: "abc1.5def" } });
    expect(input).toHaveValue("1.5");
  });

  it("normalises leading zeros", () => {
    render(<CreateVault />);
    const input = screen.getByLabelText(/amount/i);

    fireEvent.change(input, { target: { value: "001" } });
    expect(input).toHaveValue("1");
  });

  it("handles empty input gracefully", () => {
    render(<CreateVault />);
    const input = screen.getByLabelText(/amount/i);

    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue("");
  });

  it("keeps underlying raw value compatible with isValidUsdcAmount", () => {
    const consoleDebug = vi
      .spyOn(console, "debug")
      .mockImplementation(() => undefined);
    render(<CreateVault />);

    // Type a number that would get formatted with commas in the display
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

    // The raw amount passed to the confirm handler should not have commas
    // and should be compatible with isValidUsdcAmount
    expect(consoleDebug).toHaveBeenCalledWith(
      'CreateVault confirm',
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
    mockUseWallet.mockReturnValue({ balance: '50', balanceStatus: 'success' } as ReturnType<typeof useWallet>);
    render(<CreateVault />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "100" } });

    expect(screen.getByRole('status')).toHaveTextContent(/exceeds your available usdc balance/i);
  });

  it("does not show warning when amount equals balance", () => {
    mockUseWallet.mockReturnValue({ balance: '100', balanceStatus: 'success' } as ReturnType<typeof useWallet>);
    render(<CreateVault />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "100" } });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it("does not show warning when amount is within balance", () => {
    mockUseWallet.mockReturnValue({ balance: '200', balanceStatus: 'success' } as ReturnType<typeof useWallet>);
    render(<CreateVault />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "100" } });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it("does not show warning when balance is null (not loaded)", () => {
    mockUseWallet.mockReturnValue({ balance: null, balanceStatus: 'loading' } as ReturnType<typeof useWallet>);
    render(<CreateVault />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "100" } });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it("does not show warning when wallet is disconnected", () => {
    mockUseWallet.mockReturnValue({ balance: null, balanceStatus: 'idle' } as ReturnType<typeof useWallet>);
    render(<CreateVault />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "100" } });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it("does not show warning when balanceStatus is no_trustline", () => {
    mockUseWallet.mockReturnValue({ balance: null, balanceStatus: 'no_trustline' } as ReturnType<typeof useWallet>);
    render(<CreateVault />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "100" } });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
