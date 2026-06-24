# Verifier token colors

Verifier pages should use semantic CSS variables instead of Tailwind color utilities for surfaces, copy, borders, and action states.

## Mapping

- Page copy and labels: `--text` and `--muted`.
- Cards, tables, and panels: `--surface`, `--surface-raised`, and `--border`.
- Primary review actions: `--accent` with `--bg` foreground.
- Approval and completion states: `--success`.
- Rejection, missing, and urgent states: `--danger`.

Urgency should not be color-only. Verifier dashboard rows and validation detail deadline pills include explicit `Urgent` copy when the task is inside the urgent threshold.

## Regression Check

Verifier tests scan rendered class names for hardcoded Tailwind color utilities such as `bg-white`, `text-gray-*`, `bg-blue-*`, `text-red-*`, and `border-l-blue-*`. Keep layout and spacing utilities in class names, but route color through token-backed styles or token-backed CSS classes.
