# Contributor Testing Guide

Disciplr has two test stacks:

- The app under `src/` uses Vitest, React Testing Library, and jsdom.
- The `design-system/` package uses Jest with `ts-jest` for token utilities and validators.

Use this guide when adding tests, updating mocks, or deciding which command belongs to which package.

## Commands

### App Tests

Run the full app suite from the repository root:

```bash
npm run test
```

The root `package.json` currently declares `test` twice. JSON keeps the later key, so `npm run test` resolves to:

```bash
vitest run --coverage
```

Run one app test file:

```bash
npx vitest run src/pages/__tests__/Vaults.test.tsx
```

Run Vitest in watch mode:

```bash
npx vitest
```

App test configuration lives in `vitest.config.ts`:

- `environment: "jsdom"`
- `setupFiles: "./src/setupTests.ts"`
- `include: ["src/**/*.test.{ts,tsx}"]`
- coverage reporters: `text` and `html`

`src/setupTests.ts` currently installs `@testing-library/jest-dom`.

### Design-System Tests

Run the design-system suite from the package directory:

```bash
cd design-system
npm test
```

Run design-system tests in watch mode:

```bash
cd design-system
npm run test:watch
```

Design-system test configuration lives in `design-system/jest.config.js`:

- `preset: "ts-jest"`
- `testEnvironment: "node"`
- `roots: ["<rootDir>/src"]`
- test files under `src/__tests__/`
- global coverage thresholds of 80 percent for branches, functions, lines, and statements

## Where Tests Live

| Area | Test stack | Location | Examples |
| --- | --- | --- | --- |
| Pages | Vitest + RTL | `src/pages/__tests__/` | `Analytics.test.tsx`, `VaultDetail.test.tsx` |
| Shared app components | Vitest + RTL | `src/components/__tests__/` | `CountdownDeadline.test.tsx`, `ConfirmationModal.test.tsx` |
| Wallet components | Vitest + RTL | `src/components/Wallet/__tests__/` | `WalletDropdown.test.tsx` |
| Contexts | Vitest + RTL | `src/context/__tests__/` | `WalletContext.test.tsx` |
| Utilities | Vitest | `src/utils/__tests__/` | `horizon.test.ts`, `url.test.ts` |
| Design tokens and validators | Jest | `design-system/src/__tests__/` | `validators.test.ts`, `token-loader.test.ts` |

## App Test Patterns

### Browser API Stubs

jsdom does not implement every browser API used by the app. Keep stubs local to the test file unless they are needed globally.

`src/pages/__tests__/Analytics.test.tsx` stubs `window.matchMedia` before analytics tests:

```tsx
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});
```

Use this for code that reads reduced-motion or color-scheme media queries, including `Analytics.tsx` and `ThemeContext.tsx`.

### Heavy UI Library Mocks

Prefer narrow local mocks for libraries that add layout, canvas, PDF, portal, or animation behavior unrelated to the assertion.

`src/pages/__tests__/Analytics.test.tsx` mocks Recharts with simple pass-through components:

```tsx
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));
```

The same test file mocks `jspdf` with only the methods the component calls:

```tsx
vi.mock("jspdf", () => ({
  default: class {
    text() {}
    save() {}
    addImage() {}
  },
}));
```

For `framer-motion`, keep the mock close to the test and preserve DOM props so accessibility assertions still see the real structure:

```tsx
import React from "react";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));
```

If a component uses a different animated element, add only that element to the local mock.

### Focus-Trap and Portal-Like Components

`src/components/__tests__/ConfirmationModal.test.tsx` mocks `focus-trap-react` so Escape behavior can be asserted without invoking the real focus trap:

```tsx
vi.mock("focus-trap-react", () => ({
  default: ({ children, focusTrapOptions }: any) => (
    <div
      data-testid="focus-trap"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          focusTrapOptions?.onDeactivate?.();
        }
      }}
    >
      {children}
    </div>
  ),
}));
```

Keep this pattern when the test is about the component's reaction to close events rather than the focus-trap library itself.

### Fake Timers

Use fake timers only inside tests that need deterministic intervals or delayed UI.

`src/components/__tests__/CountdownDeadline.test.tsx` sets the system time before rendering:

```tsx
vi.useFakeTimers();
vi.setSystemTime(new Date("2026-06-18T12:00:00Z"));

render(<CountdownDeadline deadline="2026-06-18T23:45:00Z" />);
```

Advance timers inside `act` when a timer triggers a React state update:

```tsx
act(() => {
  vi.advanceTimersByTime(60000);
});
```

Always restore timers and mocks in cleanup:

```tsx
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
```

### Injected Fetchers

Prefer dependency injection over global network mocks when the utility already supports it.

`src/utils/horizon.ts` accepts a `fetcher` argument. `src/utils/__tests__/horizon.test.ts` passes a `vi.fn()` response:

```ts
const fetcher = vi.fn().mockResolvedValue(
  mockResponse(200, {
    balances: [
      {
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer: USDC_ISSUERS.TESTNET,
        balance: "25.5000000",
      },
    ],
  }),
);

await expect(fetchUsdcBalance("GTEST ACCOUNT", "TESTNET", fetcher)).resolves.toEqual({
  balance: "25.5000000",
  hasTrustline: true,
  issuer: USDC_ISSUERS.TESTNET,
  network: "TESTNET",
});
```

Use `globalThis.fetch = vi.fn()` for provider-level tests where the production code calls the global fetch path, as in `src/context/__tests__/WalletContext.test.tsx`.

### Wallet and Freighter Mocks

Wallet tests should mock `@stellar/freighter-api` with `vi.hoisted` so the mock functions are available inside `vi.mock`:

```ts
const freighterMocks = vi.hoisted(() => ({
  isAllowed: vi.fn(),
  setAllowed: vi.fn(),
  requestAccess: vi.fn(),
  getAddress: vi.fn(),
  getNetworkDetails: vi.fn(),
}));

vi.mock("@stellar/freighter-api", () => freighterMocks);
```

Reset mock behavior in `beforeEach` with `vi.resetAllMocks()` and set the expected Freighter responses for each test.

### Clipboard and Window APIs

`src/components/Wallet/__tests__/WalletDropdown.test.tsx` shows how to mock clipboard and external navigation:

```ts
const writeText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, { clipboard: { writeText } });
const open = vi.spyOn(window, "open").mockImplementation(() => null);
```

Restore spies after the assertion when they are not covered by shared cleanup.

### Zustand Store State

The notification and verifier stores live in `src/Zustand/Store.ts`. When a test mutates a Zustand store, reset it explicitly before the next test.

Capture the initial slices once, then restore them in `beforeEach`:

```ts
const initialVerifierState = useVerifierStore.getState();

beforeEach(() => {
  useVerifierStore.setState({
    pendingValidations: [...initialVerifierState.pendingValidations],
    validationHistory: [...initialVerifierState.validationHistory],
  });
});
```

Do not replace the whole store with `setState(nextState, true)` unless you also restore action functions such as `approveValidation` and `rejectValidation`.

## Design-System Test Patterns

### Token Loader Tests

`design-system/src/__tests__/token-loader.test.ts` mocks Node `fs`:

```ts
import * as fs from "fs";

jest.mock("fs");
const mockedFs = fs as jest.Mocked<typeof fs>;
```

Use this pattern for file-loading behavior so token-loader tests do not depend on the real filesystem.

### Validator Tests

`design-system/src/__tests__/validators.test.ts` uses local factories to keep token shapes readable:

```ts
const colorToken = (value = "#112233") => ({
  $type: "color",
  $value: value,
});

const tokenGroup = (value = "#112233") => ({
  light: colorToken(value),
  dark: colorToken(value),
});
```

Prefer small factories for repeated token shapes rather than copying whole token JSON blocks into every assertion.

### Property-Based Coverage

The design-system package includes `fast-check`. Use it when a validator should hold for a broad class of generated values, and keep deterministic examples for edge cases that need readable failure messages.

## Coverage

The app suite prints text coverage and writes an HTML report through Vitest coverage. Use the text output for PR summaries and the HTML report for local investigation.

The design-system suite enforces 80 percent global coverage through `design-system/jest.config.js`. When adding validator or token-loader behavior, keep the tests near the changed utility under `design-system/src/__tests__/`.

## PR Checklist

Before opening a PR:

- Run the app suite if you changed files under `src/`: `npm run test`.
- Run a targeted Vitest file while iterating: `npx vitest run <path-to-test>`.
- Run the design-system Jest suite if you changed `design-system/`: `cd design-system && npm test`.
- Keep mocks local unless multiple suites need the same browser API shim.
- Link to the representative test file in the PR description when adding a new recipe or pattern.
