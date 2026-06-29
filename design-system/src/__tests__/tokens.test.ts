import { loadTokens } from '../utils/token-loader';

describe('spacing token container ramp', () => {
  it('loads container size tokens from spacing.json', () => {
    const tokens = loadTokens('spacing.json');

    expect(tokens).toHaveProperty('spacing.container');
    expect(tokens.spacing?.container).toMatchObject({
      narrow: { $value: '640px' },
      standard: { $value: '960px' },
      wide: { $value: '1100px' },
      max: { $value: '1280px' },
    });
  });
});

describe('z-index token layering scale', () => {
  it('loads z-index tokens from z-index.json', () => {
    const tokens = loadTokens('z-index.json');

    expect(tokens).toHaveProperty('zIndex');
    expect(tokens.zIndex).toMatchObject({
      base: { $value: 0 },
      header: { $value: 100 },
      drawer: { $value: 200 },
      modal: { $value: 300 },
      toast: { $value: 400 },
    });
  });
});

describe('focusRing token group', () => {
  it('loads focusRing tokens from borders.json', () => {
    const tokens = loadTokens('borders.json');
    const border = tokens.border as Record<string, unknown>;

    expect(border).toHaveProperty('focusRing');
    expect(border.focusRing).toMatchObject({
      width: { $type: 'dimension', $value: '2px' },
      offset: { $type: 'dimension', $value: '2px' },
      color: {
        light: { $type: 'color', $value: '#1E40AF' },
        dark: { $type: 'color', $value: '#3B82F6' },
      },
    });
  });

  it('focusRing width and offset are dimension tokens', () => {
    const tokens = loadTokens('borders.json');
    const focusRing = (tokens.border as unknown as Record<string, Record<string, { $type: string; $value: string }>>).focusRing;

    expect(focusRing.width.$type).toBe('dimension');
    expect(focusRing.offset.$type).toBe('dimension');
  });

  it('focusRing colors are valid hex color tokens', () => {
    const tokens = loadTokens('borders.json');
    const focusRing = (tokens.border as unknown as Record<string, Record<string, Record<string, { $value: string }>>>).focusRing;

    expect(focusRing.color.light.$value).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(focusRing.color.dark.$value).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});
