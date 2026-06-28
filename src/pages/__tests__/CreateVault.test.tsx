import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CreateVault from "../CreateVault";

vi.mock("../../context/WalletContext", () => ({
  useWallet: vi.fn(() => ({ balance: null, balanceStatus: "idle" })),
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
    mockUseWallet.mockReturnValue({
      balance: null,
      balanceStatus: "idle",
    } as ReturnType<typeof useWallet>);
  });

  it("renders accessible inline errors and blocks invalid submissions", () => {
    const consoleDebug = vi
      .spyOn(console, "debug")
      .mockImplementation(() => undefined);
    render(<CreateVault />);

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
    ).toHaveLength(4);

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
    render(<CreateVault />);

    fillField(/amount/i, "100");
    fillField(/deadline/i, "2030-01-01T00:00");
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, successAddress);
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

    expect(consoleDebug).toHaveBeenCalledWith("CreateVault confirm", {
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

    expect(consoleDebug).toHaveBeenCalledWith(
      "CreateVault confirm",
      expect.objectContaining({ amount: "1234.5678" }),
    );
  });

  it("shows insufficient balance warning when amount exceeds balance", () => {
    mockUseWallet.mockReturnValue({
      balance: "50",
      balanceStatus: "success",
    } as ReturnType<typeof useWallet>);
    render(<CreateVault />);

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
    render(<CreateVault />);

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "100" },
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Deadline preset buttons                                            */
  /* ------------------------------------------------------------------ */
  it("renders deadline preset buttons", () => {
    render(<CreateVault />);

    expect(screen.getByRole("button", { name: "7 days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30 days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "90 days" })).toBeInTheDocument();
  });

  it("preset buttons populate deadline field with future timestamp", () => {
    render(<CreateVault />);

    const now = new Date();
    fireEvent.click(screen.getByRole("button", { name: "7 days" }));

    const deadlineInput = screen.getByLabelText(/deadline/i);
    const value = deadlineInput.getAttribute("value");
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

    const futureDate = new Date(value!);
    expect(futureDate.getTime()).toBeGreaterThan(now.getTime());
  });

  it("selecting preset clears deadline error", () => {
    const consoleDebug = vi
      .spyOn(console, "debug")
      .mockImplementation(() => undefined);
    render(<CreateVault />);

    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));
    expect(screen.getByText("Choose a future deadline.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "30 days" }));
    expect(screen.queryByText("Choose a future deadline.")).not.toBeInTheDocument();
  });

  it("computed deadline satisfies isFutureDeadline validation", () => {
    const consoleDebug = vi
      .spyOn(console, "debug")
      .mockImplementation(() => undefined);
    render(<CreateVault />);

    fillField(/amount/i, "100");
    fillField(/success destination/i, successAddress);
    fillField(/failure destination/i, failureAddress);

    fireEvent.click(screen.getByRole("button", { name: "90 days" }));
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));

    expect(screen.queryByText("Choose a future deadline.")).not.toBeInTheDocument();
  });
});
