export interface RouteSuggestion {
  path: string
  title: string
}

export interface SuggestableRoute {
  readonly path: string
  readonly title: string
}

const DEFAULT_LIMIT = 3
const DEFAULT_MAX_DISTANCE = 3
// A prefix match only carries signal for a reasonably specific path: a bare
// "/" is a prefix of every route, and one-character prefixes match too many
// unrelated pages to be useful.
const MIN_PREFIX_LENGTH = 2

function normalizePath(path: string): string {
  const lower = path.trim().toLowerCase()
  return lower.length > 1 && lower.endsWith('/') ? lower.slice(0, -1) : lower
}

/**
 * Only literal, navigable patterns can be suggested: parameterized routes
 * (e.g. `/vaults/:id`) and the visual-test route carry no user-meaningful path,
 * and the catch-all `*` is the 404 itself.
 */
function isStaticRoute(path: string): boolean {
  return path !== '*' && !path.includes(':') && !path.includes('__visual__')
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  // Iterative two-row Levenshtein.
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  let curr = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const substitution = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + substitution,
      )
    }
    const swap = prev
    prev = curr
    curr = swap
  }

  return prev[b.length]
}

/**
 * Suggests up to `limit` static routes closest to `pathname`, using a typed
 * prefix or a small edit distance. Returns `{ path, title }` pairs so callers
 * can render accessible links without re-deriving the title.
 */
export function suggestRoutes(
  pathname: string,
  routes: readonly SuggestableRoute[],
  limit: number = DEFAULT_LIMIT,
  maxDistance: number = DEFAULT_MAX_DISTANCE,
): RouteSuggestion[] {
  const requested = normalizePath(pathname)
  if (!requested) return []

  const scored: { suggestion: RouteSuggestion; cost: number }[] = []

  for (const route of routes) {
    if (!isStaticRoute(route.path)) continue

    const candidate = normalizePath(route.path)
    if (candidate === requested) continue

    let cost: number | null = null
    if (requested.length >= MIN_PREFIX_LENGTH && candidate.startsWith(requested)) {
      // The user typed a prefix of a known route; the shorter the remaining
      // suffix, the stronger the match.
      cost = candidate.length - requested.length
    } else {
      const distance = editDistance(requested, candidate)
      if (distance <= maxDistance) cost = distance
    }

    if (cost !== null) {
      scored.push({ suggestion: { path: route.path, title: route.title }, cost })
    }
  }

  scored.sort(
    (a, b) =>
      a.cost - b.cost ||
      a.suggestion.path.length - b.suggestion.path.length ||
      a.suggestion.path.localeCompare(b.suggestion.path),
  )

  return scored.slice(0, Math.max(0, limit)).map((entry) => entry.suggestion)
}
