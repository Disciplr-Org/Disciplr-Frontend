import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'

function createMatchMediaController(initialMatch: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  let matches = initialMatch

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      get matches() {
        return matches
      },
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener)
      },
      removeEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener)
      },
      dispatchEvent: vi.fn(),
    })),
  })

  return {
    setMatches(nextValue: boolean) {
      matches = nextValue
      const event = { matches } as MediaQueryListEvent
      listeners.forEach((listener) => listener(event))
    },
    listenerCount() {
      return listeners.size
    },
  }
}

describe('usePrefersReducedMotion', () => {
  it('reads the initial media query value and updates on change', () => {
    const media = createMatchMediaController(true)
    const { result } = renderHook(() => usePrefersReducedMotion())

    expect(result.current).toBe(true)

    act(() => {
      media.setMatches(false)
    })

    expect(result.current).toBe(false)
  })

  it('removes the media query listener on unmount', () => {
    const media = createMatchMediaController(false)
    const { unmount } = renderHook(() => usePrefersReducedMotion())

    expect(media.listenerCount()).toBe(1)
    unmount()
    expect(media.listenerCount()).toBe(0)
  })
})
