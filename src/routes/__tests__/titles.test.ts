import { describe, expect, it } from 'vitest'
import { formatDocumentTitle, getRouteTitle, ROUTE_TITLES } from '../titles'
import appSource from '../../App.tsx?raw'

describe('route titles', () => {
  it('provides a non-empty title for every declared route pattern', () => {
    for (const { path, title } of ROUTE_TITLES) {
      expect(title, path).toBeTruthy()
      expect(getRouteTitle(path.replace(/:[^/]+/g, 'sample-id')), path).toBe(title)
    }
  })

  it('has title metadata for every route declared in App', () => {
    const appPaths = Array.from(appSource.matchAll(/path="([^"]+)"/g), (match) => match[1])
    const titlePaths = new Set(ROUTE_TITLES.map(({ path }) => path))

    expect(appPaths.length).toBeGreaterThan(0)
    for (const path of appPaths) {
      expect(titlePaths.has(path), `Missing title for ${path}`).toBe(true)
    }
  })

  it('uses a not-found title for unknown paths', () => {
    expect(getRouteTitle('/unknown/path')).toBe('Not found')
    expect(formatDocumentTitle(getRouteTitle('/unknown/path'))).toBe('Not found · Disciplr')
  })
})