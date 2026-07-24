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

describe('opacity token scale', () => {
  it('loads opacity tokens from opacity.json', () => {
    const tokens = loadTokens('opacity.json');

    expect(tokens).toHaveProperty('opacity');
    expect(tokens.opacity).toMatchObject({
      disabled: { $value: 0.5 },
      backdrop: { $value: 0.5 },
      hover: { $value: 0.08 },
      muted: { $value: 0.72 },
    });
  });
});