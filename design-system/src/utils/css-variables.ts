/**
 * generateCssVariables — converts a DesignTokens tree into CSS custom property
 * declarations.  Pure function, no DOM access.
 *
 * - Flattens nested token groups into `--group-subgroup-name` keys.
 * - For color tokens with `light` / `dark` sub-keys, picks the matching mode.
 * - Resolves `{path.to.token}` references using the already-emitted map.
 * - Returns a deterministic (sorted) Record<string, string>.
 */

import type { DesignTokens } from '../types/tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CssMode = 'light' | 'dark';

export interface GenerateCssVariablesOptions {
  /** Prefix for every variable name (default: empty).  e.g. "ds" → --ds-… */
  prefix?: string;
  /** Separator between nesting levels (default: "-"). */
  separator?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REFERENCE_RE = /\{([^}]+)\}/g;

/**
 * Replace `{path.to.token}` references with already-resolved values.
 * Unresolved references are left as-is.
 */
function resolveReferences(
  value: string,
  resolved: Record<string, string>,
): string {
  return value.replace(REFERENCE_RE, (_, path: string) => {
    const varName = path.replace(/\./g, '-');
    return resolved[varName] ?? `{${path}}`;
  });
}

/**
 * Build a CSS variable name from a path of keys.
 */
function buildVarName(
  segments: string[],
  prefix: string,
  separator: string,
): string {
  const filtered = segments.filter(
    (s) => s !== '$type' && s !== '$description' && s !== '$schema',
  );
  const joined = filtered.join(separator);
  return prefix ? `${prefix}${separator}${joined}` : joined;
}

/**
 * Check if an object looks like a color-variant group, i.e. it contains a
 * `light` key (and maybe `dark`) whose value is a leaf token (has `$type`).
 */
function isVariantGroup(obj: Record<string, unknown>): boolean {
  if (obj.$type) return false;
  const lightVal = obj.light;
  return (
    lightVal !== undefined &&
    typeof lightVal === 'object' &&
    lightVal !== null &&
    typeof (lightVal as Record<string, unknown>).$type === 'string'
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Walk the token tree and collect CSS variable declarations.
 *
 * @param tokens   The DesignTokens object (or a sub-tree).
 * @param mode     'light' or 'dark' — used to pick color variants.
 * @param opts     Optional prefix / separator.
 * @returns        A flat Record<string, string> of `{name}: value` pairs.
 */
export function generateCssVariables(
  tokens: DesignTokens | Record<string, unknown>,
  mode: CssMode = 'light',
  opts: GenerateCssVariablesOptions = {},
): Record<string, string> {
  const { prefix = '', separator = '-' } = opts;
  const result: Record<string, string> = {};

  // ── First pass: collect all raw values ──────────────────────────────────

  function walk(node: unknown, path: string[]): void {
    if (node === null || node === undefined) return;
    if (typeof node !== 'object') return;

    const obj = node as Record<string, unknown>;

    // Leaf token (has $type)
    if (typeof obj.$type === 'string') {
      const type = obj.$type;

      // Color tokens
      if (type === 'color') {
        const rawValue = obj.$value;
        if (rawValue !== undefined) {
          const varName = buildVarName(path, prefix, separator);
          result[varName] = String(rawValue);
        }
        return;
      }

      // Typography — sub-properties each have $value
      if (type === 'typography') {
        for (const [key, val] of Object.entries(obj)) {
          if (key.startsWith('$')) continue;
          const sub = val as Record<string, unknown> | undefined;
          if (sub && typeof sub.$value !== 'undefined') {
            const varName = buildVarName([...path, key], prefix, separator);
            result[varName] = String(sub.$value);
          }
        }
        return;
      }

      // Shadow
      if (type === 'shadow') {
        const rawValue = obj.$value;
        if (rawValue !== undefined) {
          const varName = buildVarName(path, prefix, separator);
          result[varName] =
            typeof rawValue === 'string'
              ? rawValue
              : JSON.stringify(rawValue);
        }
        return;
      }

      // Motion (duration → string, cubicBezier → comma-separated)
      if (type === 'duration' || type === 'cubicBezier') {
        const rawValue = obj.$value;
        if (rawValue !== undefined) {
          const varName = buildVarName(path, prefix, separator);
          result[varName] = Array.isArray(rawValue)
            ? rawValue.join(', ')
            : String(rawValue);
        }
        return;
      }

      // number, dimension, or fallback
      const rawValue = obj.$value;
      if (rawValue !== undefined) {
        const varName = buildVarName(path, prefix, separator);
        result[varName] = String(rawValue);
      }
      return;
    }

    // Variant group (has light/dark keys whose values are leaf tokens)
    if (isVariantGroup(obj)) {
      // Try requested mode first, fall back to light if missing
      const variant = (obj[mode] ?? obj['light']) as Record<string, unknown> | undefined;
      if (variant) {
        walk(variant, path);
      }
      return;
    }

    // Recurse into nested groups
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$') || key === '$schema') continue;
      walk(value, [...path, key]);
    }
  }

  walk(tokens as Record<string, unknown>, []);

  // ── Second pass: resolve references ─────────────────────────────────────
  for (const key of Object.keys(result)) {
    result[key] = resolveReferences(result[key], result);
  }

  // ── Sort deterministically ──────────────────────────────────────────────
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(result).sort()) {
    sorted[key] = result[key];
  }

  return sorted;
}

/**
 * Convenience wrapper: returns a CSS string suitable for embedding in a
 * `<style>` tag or CSS file.
 *
 * @example
 *   generateCssVariablesString(tokens, 'dark', { prefix: 'ds' })
 *   // → ":root {\n  --ds-color-primary: #3B82F6;\n}"
 */
export function generateCssVariablesString(
  tokens: DesignTokens | Record<string, unknown>,
  mode: CssMode = 'light',
  opts: GenerateCssVariablesOptions = {},
): string {
  const vars = generateCssVariables(tokens, mode, opts);
  const lines = Object.entries(vars).map(
    ([name, value]) => `  --${name}: ${value};`,
  );
  return `:root {\n${lines.join('\n')}\n}`;
}