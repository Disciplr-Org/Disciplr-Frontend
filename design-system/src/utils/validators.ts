/**
 * Token validation utilities
 */

export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

export function isValidRgbColor(color: string): boolean {
  return /^rgb\(\d+,\s*\d+,\s*\d+\)$/.test(color);
}

export function isValidHslColor(color: string): boolean {
  return /^hsl\(\d+,\s*\d+%,\s*\d+%\)$/.test(color);
}

export function isKebabCase(str: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(str);
}

export function hasValidTokenPrefix(tokenName: string): boolean {
  const validPrefixes = ['color', 'spacing', 'typography', 'shadow', 'radius', 'border', 'motion'];
  return validPrefixes.some(prefix => tokenName.startsWith(prefix + '-'));
}
export function isValidColorString(color: string): boolean {
  return isValidHexColor(color) || isValidRgbColor(color) || isValidHslColor(color);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isValidColorToken(token: unknown): boolean {
  if (!isRecord(token)) return false;
  if (token.$type !== 'color') return false;
  if (typeof token.$value !== 'string' || !isValidColorString(token.$value)) return false;

  if (token.accessibility !== undefined) {
    const acc = token.accessibility;
    if (!isRecord(acc)) return false;
    if (acc.wcagLevel !== undefined && acc.wcagLevel !== 'AA' && acc.wcagLevel !== 'AAA') return false;
    if (acc.colorblindSafe !== undefined && typeof acc.colorblindSafe !== 'boolean') return false;
    if (acc.colorblindSimulation !== undefined) {
      const sim = acc.colorblindSimulation;
      if (!isRecord(sim)) return false;
      for (const key of ['protanopia', 'deuteranopia', 'tritanopia']) {
        const color = sim[key];
        if (color !== undefined && (typeof color !== 'string' || !isValidColorString(color))) return false;
      }
    }
  }
  return true;
}

export function isValidChartTokens(chart: unknown): boolean {
  if (!isRecord(chart)) return false;

  // 1. Validate surface tokens
  const surfaceKeys = ['axis', 'grid', 'tooltipBg', 'tooltipBorder', 'tooltipText', 'tooltipLabel'];
  for (const key of surfaceKeys) {
    const tokenGroup = chart[key];
    if (!isRecord(tokenGroup)) return false;
    if (!isValidColorToken(tokenGroup.light) || !isValidColorToken(tokenGroup.dark)) return false;
  }

  // 2. Validate categorical ramp
  const categorical = chart.categorical;
  if (!isRecord(categorical)) return false;
  const catSteps = Object.keys(categorical);
  if (catSteps.length < 5) return false;
  for (const step of catSteps) {
    const tokenGroup = categorical[step];
    if (!isRecord(tokenGroup)) return false;
    if (!isValidColorToken(tokenGroup.light) || !isValidColorToken(tokenGroup.dark)) return false;
  }

  // 3. Validate sequential ramp
  const sequential = chart.sequential;
  if (!isRecord(sequential)) return false;
  const seqSteps = Object.keys(sequential);
  if (seqSteps.length < 5) return false;
  for (const step of seqSteps) {
    const tokenGroup = sequential[step];
    if (!isRecord(tokenGroup)) return false;
    if (!isValidColorToken(tokenGroup.light) || !isValidColorToken(tokenGroup.dark)) return false;
  }

  return true;
}
