import AxeBuilder from '@axe-core/playwright'
import { test, expect } from './fixtures/test'
import { gotoProtected, gotoStable } from './visual/fixtures'
import { ROUTE_TITLES } from '../src/routes/titles'

const THEMES = ['light', 'dark'] as const
const FAILING_IMPACTS = new Set(['serious', 'critical'])

const PROTECTED_PATTERNS = new Set<string>([
  '/vaults/create',
  '/verifier/queue',
  '/verifier/queue/:vaultId',
])

const CONCRETE_PARAMS: Record<string, string> = {
  '/vaults/:id': '/vaults/1',
  '/vaults/:id/transactions': '/vaults/1/transactions',
  '/verifier/queue/:vaultId': '/verifier/queue/v1',
  '/help/articles/:slug': '/help/articles/getting-started',
  '*': '/this-route-does-not-exist',
}

// Routes that are only mounted in visual-regression mode (import.meta.env.MODE === 'visual')
const SKIP_PATTERNS = new Set<string>(['/__visual__/crash'])

const ROUTES = ROUTE_TITLES.filter(({ path }) => !SKIP_PATTERNS.has(path)).map(
  ({ path, title }) => ({
    pattern: path,
    title,
    url: CONCRETE_PARAMS[path] ?? path,
    isProtected: PROTECTED_PATTERNS.has(path),
  }),
)

function formatViolationSummary(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
): string {
  if (violations.length === 0) return 'No violations'
  return violations
    .map((v) => {
      const targets = v.nodes
        .slice(0, 5)
        .map((n) => n.target.join(' '))
        .join(', ')
      const more = v.nodes.length > 5 ? ` (+${v.nodes.length - 5} more)` : ''
      return `[${v.impact ?? 'unknown'}] ${v.id} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'}): ${v.help}\n  Targets: ${targets}${more}\n  Help: ${v.helpUrl}`
    })
    .join('\n\n')
}

for (const theme of THEMES) {
  test.describe(`a11y (${theme} theme)`, () => {
    for (const route of ROUTES) {
      test(`${route.title} (${route.url}) has no serious or critical violations`, async ({
        page,
      }, testInfo) => {
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
        await page.addInitScript((t) => {
          window.localStorage.setItem('disciplr-theme', t)
        }, theme)

        if (route.isProtected) {
          await gotoProtected(page, route.url)
        } else {
          await gotoStable(page, route.url)
        }

        const results = await new AxeBuilder({ page }).analyze()

        const failing = results.violations.filter(
          (v) => v.impact != null && FAILING_IMPACTS.has(v.impact),
        )

        if (results.violations.length > 0) {
          await testInfo.attach(`axe-violations-${theme}`, {
            body: formatViolationSummary(results.violations),
            contentType: 'text/plain',
          })
        }

        expect(
          failing,
          `Found ${failing.length} serious/critical a11y violation(s) on ${route.url} (${theme}):\n\n${formatViolationSummary(failing)}`,
        ).toEqual([])
      })
    }
  })
}
