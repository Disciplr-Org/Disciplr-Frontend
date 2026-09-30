/**
 * Typography utility for mapping design token roles to CSS classes
 * 
 * @example
 * const displayClass = getTypographyClass('display');
 * // Returns 'text-display' which handles responsive sizing
 */

export type TypographyRole = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'mono';

const TYPOGRAPHY_CLASSES: Readonly<Record<TypographyRole, string>> = Object.freeze({
  display: 'text-display',
  title: 'text-title',
  subtitle: 'text-subtitle',
  body: 'text-body',
  caption: 'text-caption',
  mono: 'text-mono',
});

/**
 * Maps a typography role to its corresponding CSS class
 * The class automatically handles responsive scaling via CSS variables
 * 
 * @param role - The typography role: display, title, body, caption, or mono
 * @returns CSS class name for the role
 */
export function getTypographyClass(role: TypographyRole): string {
  // Resolve only declared roles so values that bypass TypeScript cannot access
  // inherited object properties or silently produce an undefined CSS class.
  if (typeof role !== 'string' || !Object.hasOwn(TYPOGRAPHY_CLASSES, role)) {
    throw new TypeError('Unknown typography role');
  }

  return TYPOGRAPHY_CLASSES[role];
}

