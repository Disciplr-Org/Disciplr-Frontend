import borders from '../../tokens/borders.json';
import motion from '../../tokens/motion.json';
import shadows from '../../tokens/shadows.json';
import typography from '../../tokens/typography.json';
import {
  hasValidTokenPrefix,
  isKebabCase,
  isValidColorString,
} from '../utils/validators';

type TokenObject = Record<string, unknown>;

const isObject = (value: unknown): value is TokenObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const expectFlattenedTokenName = (name: string) => {
  expect(isKebabCase(name)).toBe(true);
  expect(hasValidTokenPrefix(name)).toBe(true);
};

const expectTokenDescription = (token: TokenObject) => {
  expect(typeof token.$description).toBe('string');
  expect((token.$description as string).length).toBeGreaterThan(0);
};

const expectDimensionToken = (name: string, token: unknown) => {
  expectFlattenedTokenName(name);
  expect(isObject(token)).toBe(true);
  const dimension = token as TokenObject;
  expect(dimension.$type).toBe('dimension');
  expect(dimension.$value).toMatch(/^-?\d+(?:\.\d+)?px$/);
  expectTokenDescription(dimension);
};

const expectWrappedValue = (
  token: TokenObject,
  field: string,
  predicate: (value: unknown) => boolean,
) => {
  expect(isObject(token[field])).toBe(true);
  expect(predicate((token[field] as TokenObject).$value)).toBe(true);
};

describe('border token file schema', () => {
  it('validates radius and width dimension tokens', () => {
    for (const [key, token] of Object.entries(borders.border.radius)) {
      expectDimensionToken(`border-radius-${key}`, token);
    }

    for (const [key, token] of Object.entries(borders.border.width)) {
      expectDimensionToken(`border-width-${key}`, token);
    }
  });

  it('validates light and dark border color tokens', () => {
    for (const [mode, tokens] of Object.entries(borders.border.color)) {
      expect(['light', 'dark']).toContain(mode);

      for (const [key, token] of Object.entries(tokens)) {
        expectFlattenedTokenName(`border-color-${mode}-${key}`);
        expect(isObject(token)).toBe(true);
        expect(token.$type).toBe('color');
        expect(typeof token.$value).toBe('string');
        expect(isValidColorString(token.$value as string)).toBe(true);
        expectTokenDescription(token);
      }
    }
  });
});

describe('shadow token file schema', () => {
  const expectShadowLayer = (layer: unknown) => {
    expect(isObject(layer)).toBe(true);
    const shadowLayer = layer as TokenObject;

    for (const key of ['offsetX', 'offsetY', 'blur', 'spread']) {
      expect(shadowLayer[key]).toMatch(/^-?\d+(?:\.\d+)?px$/);
    }

    expect(shadowLayer.color).toMatch(/^rgba?\(.+\)$/);
  };

  it('validates light and dark shadow tokens', () => {
    for (const [level, modes] of Object.entries(shadows.shadow)) {
      expectFlattenedTokenName(`shadow-${level}`);
      expect(isObject(modes)).toBe(true);
      expect(Object.keys(modes).sort()).toEqual(['dark', 'light']);

      for (const token of Object.values(modes)) {
        expect(isObject(token)).toBe(true);
        expect(token.$type).toBe('shadow');
        expectTokenDescription(token);

        if (token.$value === 'none') {
          continue;
        }

        expect(Array.isArray(token.$value)).toBe(true);
        expect((token.$value as unknown[]).length).toBeGreaterThan(0);
        for (const layer of token.$value as unknown[]) {
          expectShadowLayer(layer);
        }
      }
    }
  });
});

describe('motion token file schema', () => {
  it('validates duration tokens', () => {
    for (const [key, token] of Object.entries(motion.motion.duration)) {
      expectFlattenedTokenName(`motion-duration-${key}`);
      expect(token.$type).toBe('duration');
      expect(token.$value).toMatch(/^\d+(?:\.\d+)?m?s$/);
      expect(token.cssVar).toBe(`--duration-${key}`);
      expectTokenDescription(token);
    }
  });

  it('validates cubic-bezier easing tokens', () => {
    for (const [key, token] of Object.entries(motion.motion.easing)) {
      expectFlattenedTokenName(`motion-easing-${key}`);
      expect(token.$type).toBe('cubicBezier');
      expect(Array.isArray(token.$value)).toBe(true);
      expect(token.$value).toHaveLength(4);

      const [x1, y1, x2, y2] = token.$value as number[];
      for (const value of [x1, y1, x2, y2]) {
        expect(Number.isFinite(value)).toBe(true);
      }
      expect(x1).toBeGreaterThanOrEqual(0);
      expect(x1).toBeLessThanOrEqual(1);
      expect(x2).toBeGreaterThanOrEqual(0);
      expect(x2).toBeLessThanOrEqual(1);
      expect(token.cssVar).toMatch(/^--[a-z0-9-]+$/);
      expect(token.cssValue).toBe(`cubic-bezier(${token.$value.join(', ')})`);
      expectTokenDescription(token);
    }
  });

  it('validates reduced-motion preference token', () => {
    expectFlattenedTokenName('motion-reduced-motion');
    expect(motion.motion.reducedMotion.$type).toBe('boolean');
    expect(typeof motion.motion.reducedMotion.$value).toBe('boolean');
    expectTokenDescription(motion.motion.reducedMotion);
  });
});

describe('typography token file schema', () => {
  const expectTypographyToken = (name: string, token: TokenObject) => {
    expectFlattenedTokenName(name);
    expect(token.$type).toBe('typography');
    expectWrappedValue(token, 'fontSize', (value) =>
      typeof value === 'string' && /^\d+(?:\.\d+)?px$/.test(value),
    );
    expectWrappedValue(token, 'lineHeight', (value) =>
      typeof value === 'string' && /^\d+(?:\.\d+)?px$/.test(value),
    );
    expectWrappedValue(token, 'fontWeight', (value) =>
      typeof value === 'number' && value >= 100 && value <= 900,
    );
    expectWrappedValue(token, 'letterSpacing', (value) =>
      typeof value === 'string' && /^-?\d+(?:\.\d+)?(?:em)?$/.test(value),
    );
    expectTokenDescription(token);
  };

  it('validates font-family and font-weight leaf tokens', () => {
    for (const [key, token] of Object.entries(typography.typography.fontFamily)) {
      expectFlattenedTokenName(`typography-font-family-${key}`);
      expect(token.$type).toBe('fontFamily');
      expect(typeof token.$value).toBe('string');
      expectTokenDescription(token);
    }

    for (const [key, token] of Object.entries(typography.typography.fontWeight)) {
      expectFlattenedTokenName(`typography-font-weight-${key}`);
      expect(token.$type).toBe('fontWeight');
      expect(typeof token.$value).toBe('number');
      expect(token.$value).toBeGreaterThanOrEqual(100);
      expect(token.$value).toBeLessThanOrEqual(900);
      expectTokenDescription(token);
    }
  });

  it('validates typography composite tokens in every nested group', () => {
    const groups = Object.entries(typography.typography).filter(
      ([key]) => key !== 'fontFamily' && key !== 'fontWeight',
    );

    for (const [groupName, group] of groups) {
      expect(isObject(group)).toBe(true);

      for (const [key, token] of Object.entries(group as TokenObject)) {
        if (!isObject(token)) {
          throw new Error(`Expected typography.${groupName}.${key} to be an object`);
        }
        expectTypographyToken(`typography-${groupName}-${key}`, token);
      }
    }
  });
});
