import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Layout, { isValidPathname } from '../Layout'
import {
  registerNavigationGuard,
  resetNavigationGuards,
  hasActiveNavigationGuard,
} from '../../utils/navigationGuard'

vi.mock('../MobileDrawer', () => ({ default: () => null }))
vi.mock('../Wallet/WalletConnectButton', () => ({ WalletConnectButton: () => null }))
vi.mock('../TrustlineBanner', () => ({ TrustlineBanner: () => null }))
vi.mock('../Notification/NotificationBell', () => ({ default: () => null }))
vi.mock('../ShortcutsHelp', () => ({ ShortcutsHelp: () => null }))
vi.mock('../ToastViewport', () => ({ ToastViewport: () => null }))
vi.mock('../ThemeToggle', () => ({ default: () => null }))
vi.mock('../CommandPalette', () => ({ default: () => null }))
vi.mock('../../utils/useBreakpoint', () => ({ useBreakpoint: () => false }))

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  resetNavigationGuards()
})

afterEach(() => {
  resetNavigationGuards()
  vi.restoreAllMocks()
})

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="current-location">{location.pathname}</div>
}

function renderLayout(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Layout>
        <LocationDisplay />
        <Routes>
          <Route path="/" element={<h1>Home page</h1>} />
          <Route path="/vaults" element={<h1>Vaults page</h1>} />
          <Route path="/dashboard" element={<h1>Dashboard page</h1>} />
          <Route path="*" element={<h1>Not found</h1>} />
        </Routes>
      </Layout>
    </MemoryRouter>,
  )
}

describe('Layout navigation guard', () => {
  it('navigates immediately when no guard is registered', async () => {
    const user = userEvent.setup()
    renderLayout('/')

    expect(screen.getByTestId('current-location')).toHaveTextContent('/')
    expect(hasActiveNavigationGuard()).toBe(false)

    const vaultsLink = screen.getByRole('link', { name: 'Vaults' })
    await user.click(vaultsLink)

    expect(screen.getByTestId('current-location')).toHaveTextContent('/vaults')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vaults page')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('prompts for confirmation when a guard is registered: cancel stays, confirm navigates', async () => {
    const user = userEvent.setup()
    renderLayout('/')

    registerNavigationGuard()
    expect(hasActiveNavigationGuard()).toBe(true)

    const vaultsLink = screen.getByRole('link', { name: 'Vaults' })
    await user.click(vaultsLink)

    // Confirmation dialog should appear and location should remain on current route
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Leave this page?')).toBeInTheDocument()
    expect(screen.getByTestId('current-location')).toHaveTextContent('/')

    // Choose Cancel (stay on current page)
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('current-location')).toHaveTextContent('/')

    // Click link again and confirm leave
    await user.click(vaultsLink)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const leaveButton = screen.getByRole('button', { name: 'Leave page' })
    await user.click(leaveButton)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('current-location')).toHaveTextContent('/vaults')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vaults page')
  })

  it('restores immediate navigation after unregistering the guard', async () => {
    const user = userEvent.setup()
    renderLayout('/')

    const unregister = registerNavigationGuard()
    expect(hasActiveNavigationGuard()).toBe(true)

    // Unregister guard
    unregister()
    expect(hasActiveNavigationGuard()).toBe(false)

    const vaultsLink = screen.getByRole('link', { name: 'Vaults' })
    await user.click(vaultsLink)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('current-location')).toHaveTextContent('/vaults')
  })

  describe('isValidPathname validation', () => {
    it('accepts valid pathname values and rejects invalid or non-string values', () => {
      // Valid paths
      expect(isValidPathname('/')).toBe(true)
      expect(isValidPathname('/vaults')).toBe(true)
      expect(isValidPathname('/dashboard/settings')).toBe(true)

      // Invalid paths
      expect(isValidPathname('')).toBe(false)
      expect(isValidPathname('vaults')).toBe(false)
      expect(isValidPathname('https://example.com')).toBe(false)
      expect(isValidPathname('#main-content')).toBe(false)
      expect(isValidPathname(null)).toBe(false)
      expect(isValidPathname(undefined)).toBe(false)
      expect(isValidPathname(123)).toBe(false)
      expect(isValidPathname({})).toBe(false)
      expect(isValidPathname([])).toBe(false)
    })

    it('does not trigger navigation guard when clicking anchors with non-pathname hrefs', async () => {
      const user = userEvent.setup()
      renderLayout('/')

      registerNavigationGuard()

      // Skip link points to #main-content
      const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
      await user.click(skipLink)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByTestId('current-location')).toHaveTextContent('/')
    })
  })
})
