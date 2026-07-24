import { useEffect, useState } from 'react'

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const

export type Breakpoint = keyof typeof breakpoints

export function getBreakpointQuery(breakpoint: Breakpoint) {
  return `(min-width: ${breakpoints[breakpoint]})`
}

function getInitialMatch(breakpoint: Breakpoint) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia(getBreakpointQuery(breakpoint)).matches
}

export function useBreakpoint(breakpoint: Breakpoint) {
  const [matches, setMatches] = useState(() => getInitialMatch(breakpoint))

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setMatches(false)
      return
    }

    const mediaQuery = window.matchMedia(getBreakpointQuery(breakpoint))
    const syncMatch = (event?: MediaQueryListEvent) => {
      setMatches(event ? event.matches : mediaQuery.matches)
    }

    syncMatch()
    mediaQuery.addEventListener('change', syncMatch)

    return () => mediaQuery.removeEventListener('change', syncMatch)
  }, [breakpoint])

  return matches
}