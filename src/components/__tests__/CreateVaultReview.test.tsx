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
        milestones={[
          {
            title: "Design approved",
            criteria: "Verifier signs the design handoff",
          },
          {
            title: "Launch ready",
            criteria: "Deployment checklist is complete",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /review vault details/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("100.1234567")).toBeInTheDocument();
    expect(screen.getByText("2030-01-01T00:00")).toBeInTheDocument();
    expect(screen.getByTitle(successAddress)).toBeInTheDocument();
    expect(screen.getByTitle(failureAddress)).toBeInTheDocument();
    expect(screen.getByText("Verifier address")).toBeInTheDocument();
    expect(screen.getByText("Milestones")).toBeInTheDocument();
    expect(screen.getByText("Design approved")).toBeInTheDocument();
    expect(
      screen.getByText("Verifier signs the design handoff"),
    ).toBeInTheDocument();
    expect(screen.getByText("Launch ready")).toBeInTheDocument();
    expect(
      screen.getByText("Deployment checklist is complete"),
    ).toBeInTheDocument();
  });

  it("keeps the legacy single milestone prop rendering", () => {
    render(
      <CreateVaultReview
        amount="100"
        deadline="2030-01-01T00:00"
        successAddress={`G${"A".repeat(55)}`}
        failureAddress={`G${"B".repeat(55)}`}
        milestone="Deliverables approved"
      />,
    );

    expect(screen.getByText("Milestones")).toBeInTheDocument();
    expect(screen.getByText("Deliverables approved")).toBeInTheDocument();
  });
});
