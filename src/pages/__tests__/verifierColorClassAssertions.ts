import { expect } from 'vitest';

const hardcodedColorClassPattern =
  /\b(?:bg|text|border|border-l|hover:bg|hover:text|focus:ring)-(?:gray|blue|green|red)-\d{2,3}\b|\b(?:bg-white|text-white)\b/;

export function expectNoVerifierHardcodedColorClasses(container: ParentNode = document.body) {
  const classNames = Array.from(container.querySelectorAll('[class]'))
    .map((element) => element.getAttribute('class') ?? '')
    .join(' ');

  expect(classNames).not.toMatch(hardcodedColorClassPattern);
}
