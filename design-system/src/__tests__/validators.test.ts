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

const colorToken = (value = '#112233') => ({
  $type: 'color',
  $value: value,
});

const tokenGroup = (value = '#112233') => ({
  light: colorToken(value),
  dark: colorToken(value),
});

const ramp = (steps = 5) =>
  Object.fromEntries(
    Array.from({ length: steps }, (_, index) => [
      `step-${index + 1}`,
      tokenGroup(`#11223${index}`),
    ]),
  );

const validChart = () => ({
  axis: tokenGroup(),
  grid: tokenGroup(),
  tooltipBg: tokenGroup(),
  tooltipBorder: tokenGroup(),
  tooltipText: tokenGroup(),
  tooltipLabel: tokenGroup(),
  categorical: ramp(5),
  sequential: ramp(5),
});

const documentedChartTokenGroup = (light: string, dark: string) => ({
  light: colorToken(light),
  dark: colorToken(dark),
});

describe('standalone color string validators', () => {
  it('validates six-digit hex colors case-insensitively', () => {
    expect(isValidHexColor('#ABCDEF')).toBe(true);
    expect(isValidHexColor('#abcdef')).toBe(true);
    expect(isValidHexColor('#123abz')).toBe(false);
    expect(isValidHexColor('#abc')).toBe(false);
    expect(isValidHexColor('ABCDEF')).toBe(false);
  });

  it('validates rgb colors with numeric channels', () => {
    expect(isValidRgbColor('rgb(0,0,0)')).toBe(true);
    expect(isValidRgbColor('rgb(255, 255, 255)')).toBe(true);
    expect(isValidRgbColor('rgba(0, 0, 0, 1)')).toBe(false);
    expect(isValidRgbColor('rgb(a, b, c)')).toBe(false);
  });

  it('validates hsl colors with percentage saturation and lightness', () => {
    expect(isValidHslColor('hsl(210, 50%, 40%)')).toBe(true);
    expect(isValidHslColor('hsl(210, 50, 40)')).toBe(false);
    expect(isValidHslColor('hsla(210, 50%, 40%, 1)')).toBe(false);
  });

  it('accepts any supported color string format', () => {
    expect(isValidColorString('#112233')).toBe(true);
    expect(isValidColorString('rgb(17, 34, 51)')).toBe(true);
    expect(isValidColorString('hsl(210, 50%, 13%)')).toBe(true);
    expect(isValidColorString('var(--accent)')).toBe(false);
  });
});

describe('token name validators', () => {
  it('validates kebab-case names', () => {
    expect(isKebabCase('color-chart-step-1')).toBe(true);
    expect(isKebabCase('color')).toBe(true);
    expect(isKebabCase('Color-chart')).toBe(false);
    expect(isKebabCase('color--chart')).toBe(false);
    expect(isKebabCase('-color-chart')).toBe(false);
  });

  it('requires one of the supported token prefixes', () => {
    expect(hasValidTokenPrefix('color-accent')).toBe(true);
    expect(hasValidTokenPrefix('spacing-4')).toBe(true);
    expect(hasValidTokenPrefix('typography-title')).toBe(true);
    expect(hasValidTokenPrefix('shadow-card')).toBe(true);
    expect(hasValidTokenPrefix('radius-md')).toBe(true);
    expect(hasValidTokenPrefix('border-default')).toBe(true);
    expect(hasValidTokenPrefix('motion-fast')).toBe(true);
    expect(hasValidTokenPrefix('chart-accent')).toBe(false);
    expect(hasValidTokenPrefix('color')).toBe(false);
  });
});

describe('isValidColorToken', () => {
  it('accepts a valid color token with optional accessibility metadata', () => {
    expect(
      isValidColorToken({
        ...colorToken(),
        accessibility: {
          wcagLevel: 'AAA',
          colorblindSafe: true,
          colorblindSimulation: {
            protanopia: '#112234',
            deuteranopia: 'rgb(17, 34, 53)',
            tritanopia: 'hsl(210, 50%, 13%)',
          },
        },
      }),
    ).toBe(true);
  });

  it('rejects non-token and malformed token values', () => {
    expect(isValidColorToken(null)).toBe(false);
    expect(isValidColorToken('not-an-object')).toBe(false);
    expect(isValidColorToken({ $type: 'dimension', $value: '#112233' })).toBe(
      false,
    );
    expect(isValidColorToken({ $type: 'color', $value: 123 })).toBe(false);
    expect(isValidColorToken({ $type: 'color', $value: '#bad' })).toBe(false);
  });

  it('validates accessibility metadata branches', () => {
    const valid = colorToken();

    expect(
      isValidColorToken({ ...valid, accessibility: { wcagLevel: 'AA' } }),
    ).toBe(true);
    expect(
      isValidColorToken({ ...valid, accessibility: { wcagLevel: 'A' } }),
    ).toBe(false);
    expect(
      isValidColorToken({
        ...valid,
        accessibility: { colorblindSafe: 'true' },
      }),
    ).toBe(false);
    expect(
      isValidColorToken({ ...valid, accessibility: 'not-an-object' }),
    ).toBe(false);
    expect(
      isValidColorToken({
        ...valid,
        accessibility: { colorblindSimulation: 'not-an-object' },
      }),
    ).toBe(false);
  });

  it('rejects malformed colorblind simulations for each supported key', () => {
    expect(
      isValidColorToken({
        ...colorToken(),
        accessibility: { colorblindSimulation: { protanopia: 'bad' } },
      }),
    ).toBe(false);
    expect(
      isValidColorToken({
        ...colorToken(),
        accessibility: { colorblindSimulation: { deuteranopia: 'bad' } },
      }),
    ).toBe(false);
    expect(
      isValidColorToken({
        ...colorToken(),
        accessibility: { colorblindSimulation: { tritanopia: 'bad' } },
      }),
    ).toBe(false);
  });
});

describe('isValidChartTokens', () => {
  it('accepts a complete chart token set', () => {
    expect(isValidChartTokens(validChart())).toBe(true);
  });

  it('accepts the token authoring guide examples', () => {
    const guideColorToken = {
      $type: 'color',
      $value: '#2563EB',
      $description: 'Review action color in light mode',
      accessibility: {
        wcagLevel: 'AA',
        colorblindSafe: true,
        colorblindSimulation: {
          protanopia: '#2564EB',
          deuteranopia: '#2563EB',
          tritanopia: '#2563EC',
        },
      },
    };

    expect(isKebabCase('color-action-review')).toBe(true);
    expect(hasValidTokenPrefix('color-action-review')).toBe(true);
    expect(isValidColorToken(guideColorToken)).toBe(true);

    expect(
      isValidChartTokens({
        axis: documentedChartTokenGroup('#334155', '#CBD5E1'),
        grid: documentedChartTokenGroup('#E2E8F0', '#334155'),
        tooltipBg: documentedChartTokenGroup('#FFFFFF', '#0F172A'),
        tooltipBorder: documentedChartTokenGroup('#CBD5E1', '#475569'),
        tooltipText: documentedChartTokenGroup('#0F172A', '#F8FAFC'),
        tooltipLabel: documentedChartTokenGroup('#475569', '#CBD5E1'),
        categorical: {
          'step-1': documentedChartTokenGroup('#2563EB', '#60A5FA'),
          'step-2': documentedChartTokenGroup('#0D9488', '#2DD4BF'),
          'step-3': documentedChartTokenGroup('#7C3AED', '#A78BFA'),
          'step-4': documentedChartTokenGroup('#EA580C', '#FDBA74'),
          'step-5': documentedChartTokenGroup('#DC2626', '#FCA5A5'),
        },
        sequential: {
          'step-1': documentedChartTokenGroup('#EFF6FF', '#172554'),
          'step-2': documentedChartTokenGroup('#BFDBFE', '#1E3A8A'),
          'step-3': documentedChartTokenGroup('#60A5FA', '#1D4ED8'),
          'step-4': documentedChartTokenGroup('#2563EB', '#3B82F6'),
          'step-5': documentedChartTokenGroup('#1E40AF', '#93C5FD'),
        },
      }),
    ).toBe(true);
  });

  it('rejects missing or malformed surface tokens', () => {
    expect(isValidChartTokens(null)).toBe(false);
    expect(isValidChartTokens('not-an-object')).toBe(false);
    expect(isValidChartTokens({})).toBe(false);
    expect(isValidChartTokens({ ...validChart(), axis: null })).toBe(false);
    expect(
      isValidChartTokens({ ...validChart(), tooltipText: { light: colorToken() } }),
    ).toBe(false);
    expect(
      isValidChartTokens({
        ...validChart(),
        tooltipLabel: { light: colorToken(), dark: colorToken('bad') },
      }),
    ).toBe(false);
  });

  it('rejects missing, undersized, and malformed categorical ramps', () => {
    const chart = validChart();

    expect(isValidChartTokens({ ...chart, categorical: undefined })).toBe(false);
    expect(isValidChartTokens({ ...chart, categorical: ramp(4) })).toBe(false);
    expect(
      isValidChartTokens({
        ...chart,
        categorical: { ...ramp(4), 'step-5': 'not-a-token-group' },
      }),
    ).toBe(false);
    expect(
      isValidChartTokens({
        ...chart,
        categorical: {
          ...ramp(4),
          'step-5': { light: colorToken('bad'), dark: colorToken() },
        },
      }),
    ).toBe(false);
  });

  it('rejects missing, undersized, and malformed sequential ramps', () => {
    const chart = validChart();

    expect(isValidChartTokens({ ...chart, sequential: undefined })).toBe(false);
    expect(isValidChartTokens({ ...chart, sequential: ramp(4) })).toBe(false);
    expect(
      isValidChartTokens({
        ...chart,
        sequential: { ...ramp(4), 'step-5': 'not-a-token-group' },
      }),
    ).toBe(false);
    expect(
      isValidChartTokens({
        ...chart,
        sequential: {
          ...ramp(4),
          'step-5': { light: colorToken(), dark: colorToken('bad') },
        },
      }),
    ).toBe(false);
  });
});
