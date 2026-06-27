# Contributing

## Test Setup

The project uses **two separate test runners** that must not be mixed.

### App tests — Vitest

Covers all files under `src/` (`*.test.ts` and `*.test.tsx`).

```bash
# Run once with coverage (CI mode)
npm test

# Interactive watch mode
npm run test:watch

# Run a single file
npx vitest run src/components/__tests__/NavLink.test.tsx
```

Coverage is written to `coverage/`. Open `coverage/index.html` for the HTML report.
Enforced thresholds: statements 50 %, branches 80 %, functions 65 %, lines 50 %.

**Environment**: `.test.tsx` files run in **jsdom** (DOM + RTL available). `.test.ts` files run in **node**.

**Setup file**: `src/setupTests.ts` — imports `@testing-library/jest-dom` so all RTL matchers (`toBeInTheDocument`, etc.) are available globally.

**`@` alias**: `@` resolves to `src/`. Use it in test imports the same way production code does:
```ts
import { foo } from '@/utils/foo';
```

### Design-system tests — Jest

Covers files under `design-system/src/`.

```bash
cd design-system

# Run once
npm test

# Interactive watch mode
npm run test:watch
```

## Linting

```bash
# App
npm run lint

# Design-system
cd design-system && npm run lint
```

## Branch Naming

```
type/short-slug
```

Examples: `feat/vault-filter`, `test/navlink-coverage`, `docs/contributing-guide`, `fix/pagination-reset`.

## Pull Requests

- PRs are expected to land within **96 hours** of being opened.
- Keep the diff focused — one concern per PR.
- Every new or changed line of testable code should maintain or improve coverage above the thresholds above.
