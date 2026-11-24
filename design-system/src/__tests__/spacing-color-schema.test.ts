import { loadTokens } from '../utils/token-loader';
import { isValidColorToken } from '../utils/validators';

// ── helpers ──────────────────────────────────────────────────────────────────

function isDimensionToken(token: unknown): boolean {
  if (!token || typeof token !== 'object') return false;
  const t = token as Record<string, unknown>;
  return t.$type === 'dimension' && typeof t.$value === 'string';
}

/** Recursively collect every leaf that carries $type/$value. */
function collectLeaves(node: unknown): Record<string, unknown>[] {
  if (!node || typeof node !== 'object') return [];
  const obj = node as Record<string, unknown>;
  if ('$type' in obj || '$value' in obj) return [obj];
  return Object.values(obj).flatMap(collectLeaves);
}

/** Parse "Npx" → N. Returns NaN for anything that doesn't match. */
function pxValue(value: string): number {
  const match = /^(\d+(?:\.\d+)?)px$/.exec(value);
  return match ? parseFloat(match[1]) : NaN;
}

// ── spacing.json ─────────────────────────────────────────────────────────────

describe('spacing.json schema', () => {
  let tokens: ReturnType<typeof loadTokens>;

  beforeAll(() => {
    tokens = loadTokens('spacing.json');
  });

  it('has only expected top-level keys', () => {
    const allowed = new Set(['spacing', 'breakpoint', 'grid', '$schema']);
    Object.keys(tokens).forEach((key) => {
      expect(allowed).toContain(key);
    });
  });

  it('every dimension leaf has $type "dimension" and a string $value', () => {
    const leaves = collectLeaves(tokens).filter((t) => t.$type === 'dimension');
    expect(leaves.length).toBeGreaterThan(0);
    leaves.forEach((leaf) => {
      expect(isDimensionToken(leaf)).toBe(true);
    });
  });

  it('spacing scale is monotonically increasing', () => {
    const scale = tokens.spacing as Record<string, unknown>;
    // Numeric keys only (skip "base" and "container")
    const numericKeys = Object.keys(scale)
      .filter((k) => /^\d+$/.test(k))
      .sort((a, b) => Number(a) - Number(b));

    const values = numericKeys.map((k) => {
      const token = scale[k] as Record<string, unknown>;
      return pxValue(token.$value as string);
    });

    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it('container sub-tokens are ordered narrow → standard → wide → max', () => {
    const container = (tokens.spacing as Record<string, unknown>).container as Record<
      string,
      Record<string, unknown>
    >;
    const order = ['narrow', 'standard', 'wide', 'max'];
    const values = order.map((k) => pxValue(container[k].$value as string));

    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

// ── colors.json ───────────────────────────────────────────────────────────────

describe('colors.json schema', () => {
  let tokens: ReturnType<typeof loadTokens>;
  let colorRoot: Record<string, unknown>;

  beforeAll(() => {
    tokens = loadTokens('colors.json');
    colorRoot = tokens.color as Record<string, unknown>;
  });

  it('has only expected top-level keys', () => {
    const allowed = new Set(['color', '$schema']);
    Object.keys(tokens).forEach((key) => {
      expect(allowed).toContain(key);
    });
  });

  it('every color leaf passes isValidColorToken', () => {
    const leaves = collectLeaves(colorRoot).filter((t) => t.$type === 'color');
    expect(leaves.length).toBeGreaterThan(0);
    leaves.forEach((leaf) => {
      expect(isValidColorToken(leaf)).toBe(true);
    });
  });

  it('semantic groups each have paired light and dark variants', () => {
    const semanticGroups = ['primary', 'secondary', 'success', 'error', 'warning', 'info'];
    semanticGroups.forEach((group) => {
      const g = colorRoot[group] as Record<string, unknown>;
      expect(isValidColorToken(g.light)).toBe(true);
      expect(isValidColorToken(g.dark)).toBe(true);
    });
  });

  it('neutral scale has both light and dark variants for each step', () => {
    const neutral = colorRoot.neutral as Record<string, Record<string, unknown>>;
    const steps = Object.keys(neutral);
    expect(steps.length).toBeGreaterThan(0);
    steps.forEach((step) => {
      expect(isValidColorToken(neutral[step].light)).toBe(true);
      expect(isValidColorToken(neutral[step].dark)).toBe(true);
    });
  });
});
