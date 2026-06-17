import {
  hasValidTokenPrefix,
  isKebabCase,
  isValidChartTokens,
  isValidColorString,
  isValidColorToken,
  isValidHexColor,
  isValidHslColor,
  isValidRgbColor,
} from '../utils/validators';

const colorToken = ($value = '#112233') => ({
  $type: 'color',
  $value,
});

const tokenGroup = ($value = '#112233') => ({
  light: colorToken($value),
  dark: colorToken('#445566'),
});

const ramp = (steps = 5) =>
  Object.fromEntries(
    Array.from({ length: steps }, (_, index) => [`step-${index + 1}`, tokenGroup()]),
  );

const validChartTokens = () => ({
  axis: tokenGroup(),
  grid: tokenGroup(),
  tooltipBg: tokenGroup(),
  tooltipBorder: tokenGroup(),
  tooltipText: tokenGroup(),
  tooltipLabel: tokenGroup(),
  categorical: ramp(),
  sequential: ramp(),
});

describe('color format validators', () => {
  test('validates six-character hex colors', () => {
    expect(isValidHexColor('#112233')).toBe(true);
    expect(isValidHexColor('#AABBCC')).toBe(true);
    expect(isValidHexColor('#abc')).toBe(false);
    expect(isValidHexColor('112233')).toBe(false);
    expect(isValidHexColor('#11223g')).toBe(false);
  });

  test('validates rgb color strings with optional spaces', () => {
    expect(isValidRgbColor('rgb(1,2,3)')).toBe(true);
    expect(isValidRgbColor('rgb(255, 255, 255)')).toBe(true);
    expect(isValidRgbColor('rgba(1, 2, 3, 0.5)')).toBe(false);
    expect(isValidRgbColor('rgb(a, b, c)')).toBe(false);
  });

  test('validates hsl color strings with percentage saturation and lightness', () => {
    expect(isValidHslColor('hsl(210,50%,40%)')).toBe(true);
    expect(isValidHslColor('hsl(210, 50%, 40%)')).toBe(true);
    expect(isValidHslColor('hsla(210, 50%, 40%, 0.5)')).toBe(false);
    expect(isValidHslColor('hsl(210, 50, 40)')).toBe(false);
  });

  test('accepts any supported color string format', () => {
    expect(isValidColorString('#112233')).toBe(true);
    expect(isValidColorString('rgb(1, 2, 3)')).toBe(true);
    expect(isValidColorString('hsl(210, 50%, 40%)')).toBe(true);
    expect(isValidColorString('var(--color-brand)')).toBe(false);
  });
});

describe('token naming validators', () => {
  test('validates kebab-case names', () => {
    expect(isKebabCase('color-brand-primary')).toBe(true);
    expect(isKebabCase('spacing-2')).toBe(true);
    expect(isKebabCase('Color-brand')).toBe(false);
    expect(isKebabCase('color--brand')).toBe(false);
    expect(isKebabCase('-color-brand')).toBe(false);
  });

  test('validates known token prefixes', () => {
    expect(hasValidTokenPrefix('color-brand-primary')).toBe(true);
    expect(hasValidTokenPrefix('spacing-container')).toBe(true);
    expect(hasValidTokenPrefix('typography-heading')).toBe(true);
    expect(hasValidTokenPrefix('shadow-card')).toBe(true);
    expect(hasValidTokenPrefix('radius-sm')).toBe(true);
    expect(hasValidTokenPrefix('border-subtle')).toBe(true);
    expect(hasValidTokenPrefix('motion-fast')).toBe(true);
    expect(hasValidTokenPrefix('chart-primary')).toBe(false);
    expect(hasValidTokenPrefix('color')).toBe(false);
  });
});

describe('isValidColorToken', () => {
  test('accepts valid color tokens with supported color values', () => {
    expect(isValidColorToken(colorToken('#112233'))).toBe(true);
    expect(isValidColorToken(colorToken('rgb(17, 34, 51)'))).toBe(true);
    expect(isValidColorToken(colorToken('hsl(210, 50%, 40%)'))).toBe(true);
  });

  test('rejects malformed base token shapes', () => {
    expect(isValidColorToken(null)).toBe(false);
    expect(isValidColorToken('not-object')).toBe(false);
    expect(isValidColorToken({ $type: 'dimension', $value: '#112233' })).toBe(false);
    expect(isValidColorToken({ $type: 'color' })).toBe(false);
    expect(isValidColorToken({ $type: 'color', $value: 123 })).toBe(false);
    expect(isValidColorToken({ $type: 'color', $value: 'not-a-color' })).toBe(false);
  });

  test('accepts complete accessibility metadata', () => {
    expect(
      isValidColorToken({
        ...colorToken(),
        accessibility: {
          wcagLevel: 'AAA',
          colorblindSafe: true,
          colorblindSimulation: {
            protanopia: '#223344',
            deuteranopia: 'rgb(34, 51, 68)',
            tritanopia: 'hsl(210, 30%, 45%)',
          },
        },
      }),
    ).toBe(true);
  });

  test('rejects malformed accessibility metadata', () => {
    expect(isValidColorToken({ ...colorToken(), accessibility: 'yes' })).toBe(false);
    expect(isValidColorToken({ ...colorToken(), accessibility: { wcagLevel: 'A' } })).toBe(false);
    expect(isValidColorToken({ ...colorToken(), accessibility: { colorblindSafe: 'true' } })).toBe(false);
    expect(isValidColorToken({ ...colorToken(), accessibility: { colorblindSimulation: 'none' } })).toBe(false);
    expect(
      isValidColorToken({
        ...colorToken(),
        accessibility: { colorblindSimulation: { protanopia: 'invalid' } },
      }),
    ).toBe(false);
    expect(
      isValidColorToken({
        ...colorToken(),
        accessibility: { colorblindSimulation: { deuteranopia: 'invalid' } },
      }),
    ).toBe(false);
    expect(
      isValidColorToken({
        ...colorToken(),
        accessibility: { colorblindSimulation: { tritanopia: 'invalid' } },
      }),
    ).toBe(false);
  });
});

describe('isValidChartTokens', () => {
  test('accepts complete surface, categorical, and sequential chart tokens', () => {
    expect(isValidChartTokens(validChartTokens())).toBe(true);
  });

  test('rejects non-object and missing surface groups', () => {
    expect(isValidChartTokens(null)).toBe(false);
    expect(isValidChartTokens('chart')).toBe(false);
    expect(isValidChartTokens({})).toBe(false);

    const chart = validChartTokens();
    delete (chart as Record<string, unknown>).axis;
    expect(isValidChartTokens(chart)).toBe(false);
  });

  test('rejects malformed surface light and dark tokens', () => {
    expect(isValidChartTokens({ ...validChartTokens(), axis: 'invalid' })).toBe(false);
    expect(isValidChartTokens({ ...validChartTokens(), grid: { light: colorToken() } })).toBe(false);
    expect(isValidChartTokens({ ...validChartTokens(), tooltipBg: { light: colorToken('invalid'), dark: colorToken() } })).toBe(false);
    expect(isValidChartTokens({ ...validChartTokens(), tooltipText: { light: colorToken(), dark: colorToken('invalid') } })).toBe(false);
  });

  test('rejects missing, malformed, and undersized categorical ramps', () => {
    expect(isValidChartTokens({ ...validChartTokens(), categorical: undefined })).toBe(false);
    expect(isValidChartTokens({ ...validChartTokens(), categorical: 'invalid' })).toBe(false);
    expect(isValidChartTokens({ ...validChartTokens(), categorical: ramp(4) })).toBe(false);
    expect(isValidChartTokens({ ...validChartTokens(), categorical: { ...ramp(4), broken: 'invalid' } })).toBe(false);
    expect(
      isValidChartTokens({
        ...validChartTokens(),
        categorical: { ...ramp(4), broken: { light: colorToken('invalid'), dark: colorToken() } },
      }),
    ).toBe(false);
  });

  test('rejects missing, malformed, and undersized sequential ramps', () => {
    expect(isValidChartTokens({ ...validChartTokens(), sequential: undefined })).toBe(false);
    expect(isValidChartTokens({ ...validChartTokens(), sequential: 'invalid' })).toBe(false);
    expect(isValidChartTokens({ ...validChartTokens(), sequential: ramp(4) })).toBe(false);
    expect(isValidChartTokens({ ...validChartTokens(), sequential: { ...ramp(4), broken: 'invalid' } })).toBe(false);
    expect(
      isValidChartTokens({
        ...validChartTokens(),
        sequential: { ...ramp(4), broken: { light: colorToken(), dark: colorToken('invalid') } },
      }),
    ).toBe(false);
  });
});
