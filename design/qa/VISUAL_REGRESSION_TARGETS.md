# Visual Regression Targets — Disciplr Frontend

**Purpose:** Define the canonical snapshot set for automated (Percy/Chromatic) and manual visual regression testing.  
**Branch:** `design/qa-checklist-visual-regression`  
**Related:** `design/qa/DESIGN_QA_CHECKLIST.md`, `design/qa/RELEASE_GATE.md`

---

## Tool recommendation

| Option | Best for | Cost |
|---|---|---|
| **Percy** (BrowserStack) | CI-integrated, per-diff pricing, good Vite support | Free tier: 5 000 snapshots/mo |
| **Chromatic** (Storybook) | Component-level isolation, Storybook-native | Free tier: 5 000 snapshots/mo |
| **Manual screenshots** | No CI budget, quick audits | Free |

**Recommendation for Disciplr:** Start with Percy for page-level snapshots (no Storybook required). Add Chromatic later when a component library is formalized.

---

## Option A — Percy (page-level, recommended)

### 1. Install

```bash
npm install --save-dev @percy/cli @percy/playwright
# or, if using Cypress:
npm install --save-dev @percy/cli @percy/cypress
```

### 2. Set Percy token

```bash
# .env.local (never commit)
PERCY_TOKEN=your_percy_project_token
```

Add to CI secrets (GitHub Actions: `Settings → Secrets → PERCY_TOKEN`).

### 3. GitHub Actions workflow

Create `.github/workflows/visual-regression.yml`:

```yaml
name: Visual Regression

on:
  pull_request:
    paths:
      - 'src/**'
      - 'design-system/**'
      - 'index.css'

jobs:
  percy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Percy snapshot
        run: npx percy snapshot ./dist --base-url /
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
```

> For dynamic pages (auth-gated, data-driven), use Percy with Playwright to navigate and snapshot each route. See Option A-2 below.

### 4. Percy + Playwright script (dynamic pages)

Create `tests/visual/snapshots.ts`:

```typescript
import { test } from '@playwright/test';
import { percySnapshot } from '@percy/playwright';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

const ROUTES = [
  { path: '/',                          name: 'Home' },
  { path: '/vaults',                    name: 'Vaults' },
  { path: '/vaults/create',             name: 'CreateVault' },
  { path: '/dashboard',                 name: 'Dashboard' },
  { path: '/vaults/1',                  name: 'VaultDetail' },
  { path: '/vaults/1/transactions',     name: 'VaultTransactions' },
  { path: '/notifications',             name: 'Notifications' },
  { path: '/notifications/settings',    name: 'NotificationSettings' },
];

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of ROUTES) {
      test(`${route.name}`, async ({ page }) => {
        await page.goto(route.path);
        await page.waitForLoadState('networkidle');
        await percySnapshot(page, `${route.name} — ${viewport.name}`);
      });
    }

    // Modal states
    test('CreateVault — validation errors', async ({ page }) => {
      await page.goto('/vaults/create');
      await page.click('button[type="submit"]');
      await percySnapshot(page, `CreateVault validation errors — ${viewport.name}`);
    });
  });
}

// Theme variants
test.describe('Dark theme', () => {
  test.use({ colorScheme: 'dark' });
  for (const route of ROUTES) {
    test(route.name, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      await percySnapshot(page, `${route.name} — dark — desktop`);
    });
  }
});
```

---

## Option B — Chromatic (component-level)

### 1. Prerequisites

Chromatic requires Storybook. If Storybook is not yet set up:

```bash
npx storybook@latest init --type react_vite
npm install --save-dev chromatic
```

### 2. Publish to Chromatic

```bash
npx chromatic --project-token=your_chromatic_token
```

### 3. GitHub Actions

```yaml
- name: Publish to Chromatic
  uses: chromaui/action@latest
  with:
    projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
    exitZeroOnChanges: true   # don't fail CI; let reviewers approve
```

### 4. Stories to create (priority order)

| Story | Variants |
|---|---|
| `VaultCard` | active, completed, failed, cancelled, pending_validation |
| `StatusBadge` | all 5 statuses × light/dark |
| `Button` | primary, secondary, destructive × default/hover/focus/disabled |
| `FormInput` | default, focused, error, disabled |
| `Modal` | open state with title + body + actions |
| `NotificationItem` | unread, read |
| `ThemeToggle` | light, dark |

---

## Manual Snapshot List

Use this list when automated tooling is not available. Capture screenshots with browser DevTools at the specified viewport. Store in `design/qa/screenshots/YYYY-MM-DD/`.

### Naming convention

```
{PageName}_{theme}_{viewport}_{state}.png
```

Example: `Vaults_light_375_default.png`

### Required snapshots (light mode — primary)

| # | Page / Surface | Viewport | State | Notes |
|---|---|---|---|---|
| 1 | Home | 375 | default | |
| 2 | Home | 768 | default | |
| 3 | Home | 1280 | default | |
| 4 | Vaults | 375 | default (3 vaults shown) | |
| 5 | Vaults | 1280 | default | |
| 6 | CreateVault | 375 | empty form | |
| 7 | CreateVault | 375 | validation errors | Submit with empty fields |
| 8 | CreateVault | 1280 | empty form | |
| 9 | Dashboard | 375 | default | |
| 10 | Dashboard | 1280 | default | |
| 11 | VaultDetail | 375 | active vault | |
| 12 | VaultDetail | 1280 | active vault | |
| 13 | VaultTransactions | 375 | default | |
| 14 | VaultTransactions | 1280 | default | |
| 15 | Notifications | 375 | unread items | |
| 16 | Notifications | 1280 | unread items | |
| 17 | NotificationSettings | 375 | default | |
| 18 | NotificationSettings | 1280 | default | |
| 19 | Modal (any) | 375 | open | |
| 20 | Modal (any) | 1280 | open | |

### Required snapshots (dark mode — note gaps)

| # | Page / Surface | Viewport | State | Notes |
|---|---|---|---|---|
| 21 | Home | 1280 | default | |
| 22 | Vaults | 1280 | default | Check muted text contrast |
| 23 | CreateVault | 1280 | empty form | Check input border contrast |
| 24 | Dashboard | 1280 | default | |
| 25 | VaultDetail | 1280 | active vault | |
| 26 | Notifications | 1280 | unread items | |
| 27 | Modal (any) | 1280 | open | |

### Focus state snapshots (light mode)

| # | Element | Notes |
|---|---|---|
| 28 | Vault card (focused) | Tab to first card, screenshot |
| 29 | Create Vault submit button (focused) | Tab to button |
| 30 | Modal close button (focused) | Open modal, Tab to × |
| 31 | Nav link (focused) | Tab to first nav item |

---

## Baseline management

1. On the first run, all snapshots become the **baseline**.
2. On subsequent PRs, Percy/Chromatic diffs against the baseline.
3. A reviewer must **approve** visual diffs before merging — do not auto-approve.
4. Update the baseline intentionally after a design-approved change by accepting diffs in the Percy/Chromatic UI.
5. Tag baseline snapshots with the release version in Percy project settings.

---

## Figma traceability

Link each snapshot target to its Figma frame:

| Snapshot target | Figma frame name | Figma node ID |
|---|---|---|
| Home — desktop | `Home / Desktop` | *(add node ID)* |
| Vaults — mobile | `Vaults / Mobile` | *(add node ID)* |
| CreateVault — form | `Create Vault / Form` | *(add node ID)* |
| Modal — open | `Modal / Default` | *(add node ID)* |
| *(add rows as frames are created)* | | |

> To get a Figma node ID: right-click a frame → "Copy link" → the `node-id` query param is the ID.
