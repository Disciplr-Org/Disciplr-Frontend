/**
 * Typography utility for mapping design token roles to CSS classes
 * 
 * @example
 * const displayClass = getTypographyClass('display');
 * // Returns 'text-display' which handles responsive sizing
 */

export type TypographyRole = 'display' | 'title' | 'body' | 'caption' | 'mono';

/**
 * Maps a typography role to its corresponding CSS class
 * The class automatically handles responsive scaling via CSS variables
 * 
 * @param role - The typography role: display, title, body, caption, or mono
 * @returns CSS class name for the role
 */
export function getTypographyClass(role: TypographyRole): string {
  const classMap: Record<TypographyRole, string> = {
    display: 'text-display',
    title: 'text-title',
    body: 'text-body',
    caption: 'text-caption',
    mono: 'text-mono',
  };

  return classMap[role];
}

/**
 * Combines typography class with optional additional classes
 * 
 * @param role - The typography role
 * @param additionalClasses - Optional additional CSS classes to combine
 * @returns Combined class string
 */
export function classifyTypography(
  role: TypographyRole,
  additionalClasses?: string
): string {
  const baseClass = getTypographyClass(role);
  return additionalClasses ? `${baseClass} ${additionalClasses}` : baseClass;
}
