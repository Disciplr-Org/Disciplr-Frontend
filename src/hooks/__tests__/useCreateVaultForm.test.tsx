import type { FormEvent, ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACCOUNT_A, ACCOUNT_B, ACCOUNT_C, ACCOUNT_D } from "@/__tests__/fixtures/stellarAddresses";
import { createVaultDraft, writeDraft } from "../../utils/createVaultDraft";
import { useCreateVaultForm } from "../useCreateVaultForm";

vi.mock("../../context/WalletContext", () => ({
  useWallet: () => ({ address: ACCOUNT_A }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe("useCreateVaultForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("restores a saved draft and validates restored values on submit", () => {
    writeDraft(
      ACCOUNT_A,
      createVaultDraft({
        name: "Saved vault",
        amount: "0",
        deadline: "2030-01-01T12:00",
        successAddress: ACCOUNT_B,
        failureAddress: ACCOUNT_C,
        verifierAddress: ACCOUNT_D,
        milestones: [{ title: "Milestone", criteria: "Complete work" }],
      }),
    );

    const { result } = renderHook(() => useCreateVaultForm(), { wrapper });
    expect(result.current.draftOffer).not.toBeNull();

    act(() => result.current.restoreDraft());

    expect(result.current.name).toBe("Saved vault");
    expect(result.current.amount).toBe("0");
    expect(result.current.errors.amount).toMatch(/positive USDC amount/i);

    act(() => result.current.submit({ preventDefault: vi.fn() } as unknown as FormEvent));

    expect(result.current.showReview).toBe(false);
    expect(result.current.errors.amount).toMatch(/positive USDC amount/i);
  });

  it("does not advance to review when required values are invalid", () => {
    const { result } = renderHook(() => useCreateVaultForm(), { wrapper });

    act(() => result.current.submit({ preventDefault: vi.fn() } as unknown as FormEvent));

    expect(result.current.errors.name).toBeTruthy();
    expect(result.current.errors.amount).toBeTruthy();
    expect(result.current.showReview).toBe(false);
  });
});
