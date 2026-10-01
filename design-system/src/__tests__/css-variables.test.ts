/**
 * Tests for generateCssVariables and generateCssVariablesString.
 */

import {
  generateCssVariables,
  generateCssVariablesString,
} from '../utils/css-variables';
import type { DesignTokens } from '../types/tokens';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const simpleTokens: DesignTokens = {
  spacing: {
    '0': {
      $type: 'dimension' as const,
      $value: '0px',
      $description: 'No spacing',
    },
    '1': {
      $type: 'dimension' as const,
      $value: '4px',
      $description: 'Tight',
    },
    '4': {
      $type: 'dimension' as const,
      $value: '16px',
    },
  },
};

const colorTokens: DesignTokens = {
  color: {
    primary: {
      light: {
        $type: 'color' as const,
        $value: '#1E40AF',
        $description: 'Primary light',
      },
      dark: {
        $type: 'color' as const,
        $value: '#3B82F6',
        $description: 'Primary dark',
      },
    },
    neutral: {
      '50': {
        light: {
          $type: 'color' as const,
          $value: '#F9FAFB',
        },
        dark: {
          $type: 'color' as const,
          $value: '#F9FAFB',
        },
      },
    },
  },
};

const tokensWithReferences: DesignTokens = {
  color: {
    surface: {
      light: {
        $type: 'color' as const,
        $value: '{color.neutral.50}',
      },
      dark: {
        $type: 'color' as const,
        $value: '#111827',
      },
    },
    ...(colorTokens.color as Record<string, unknown>),
  },
};

const typographyTokens: DesignTokens = {
  typography: {
    heading: {
      $type: 'typography' as const,
      fontFamily: { $value: 'Inter, sans-serif' },
      fontWeight: { $value: 700 },
      fontSize: { $value: '2rem' },
      lineHeight: { $value: '1.2' },
    },
  },
};

const nestedTokens: DesignTokens = {
  color: {
    chart: {
      categorical: {
        '1': {
          light: {
            $type: 'color' as const,
            $value: '#1E40AF',
          },
          dark: {
            $type: 'color' as const,
            $value: '#3B82F6',
          },
        },
        '2': {
          light: {
            $type: 'color' as const,
            $value: '#0D9488',
          },
        },
      },
      axis: {
        light: {
          $type: 'color' as const,
          $value: '#6B7280',
        },
        dark: {
          $type: 'color' as const,
          $value: '#9CA3AF',
        },
      },
    },
  },
};

const borderTokens: DesignTokens = {
  border: {
    width: {
      $type: 'dimension' as const,
      $value: '1px',
    },
    radius: {
      $type: 'dimension' as const,
      $value: '8px',
    },
  },
};

const motionTokens: DesignTokens = {
  motion: {
    fast: {
      $type: 'duration' as const,
      $value: '150ms',
    },
    slow: {
      $type: 'duration' as const,
      $value: '400ms',
    },
    ease: {
      $type: 'cubicBezier' as const,
      $value: [0.4, 0, 0.2, 1],
    },
  },
};

const zIndexTokens: DesignTokens = {
  zIndex: {
    dropdown: {
      $type: 'number' as const,
      $value: 100,
    },
    modal: {
      $type: 'number' as const,
      $value: 1000,
    },
  },
};

const shadowTokens: DesignTokens = {
  shadow: {
    sm: {
      $type: 'shadow' as const,
      $value: '0 1px 2px rgba(0,0,0,0.05)' as any,
    },
    lg: {
      $type: 'shadow' as const,
      $value: [
        { offsetX: '0', offsetY: '10px', blur: '15px', spread: '-3px', color: 'rgba(0,0,0,0.1)' },
      ] as any,
    },
  },
};

const emptyTokens: DesignTokens = {};

const tokensWithMissingValues: DesignTokens = {
  color: {
    missing: {
      light: {
        $type: 'color' as const,
        $value: '',
      },
    },
  },
  spacing: {
    undef: {
      $type: 'dimension' as const,
      $value: undefined as unknown as string,
    },
  },
};

// ===========================================================================
// Tests
// ===========================================================================

describe('generateCssVariables', () => {
  describe('spacing tokens', () => {
    it('flattens simple dimension tokens into CSS variables', () => {
      const result = generateCssVariables(simpleTokens);
      expect(result).toEqual({
        'spacing-0': '0px',
        'spacing-1': '4px',
        'spacing-4': '16px',
      });
    });

    it('includes prefix when provided', () => {
      const result = generateCssVariables(simpleTokens, 'light', { prefix: 'ds' });
      expect(result).toHaveProperty('ds-spacing-0', '0px');
      expect(result).toHaveProperty('ds-spacing-1', '4px');
    });

    it('uses custom separator', () => {
      const result = generateCssVariables(simpleTokens, 'light', { separator: '__' });
      expect(result).toHaveProperty('spacing__0', '0px');
      expect(result).toHaveProperty('spacing__4', '16px');
    });
  });

  describe('color tokens with light/dark variants', () => {
    it('returns light mode colors by default', () => {
      const result = generateCssVariables(colorTokens);
      expect(result).toEqual({
        'color-primary': '#1E40AF',
        'color-neutral-50': '#F9FAFB',
      });
    });

    it('returns dark mode colors when mode is dark', () => {
      const result = generateCssVariables(colorTokens, 'dark');
      expect(result).toEqual({
        'color-primary': '#3B82F6',
        'color-neutral-50': '#F9FAFB',
      });
    });
  });

  describe('reference resolution', () => {
    it('resolves {path.to.token} references from already-emitted variables', () => {
      const result = generateCssVariables(tokensWithReferences);
      expect(result['color-surface']).toBe('#F9FAFB');
      expect(result['color-neutral-50']).toBe('#F9FAFB');
    });

    it('leaves unresolvable references as-is', () => {
      const isolated: DesignTokens = {
        color: {
          foo: {
            light: {
              $type: 'color' as const,
              $value: '{color.missing}',
            },
          },
        },
      };
      const result = generateCssVariables(isolated);
      expect(result['color-foo']).toBe('{color.missing}');
    });
  });

  describe('typography tokens', () => {
    it('flattens typography sub-properties into CSS variables', () => {
      const result = generateCssVariables(typographyTokens);
      expect(result).toEqual({
        'typography-heading-fontFamily': 'Inter, sans-serif',
        'typography-heading-fontWeight': '700',
        'typography-heading-fontSize': '2rem',
        'typography-heading-lineHeight': '1.2',
      });
    });
  });

  describe('nested token groups', () => {
    it('flattens deeply nested groups deterministically', () => {
      const result = generateCssVariables(nestedTokens);
      expect(result).toEqual({
        'color-chart-axis': '#6B7280',
        'color-chart-categorical-1': '#1E40AF',
        'color-chart-categorical-2': '#0D9488',
      });
    });

    it('returns dark variant for nested dark mode', () => {
      const result = generateCssVariables(nestedTokens, 'dark');
      expect(result).toEqual({
        'color-chart-axis': '#9CA3AF',
        'color-chart-categorical-1': '#3B82F6',
        'color-chart-categorical-2': '#0D9488',
      });
    });
  });

  describe('border tokens', () => {
    it('emits dimension tokens', () => {
      const result = generateCssVariables(borderTokens);
      expect(result).toEqual({
        'border-width': '1px',
        'border-radius': '8px',
      });
    });
  });

  describe('motion tokens', () => {
    it('emits duration tokens as strings', () => {
      const result = generateCssVariables(motionTokens);
      expect(result['motion-fast']).toBe('150ms');
      expect(result['motion-slow']).toBe('400ms');
    });

    it('emits cubicBezier arrays as comma-separated values', () => {
      const result = generateCssVariables(motionTokens);
      expect(result['motion-ease']).toBe('0.4, 0, 0.2, 1');
    });
  });

  describe('z-index tokens', () => {
    it('emits number tokens as strings', () => {
      const result = generateCssVariables(zIndexTokens);
      expect(result).toEqual({
        'zIndex-dropdown': '100',
        'zIndex-modal': '1000',
      });
    });
  });

  describe('shadow tokens', () => {
    it('emits shadow token $value as string', () => {
      const result = generateCssVariables(shadowTokens);
      expect(result['shadow-sm']).toBe('0 1px 2px rgba(0,0,0,0.05)');
      expect(typeof result['shadow-lg']).toBe('string');
      expect(result['shadow-lg'].length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('returns empty object for empty tokens', () => {
      expect(generateCssVariables(emptyTokens)).toEqual({});
    });

    it('handles null/undefined gracefully', () => {
      expect(generateCssVariables(null as unknown as DesignTokens)).toEqual({});
      expect(generateCssVariables(undefined as unknown as DesignTokens)).toEqual({});
    });

    it('handles tokens with missing or empty values gracefully', () => {
      const result = generateCssVariables(tokensWithMissingValues);
      // Empty string values are still emitted
      expect(result['color-missing']).toBe('');
      // undefined values are skipped
      expect(result['spacing-undef']).toBeUndefined();
    });

    it('produces deterministic (sorted) output', () => {
      const keys1 = Object.keys(generateCssVariables(nestedTokens));
      const keys2 = Object.keys(generateCssVariables(nestedTokens));
      expect(keys1).toEqual(keys2);
    });
  });

  describe('mixed tokens', () => {
    it('combines multiple token categories', () => {
      const combined: DesignTokens = {
        ...borderTokens,
        ...motionTokens,
        ...zIndexTokens,
      };
      const result = generateCssVariables(combined);
      expect(result).toHaveProperty('border-width');
      expect(result).toHaveProperty('motion-fast');
      expect(result).toHaveProperty('zIndex-dropdown');
      // Verify sorting
      const keys = Object.keys(result);
      for (let i = 1; i < keys.length; i++) {
        expect(keys[i - 1].localeCompare(keys[i])).toBeLessThanOrEqual(0);
      }
    });
  });
});

// ===========================================================================
// generateCssVariablesString
// ===========================================================================

describe('generateCssVariablesString', () => {
  it('returns a :root CSS block', () => {
    const css = generateCssVariablesString(simpleTokens);
    expect(css).toContain(':root {');
    expect(css).toContain('--spacing-0: 0px;');
    expect(css).toContain('--spacing-4: 16px;');
    expect(css).toMatch(/^:root \{[^}]+\}$/);
  });

  it('includes the prefix in variable names', () => {
    const css = generateCssVariablesString(simpleTokens, 'light', { prefix: 'ds' });
    expect(css).toContain('--ds-spacing-0: 0px;');
  });

  it('returns dark mode values when mode is dark', () => {
    const css = generateCssVariablesString(colorTokens, 'dark');
    expect(css).toContain('--color-primary: #3B82F6;');
    expect(css).not.toContain('--color-primary: #1E40AF;');
  });

  it('handles empty tokens gracefully', () => {
    expect(generateCssVariablesString(emptyTokens)).toBe(':root {\n\n}');
  });
});