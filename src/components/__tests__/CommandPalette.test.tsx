import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import CommandPalette from "../CommandPalette";
import type { Vault } from "../../types/vault";
import { fuzzyMatch } from "../../utils/commandPalette";

const vaults: Vault[] = [
  {
    id: "alpha-1",
    name: "Alpha Vault",
    status: "active",
    amount: 12500,
    currency: "USDC",
    createdAt: "2024-01-01T00:00:00Z",
    deadline: "2024-07-01T00:00:00Z",
    creatorAddress: "GCREATOR",
    successAddress: "GSUCCESS",
    failureAddress: "GFAILURE",
    contractAddress: "CCONTRACT",
    milestones: [],
    transactions: [],
  },
  {
    id: "beta-2",
    name: "Beta Reserve",
    status: "completed",
    amount: 4200,
    currency: "USDC",
    createdAt: "2024-01-01T00:00:00Z",
    deadline: "2024-07-01T00:00:00Z",
    creatorAddress: "GCREATOR",
    successAddress: "GSUCCESS",
    failureAddress: "GFAILURE",
    contractAddress: "CCONTRACT",
    milestones: [],
    transactions: [],
  },
];

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="current-path">{location.pathname}</div>;
}

function renderPalette(options?: {
  loadVaults?: () => Promise<Vault[]>;
  initialPath?: string;
}) {
  const loadVaults = options?.loadVaults ?? vi.fn().mockResolvedValue(vaults);

  render(
    <MemoryRouter initialEntries={[options?.initialPath ?? "/"]}>
      <CommandPalette loadVaults={loadVaults} />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );

  return { loadVaults };
}

async function openPalette() {
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: /open command palette/i }),
  );
  return user;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fuzzyMatch", () => {
  it("matches subsequence queries without requiring contiguous letters", () => {
    expect(fuzzyMatch("av", "Alpha Vault")).toBe(true);
    expect(fuzzyMatch("b2", "beta-2")).toBe(true);
    expect(fuzzyMatch("zz", "Alpha Vault")).toBe(false);
  });
});

describe("CommandPalette", () => {
  it("opens from the trigger and shows quick actions plus vaults for an empty query", async () => {
    const { loadVaults } = renderPalette();

    await openPalette();

    expect(
      await screen.findByRole("dialog", { name: /search vaults and actions/i }),
    ).toBeInTheDocument();
    expect(loadVaults).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("option", { name: /Create Vault/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Verifier Queue/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Analytics/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("option", { name: /Alpha Vault/i }),
    ).toBeInTheDocument();
  });

  it("opens from Cmd+K and filters vaults by fuzzy name or id", async () => {
    const user = userEvent.setup();
    renderPalette();

    await user.keyboard("{Meta>}k{/Meta}");

    const input = await screen.findByRole("textbox", {
      name: /search vaults and actions/i,
    });
    await user.type(input, "alp");

    expect(
      screen.getByRole("option", { name: /Alpha Vault/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Beta Reserve/i }),
    ).not.toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "beta-2");

    expect(
      screen.getByRole("option", { name: /Beta Reserve/i }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when no vaults or actions match", async () => {
    const user = await openPaletteAfterRender();

    await user.type(
      screen.getByRole("textbox", { name: /search vaults and actions/i }),
      "zzzz",
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "No matching vaults or actions.",
    );
  });

  it("wraps arrow-key selection and navigates with Enter", async () => {
    const user = await openPaletteAfterRender();
    const input = screen.getByRole("textbox", {
      name: /search vaults and actions/i,
    });

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: /Beta Reserve/i }),
      ).toBeInTheDocument(),
    );

    await user.keyboard("{ArrowUp}{Enter}");

    expect(screen.getByTestId("current-path")).toHaveTextContent(
      "/vaults/beta-2",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(input).not.toBeInTheDocument();
  });

  it("closes with Escape, backdrop click, and restores focus to the trigger", async () => {
    renderPalette();
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", {
      name: /open command palette/i,
    });

    trigger.focus();
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", {
      name: /search vaults and actions/i,
    });

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    const reopenedDialog = await screen.findByRole("dialog", {
      name: /search vaults and actions/i,
    });
    await user.click(reopenedDialog.parentElement!);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(dialog).not.toBeInTheDocument();
  });

  it("disables dialog transition when reduced motion is preferred", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    renderPalette();
    await openPalette();

    await waitFor(() =>
      expect(
        screen.getByRole("dialog", { name: /search vaults and actions/i }),
      ).toHaveStyle({
        transition: "none",
      }),
    );
  });
});

async function openPaletteAfterRender() {
  renderPalette();
  return openPalette();
}
