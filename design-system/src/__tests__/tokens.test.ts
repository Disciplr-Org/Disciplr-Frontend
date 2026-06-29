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
