import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastViewport } from "../ToastViewport";
import { useToastStore, __resetToastStoreForTests } from "../../Zustand/toastStore";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";

describe("toastStore", () => {
  beforeEach(() => {
    __resetToastStoreForTests();
  });
  afterEach(() => {
    __resetToastStoreForTests();
    vi.useRealTimers();
  });

  it("pushes a toast with a generated id and default info variant", () => {
    const id = useToastStore.getState().push({ message: "hello" });
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].variant).toBe("info");
    expect(toasts[0].message).toBe("hello");
  });

  it("respects an explicit variant", () => {
    useToastStore.getState().push({ message: "boom", variant: "error" });
    const toast = useToastStore.getState().toasts[0];
    expect(toast.variant).toBe("error");
  });

  it("dismisses a specific toast by id", () => {
    const a = useToastStore.getState().push({ message: "a" });
    useToastStore.getState().push({ message: "b" });
    useToastStore.getState().dismiss(a);
    const remaining = useToastStore.getState().toasts;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].message).toBe("b");
  });

  it("dismissing an unknown id is a no-op", () => {
    useToastStore.getState().push({ message: "a" });
    useToastStore.getState().dismiss("does-not-exist");
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it("auto-dismisses after the supplied duration", () => {
    vi.useFakeTimers();
    useToastStore.getState().push({ message: "short", durationMs: 1000 });
    expect(useToastStore.getState().toasts).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("durationMs: 0 disables auto-dismiss entirely", () => {
    vi.useFakeTimers();
    useToastStore.getState().push({ message: "sticky", durationMs: 0 });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it("negative durationMs also disables auto-dismiss", () => {
    vi.useFakeTimers();
    useToastStore.getState().push({ message: "sticky", durationMs: -1 });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it("clear() removes every toast and cancels pending timers", () => {
    vi.useFakeTimers();
    useToastStore.getState().push({ message: "a", durationMs: 1000 });
    useToastStore.getState().push({ message: "b", durationMs: 2000 });
    useToastStore.getState().push({ message: "c", durationMs: 3000 });
    useToastStore.getState().clear();
    expect(useToastStore.getState().toasts).toHaveLength(0);
    // Advancing past every previously-scheduled timer must not re-add
    // anything (i.e. clear() actually cancelled the timers).
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("two pushes with the same message get distinct ids (no id collision)", () => {
    const a = useToastStore.getState().push({ message: "dup" });
    const b = useToastStore.getState().push({ message: "dup" });
    expect(a).not.toBe(b);
    expect(useToastStore.getState().toasts).toHaveLength(2);
  });
});

describe("ToastViewport", () => {
  beforeEach(() => {
    __resetToastStoreForTests();
  });
  afterEach(() => {
    __resetToastStoreForTests();
  });

  it("renders nothing when the store is empty", () => {
    render(<ToastViewport />);
    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
  });

  it("renders every toast in the store with role=status and aria-live=polite", () => {
    useToastStore.getState().push({ message: "first" });
    useToastStore.getState().push({ message: "second", variant: "success" });
    render(<ToastViewport />);
    const items = screen.getAllByTestId("toast");
    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item).toHaveAttribute("role", "status");
      expect(item).toHaveAttribute("aria-live", "polite");
    }
    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
  });

  it("clicking the dismiss button removes the toast from the store and DOM", async () => {
    const user = userEvent.setup();
    useToastStore.getState().push({ message: "dismiss me" });
    render(<ToastViewport />);
    expect(screen.getByTestId("toast")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /dismiss notification/i }));
    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("applies a variant class per toast", () => {
    useToastStore.getState().push({ message: "ok", variant: "success" });
    useToastStore.getState().push({ message: "bad", variant: "error" });
    render(<ToastViewport />);
    const items = screen.getAllByTestId("toast");
    const classes = items.map((el) => el.className);
    expect(classes.some((c) => c.includes("toast--success"))).toBe(true);
    expect(classes.some((c) => c.includes("toast--error"))).toBe(true);
  });
});
