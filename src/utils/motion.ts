/**
 * Motion constants — sourced from design-system/tokens/motion.json
 * Use these in framer-motion `transition` props so JS animations
 * stay in sync with CSS custom properties.
 */

export const duration = {
  micro:    0.1,
  fast:     0.15,
  normal:   0.2,
  moderate: 0.3,
  slow:     0.4,
  slower:   0.5,
} as const;

export const ease = {
  inOut:  [0.4, 0, 0.2, 1],
  out:    [0, 0, 0.2, 1],
  in:     [0.4, 0, 1, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  smooth: [0.25, 0.1, 0.25, 1],
} as const;

/** Standard transition for dropdowns / tooltips entering */
export const transitionEnter = {
  duration: duration.moderate,
  ease: ease.out,
} as const;

/** Standard transition for dropdowns / tooltips exiting */
export const transitionExit = {
  duration: duration.normal,
  ease: ease.in,
} as const;

/** Page-level fade transition */
export const transitionPage = {
  duration: duration.moderate,
  ease: ease.out,
} as const;
