import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import MobileDrawer from '../MobileDrawer'

vi.mock('focus-trap-react', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="focus-trap">{children}</div>,
}))

vi.mock('../Wallet/WalletConnectButton', () => ({
  WalletConnectButton: () => <button type="button">Wallet</button>,
}))

function renderDrawer(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('MobileDrawer', () => {
  it('renders as a labelled modal dialog', () => {
    renderDrawer(<MobileDrawer isOpen onClose={vi.fn()} />)

    const dialog = screen.getByRole('dialog', { name: 'Navigation' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'mobile-drawer-title')
    expect(screen.getByTestId('focus-trap')).toBeInTheDocument()
  })

  it('closes with Escape', () => {
    const onClose = vi.fn()
    renderDrawer(<MobileDrawer isOpen onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('restores focus to the trigger when it closes', () => {
    const onClose = vi.fn()
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    const returnFocusRef = { current: trigger }

    const { rerender } = renderDrawer(
      <MobileDrawer isOpen onClose={onClose} returnFocusRef={returnFocusRef} />,
    )

    rerender(
      <MemoryRouter>
        <MobileDrawer isOpen={false} onClose={onClose} returnFocusRef={returnFocusRef} />
      </MemoryRouter>,
    )

    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('restores body overflow when unmounted', () => {
    document.body.style.overflow = 'auto'
    const { unmount } = renderDrawer(<MobileDrawer isOpen onClose={vi.fn()} />)

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('auto')
    document.body.style.overflow = ''
  })

  it('renders navigation targets and wallet action while open', () => {
    renderDrawer(<MobileDrawer isOpen onClose={vi.fn()} />)

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Transactions' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Analytics' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create Vault' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Wallet' })).toBeInTheDocument()
  })
})
