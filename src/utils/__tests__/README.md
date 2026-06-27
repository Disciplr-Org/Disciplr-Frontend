# Utility test contracts

The typography utility tests lock the shared `Text` role contract:

- each `TypographyRole` maps to its exact `text-*` design-token class;
- `classifyTypography` returns the base class unchanged when no extra classes
  are supplied;
- extra class strings are appended after the base typography class without
  mutating the caller-provided class list.

These assertions keep role names, design-token class names, and shared text
component styling aligned during future refactors.
