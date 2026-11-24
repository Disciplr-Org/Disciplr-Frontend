import { describe, expect, it } from 'vitest'
import { ROUTE_TITLES } from '../../routes/titles'
import { suggestRoutes } from '../suggestRoutes'

describe('suggestRoutes', () => {
  it('suggests /vaults when the user requests /vault', () => {
    const paths = suggestRoutes('/vault', ROUTE_TITLES).map((s) => s.path)
    expect(paths).toContain('/vaults')
  })

  it('suggests /transactions when the user requests /transaction', () => {
    const paths = suggestRoutes('/transaction', ROUTE_TITLES).map((s) => s.path)
    expect(paths).toContain('/transactions')
  })

  it('returns nothing when no path is within the distance threshold', () => {
    expect(suggestRoutes('/zzzzzz', ROUTE_TITLES)).toEqual([])
  })

  it('matches a typed prefix of a known route', () => {
    const paths = suggestRoutes('/vaults/cre', ROUTE_TITLES).map((s) => s.path)
    expect(paths).toContain('/vaults/create')
  })

  it('matches a small edit distance (typo) against a known route', () => {
    const paths = suggestRoutes('/dashbord', ROUTE_TITLES).map((s) => s.path)
    expect(paths).toContain('/dashboard')
  })

  it('returns at most three suggestions', () => {
    expect(suggestRoutes('/v', ROUTE_TITLES)).toHaveLength(3)
  })

  it('returns the route path and title for each suggestion', () => {
    const suggestions = suggestRoutes('/vault', ROUTE_TITLES)
    expect(suggestions).toContainEqual({ path: '/vaults', title: 'Vaults' })
  })

  it('never suggests parameterized routes', () => {
    const paths = suggestRoutes('/vaults/1', ROUTE_TITLES).map((s) => s.path)
    expect(paths).not.toContain('/vaults/:id')
    expect(paths.every((path) => !path.includes(':'))).toBe(true)
  })

  it('never suggests the visual-test route', () => {
    expect(suggestRoutes('/__visual__/crsh', ROUTE_TITLES)).toEqual([])
  })

  it('does not suggest the path the user is already on', () => {
    const paths = suggestRoutes('/vaults', ROUTE_TITLES).map((s) => s.path)
    expect(paths).not.toContain('/vaults')
  })
})
