import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreateVaultReview } from "../CreateVaultReview";

describe("CreateVaultReview", () => {
  it("renders the vault summary and token-styled address details", () => {
    const successAddress = `G${"A".repeat(55)}`;
    const failureAddress = `G${"B".repeat(55)}`;
    const verifierAddress = `G${"C".repeat(55)}`;

    render(
      <CreateVaultReview
        amount="100.1234567"
        deadline="2030-01-01T00:00"
        successAddress={successAddress}
        failureAddress={failureAddress}
        verifierAddress={verifierAddress}
        milestone="Deliverables approved"
      />,
    );

    expect(
      screen.getByRole("heading", { name: /review vault details/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("100.1234567")).toBeInTheDocument();
    expect(screen.getByText("2030-01-01T00:00")).toBeInTheDocument();
    expect(screen.getByText(successAddress)).toBeInTheDocument();
    expect(screen.getByText(failureAddress)).toBeInTheDocument();
    expect(screen.getByText("Verifier address")).toBeInTheDocument();
    expect(screen.getByText("Milestone")).toBeInTheDocument();
  });
});
