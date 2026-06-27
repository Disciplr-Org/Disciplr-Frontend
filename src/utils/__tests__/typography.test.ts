import { describe, expect, it } from 'vitest';

import {
  classifyTypography,
  getTypographyClass,
  type TypographyRole,
} from '../typography';

const roleClassCases: Array<[TypographyRole, string]> = [
  ['display', 'text-display'],
  ['title', 'text-title'],
  ['subtitle', 'text-subtitle'],
  ['body', 'text-body'],
  ['caption', 'text-caption'],
  ['mono', 'text-mono'],
];

describe('getTypographyClass', () => {
  it.each(roleClassCases)('maps %s to %s', (role, expectedClass) => {
    expect(getTypographyClass(role)).toBe(expectedClass);
  });
});

describe('classifyTypography', () => {
  it('returns only the base role class when additional classes are omitted', () => {
    expect(classifyTypography('body')).toBe('text-body');
  });

  it('returns only the base role class when additional classes are an empty string', () => {
    expect(classifyTypography('body', '')).toBe('text-body');
  });

  it('joins a single additional class with one space', () => {
    expect(classifyTypography('body', 'font-semibold')).toBe(
      'text-body font-semibold',
    );
  });

  it('preserves multiple additional classes after the base role class', () => {
    expect(classifyTypography('title', 'tracking-tight text-slate-900')).toBe(
      'text-title tracking-tight text-slate-900',
    );
  });
});
