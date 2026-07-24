import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NotificationIcon from '../NotificationIcon'
import { getNotifications } from '../exampleNotification/example'
import { useNotification } from '@/Zustand/Store'

const motionDiv = vi.fn(
  ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="notification-dropdown" {...props}>
      {children}
    </div>
  ),
)

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: React.PropsWithChildren<Record<string, unknown>>) => motionDiv(props),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

function renderNotificationIcon() {
  return render(
    <MemoryRouter>
      <NotificationIcon />
    </MemoryRouter>,
  )
}

describe('NotificationIcon', () => {
  beforeEach(() => {
    motionDiv.mockClear()
    useNotification.setState({ notification: getNotifications() })
  })

  it('suppresses dropdown motion when reduced motion is preferred', () => {
    mockMatchMedia(true)
    renderNotificationIcon()

    fireEvent.click(screen.getByRole('button', { name: /toggle notifications/i }))

    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument()
    const latestProps = motionDiv.mock.calls.at(-1)?.[0]
    expect(latestProps?.transition).toEqual({ duration: 0 })
    expect(latestProps?.initial).toEqual({ opacity: 1, y: 0, scale: 1 })
    expect(latestProps?.exit).toEqual({ opacity: 1, y: 0, scale: 1 })
  })
})
