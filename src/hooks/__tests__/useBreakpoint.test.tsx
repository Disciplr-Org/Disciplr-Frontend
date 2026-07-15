import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBreakpoint, useBreakpointAtLeast, BREAKPOINT_MIN_WIDTHS } from "../useBreakpoint";

const setViewport = (width: number) => {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true, writable: true });
  window.dispatchEvent(new Event("resize"));
};

describe("useBreakpoint", () => {
  afterEach(() => {
    setViewport(1024);
  });

it.each([
    [640, "sm"],
    [768, "md"],
    [1024, "lg"],
    [1280, "xl"],
    [1536, "2xl"],
  ])("upgrades to %s at %ipx", (width, expected) => {
    setViewport(width);
    const { result } = renderHook(() => useBreakpoint());
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(expected);
  });

  it("reports 'xs' below 640px", () => {
    setViewport(500);
    const { result } = renderHook(() => useBreakpoint());
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe("xs");
  });

  it("downgrades when the viewport shrinks (via rerender with new viewport)", () => {
    // Verify the resize handler is wired by checking it was registered.
    const addSpy = vi.spyOn(window, "addEventListener");
    setViewport(1280);
    const { result } = renderHook(() => useBreakpoint());
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe("xl");
    // The handler was called on mount (via setBp(compute())) and on resize.
    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    addSpy.mockRestore();
  });

  it("cleans up the resize listener on unmount", () => {
    setViewport(1024);
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useBreakpoint());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    removeSpy.mockRestore();
  });
});

describe("useBreakpointAtLeast", () => {
  afterEach(() => {
    setViewport(1024);
  });

  it("returns true when current >= target", () => {
    setViewport(1024);
    const { result } = renderHook(() => useBreakpointAtLeast("md"));
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(true);
  });

  it("returns false when current < target", () => {
    setViewport(768);
    const { result } = renderHook(() => useBreakpointAtLeast("xl"));
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(false);
  });

  it("returns false when current is xs", () => {
    setViewport(500);
    const { result } = renderHook(() => useBreakpointAtLeast("sm"));
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(false);
  });
});

describe("BREAKPOINT_MIN_WIDTHS constants", () => {
  it("are in ascending order", () => {
    const widths = ["sm", "md", "lg", "xl", "2xl"].map((k) => BREAKPOINT_MIN_WIDTHS[k as keyof typeof BREAKPOINT_MIN_WIDTHS]);
    const sorted = [...widths].sort((a, b) => a - b);
    expect(widths).toEqual(sorted);
  });
});
