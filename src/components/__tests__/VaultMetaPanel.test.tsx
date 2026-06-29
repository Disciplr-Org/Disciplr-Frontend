import {
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VaultMetaPanel } from "../VaultMetaPanel";
import React from "react";

const CREATOR = "GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L";
const VERIFIER = "GVERIF3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK";
const SUCCESS = "GSUCC3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK";
const FAILURE = "GFAIL3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK";
const CONTRACT = "GCONT3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK";

function setup({ network }: { network: "TESTNET" | "PUBLIC" | null }) {
  return render(
    <VaultMetaPanel
      network={network}
      creatorAddress={CREATOR}
      verifierAddress={VERIFIER}
      successAddress={SUCCESS}
      failureAddress={FAILURE}
      contractAddress={CONTRACT}
    />,
  );
}

describe("VaultMetaPanel", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it("renders labeled rows for all addresses and uses AddressDisplay copy/explorer", async () => {
    setup({ network: "TESTNET" });

    const region = screen.getByLabelText("Vault metadata");
    expect(within(region).getByText("Creator")).toBeInTheDocument();
    expect(within(region).getByText("Verifier")).toBeInTheDocument();
    expect(within(region).getByText("Success destination")).toBeInTheDocument();
    expect(within(region).getByText("Failure destination")).toBeInTheDocument();
    expect(within(region).getByText("Contract")).toBeInTheDocument();

    // AddressDisplay should render explorer links when network is provided.
    // We assert one link per row by matching the expected href.
    expect(
      screen
        .getAllByRole("link", { name: /view.*on stellar expert/i })
        .map((l) => l.getAttribute("href")),
    ).toEqual(
      expect.arrayContaining([
        `https://stellar.expert/explorer/testnet/account/${CREATOR}`,
        `https://stellar.expert/explorer/testnet/account/${VERIFIER}`,
        `https://stellar.expert/explorer/testnet/account/${SUCCESS}`,
        `https://stellar.expert/explorer/testnet/account/${FAILURE}`,
        `https://stellar.expert/explorer/testnet/account/${CONTRACT}`,
      ]),
    );

    // Copy buttons should exist per row (AddressDisplay renders one copy button per address)
    const copyButtons = within(region).getAllByRole("button", {
      name: /copy address/i,
    });
    expect(copyButtons.length).toBe(5);

    // Click one and ensure UI updates to "Copied".
    fireEvent.click(copyButtons[0]);
    await waitFor(() => {
      expect(
        within(region).getByRole("button", { name: /copied/i }),
      ).toBeInTheDocument();
    });
  });

  it("hides the verifier row when verifierAddress is missing", () => {
    render(
      <VaultMetaPanel
        network={"TESTNET"}
        creatorAddress={CREATOR}
        verifierAddress={undefined}
        successAddress={SUCCESS}
        failureAddress={FAILURE}
        contractAddress={CONTRACT}
      />,
    );

    const region = screen.getByLabelText("Vault metadata");
    expect(within(region).getByText("Creator")).toBeInTheDocument();
    expect(within(region).queryByText("Verifier")).not.toBeInTheDocument();
    expect(within(region).getByText("Contract")).toBeInTheDocument();
  });

  it("renders explorer links only when network is not null", () => {
    render(
      <VaultMetaPanel
        network={null}
        creatorAddress={CREATOR}
        verifierAddress={VERIFIER}
        successAddress={SUCCESS}
        failureAddress={FAILURE}
        contractAddress={CONTRACT}
      />,
    );

    // Explorer links come from AddressDisplay; when network is omitted/null they should not render.
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
