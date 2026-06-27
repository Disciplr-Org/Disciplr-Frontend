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

function fillField(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
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

    fillField(/amount/i, "100.1234567");
    fillField(/deadline/i, "2030-01-01T00:00");
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, failureAddress);
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
