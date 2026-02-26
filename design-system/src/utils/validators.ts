/**
 * Token validation utilities
 */

export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

export function isValidRgbColor(color: string): boolean {
  return /^rgb\(\d+,\s*\d+,\s*\d+\)$/.test(color);
}

export function isValidHslColor(color: string): boolean {
  return /^hsl\(\d+,\s*\d+%,\s*\d+%\)$/.test(color);
}

export function isKebabCase(str: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(str);
}

export function hasValidTokenPrefix(tokenName: string): boolean {
  const validPrefixes = ['color', 'spacing', 'typography', 'shadow', 'radius', 'border', 'motion'];
  return validPrefixes.some(prefix => tokenName.startsWith(prefix + '-'));
}
