import { describe, expect, it } from 'vitest';
import { getTypographyClass, type TypographyRole } from '../typography';

const roleClasses: Record<TypographyRole, string> = {
  display: 'text-display',
  title: 'text-title',
  subtitle: 'text-subtitle',
  body: 'text-body',
  caption: 'text-caption',
  mono: 'text-mono',
};

describe('getTypographyClass', () => {
  it('maps every supported role to its stable CSS class', () => {
    for (const [role, className] of Object.entries(roleClasses) as [TypographyRole, string][]) {
      expect(getTypographyClass(role)).toBe(className);
      expect(getTypographyClass(role)).toBe(className);
    }
  });

  it.each([
    ['unknown role', 'heading'],
    ['empty role', ''],
    ['prototype property', 'toString'],
    ['prototype key', '__proto__'],
    ['null', null],
    ['undefined', undefined],
    ['number', 1],
    ['object', {}],
  ])('rejects %s without returning an unsafe class', (_description, value) => {
    expect(() => getTypographyClass(value as TypographyRole)).toThrow(TypeError);
  });
});
