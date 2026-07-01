import { loadTokens } from '../utils/token-loader';

// Documented stacking order: base < header < drawer < modal < toast.
const LAYER_ORDER = ['base', 'header', 'drawer', 'modal', 'toast'] as const;

interface NumberToken {
  $type: string;
  $value: unknown;
  $description?: string;
}

function getLayers(): Record<string, NumberToken> {
  const tokens = loadTokens('z-index.json');
  const zIndex = tokens.zIndex as Record<string, NumberToken> | undefined;
  expect(zIndex).toBeDefined();
  return zIndex as Record<string, NumberToken>;
}

describe('z-index.json schema', () => {
  let layers: Record<string, NumberToken>;

  beforeAll(() => {
    layers = getLayers();
  });

  it('defines exactly the documented layers', () => {
    expect(Object.keys(layers).sort()).toEqual([...LAYER_ORDER].sort());
  });

  it('every layer is a DTCG number token with a numeric $value', () => {
    LAYER_ORDER.forEach((name) => {
      const layer = layers[name];
      expect(layer.$type).toBe('number');
      expect(typeof layer.$value).toBe('number');
      expect(Number.isFinite(layer.$value as number)).toBe(true);
    });
  });

  it('values are strictly increasing in the documented order', () => {
    const values = LAYER_ORDER.map((name) => layers[name].$value as number);
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it('no two layers share a value (uniqueness)', () => {
    const values = LAYER_ORDER.map((name) => layers[name].$value as number);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('z-index schema assertions catch malformed tokens', () => {
  // Guard helpers mirroring the assertions above, exercised against fixtures
  // so a type mismatch or collision is provably detected.
  function isNumberToken(token: NumberToken): boolean {
    return token.$type === 'number' && typeof token.$value === 'number';
  }

  function isStrictlyIncreasing(values: number[]): boolean {
    return values.every((v, i) => i === 0 || v > values[i - 1]);
  }

  it('flags a $type mismatch', () => {
    expect(isNumberToken({ $type: 'dimension', $value: 100 })).toBe(false);
    expect(isNumberToken({ $type: 'number', $value: '100' })).toBe(false);
    expect(isNumberToken({ $type: 'number', $value: 100 })).toBe(true);
  });

  it('flags out-of-order or duplicate values', () => {
    expect(isStrictlyIncreasing([0, 100, 200, 300, 400])).toBe(true);
    expect(isStrictlyIncreasing([0, 100, 100, 300])).toBe(false); // duplicate
    expect(isStrictlyIncreasing([0, 300, 200])).toBe(false); // out of order
  });
});
