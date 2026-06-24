import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import VaultTransactions from "../VaultTransactions";

describe("VaultTransactions formatting", () => {
  it("formats moved capital and amount filters as USDC while preserving XLM fees", () => {
    render(<VaultTransactions />);

    expect(screen.getByText("172,201.25 USDC")).toBeInTheDocument();
    expect(screen.getByText("0.00121 XLM")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Min USDC")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Max USDC")).toBeInTheDocument();
  });
});
