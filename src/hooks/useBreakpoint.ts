import { useEffect, useState } from "react";

export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

export const BREAKPOINT_MIN_WIDTHS: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

/**
 * Returns the smallest active breakpoint based on window.innerWidth.
 * Returns "xs" (< 640px) for sub-sm viewports, then "sm" / "md" / "lg" / "xl" / "2xl".
 * Returns "xs" on the server and during the first paint to avoid hydration
 * mismatches; the effect upgrades it after mount.
 */
export function useBreakpoint(): Breakpoint | "xs" {
  const [bp, setBp] = useState<Breakpoint | "xs">("xs");

  useEffect(() => {
    const compute = () => {
      if (typeof window === "undefined") return "xs" as const;
      const w = window.innerWidth;
      // Order from largest to smallest
      if (w >= BREAKPOINT_MIN_WIDTHS["2xl"]) return "2xl" as const;
      if (w >= BREAKPOINT_MIN_WIDTHS.xl) return "xl" as const;
      if (w >= BREAKPOINT_MIN_WIDTHS.lg) return "lg" as const;
      if (w >= BREAKPOINT_MIN_WIDTHS.md) return "md" as const;
      if (w >= BREAKPOINT_MIN_WIDTHS.sm) return "sm" as const;
      return "xs" as const;
    };
    setBp(compute());
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return bp;
}

/** Convenience: returns true when the viewport is at or above the given breakpoint. */
export function useBreakpointAtLeast(target: Breakpoint): boolean {
  const current = useBreakpoint();
  if (current === "xs") return false;
  return BREAKPOINT_MIN_WIDTHS[current] >= BREAKPOINT_MIN_WIDTHS[target];
}
