import { describe, expect, it } from 'vitest';
import {
  getTypographyClass,
  classifyTypography,
  type TypographyRole,
} from '../typography';

// ── getTypographyClass ────────────────────────────────────────────────────────

describe('getTypographyClass', () => {
  const cases: [TypographyRole, string][] = [
    ['display', 'text-display'],
    ['title', 'text-title'],
    ['subtitle', 'text-subtitle'],
    ['body', 'text-body'],
    ['caption', 'text-caption'],
    ['mono', 'text-mono'],
  ];

  it.each(cases)(
    'maps role "%s" to class "%s"',
    (role, expected) => {
      expect(getTypographyClass(role)).toBe(expected);
    },
  );

  it('returns a non-empty string for every role', () => {
    const roles: TypographyRole[] = [
      'display', 'title', 'subtitle', 'body', 'caption', 'mono',
    ];
    roles.forEach(role => {
      expect(getTypographyClass(role)).toBeTruthy();
    });
  });
});

// ── classifyTypography ────────────────────────────────────────────────────────

describe('classifyTypography', () => {
  it('returns only the base class when additionalClasses is omitted', () => {
    expect(classifyTypography('body')).toBe('text-body');
  });

  it('returns only the base class when additionalClasses is undefined', () => {
    expect(classifyTypography('title', undefined)).toBe('text-title');
  });

  it('returns only the base class when additionalClasses is an empty string', () => {
    expect(classifyTypography('caption', '')).toBe('text-caption');
  });

  it('joins base class and a single extra class with one space', () => {
    expect(classifyTypography('body', 'font-bold')).toBe('text-body font-bold');
  });

  it('joins base class and multiple extra classes preserving the original string', () => {
    expect(classifyTypography('body', 'a b c')).toBe('text-body a b c');
  });

  it('works correctly for every role when additional classes are supplied', () => {
    const roles: TypographyRole[] = [
      'display', 'title', 'subtitle', 'body', 'caption', 'mono',
    ];
    roles.forEach(role => {
      const base = getTypographyClass(role);
      expect(classifyTypography(role, 'extra')).toBe(`${base} extra`);
    });
  });

  it('does not add extra whitespace around the joined classes', () => {
    const result = classifyTypography('mono', 'italic');
    expect(result).toBe('text-mono italic');
    expect(result).not.toMatch(/\s{2,}/);
  });
});
