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

const initialNotifications = getNotifications()

function resetStore() {
  useNotification.setState({
    notification: initialNotifications,
    unreadCount: initialNotifications.filter((n) => !n.isRead).length,
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
    resetStore()
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

  describe("unread badge math", () => {
    it("displays correct unread count equal to items with isRead === false", () => {
      renderNotificationIcon();

      const unreadCount = initialNotifications.filter((n) => !n.isRead).length;
      const badge = screen.getByText(unreadCount.toString());
      expect(badge).toBeInTheDocument();
    });

    it("shows badge with 0 when all notifications are read", () => {
      useNotification.setState({
        notification: initialNotifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      });

      renderNotificationIcon();

      const badge = screen.getByText("0");
      expect(badge).toBeInTheDocument();
    });

    it("shows no badge when notification store is empty", () => {
      useNotification.setState({
        notification: [],
        unreadCount: 0,
      });

      renderNotificationIcon();

      const badge = screen.queryByText(/\d+/);
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe("recent notifications slicing", () => {
    it("displays only the five most recent notifications in dropdown", () => {
      const { container } = renderNotificationIcon();

      // Click to open dropdown - the clickable div is the parent of the SVG
      const bellIcon = container.querySelector(".relative.inline-block > div");
      expect(bellIcon).toBeInTheDocument();
      fireEvent.click(bellIcon!);

      // The dropdown should show at most 5 notifications - count by title elements
      const recentFive = initialNotifications.slice(0, 5);
      recentFive.forEach((notif) => {
        expect(screen.getByText(notif.title)).toBeInTheDocument();
      });

      // The 6th notification should not be in the dropdown
      expect(screen.queryByText(initialNotifications[5].title)).not.toBeInTheDocument();
    });

    it("displays fewer than five notifications when store has less than five items", () => {
      const threeNotifications = initialNotifications.slice(0, 3);
      useNotification.setState({
        notification: threeNotifications,
        unreadCount: threeNotifications.filter((n) => !n.isRead).length,
      });

      const { container } = renderNotificationIcon();

      const bellIcon = container.querySelector(".relative.inline-block > div");
      expect(bellIcon).toBeInTheDocument();
      fireEvent.click(bellIcon!);

      // All 3 notifications should be displayed
      threeNotifications.forEach((notif) => {
        expect(screen.getByText(notif.title)).toBeInTheDocument();
      });
    });

    it("displays no notifications when store is empty", () => {
      useNotification.setState({
        notification: [],
        unreadCount: 0,
      });

      const { container } = renderNotificationIcon();

      const bellIcon = container.querySelector(".relative.inline-block > div");
      expect(bellIcon).toBeInTheDocument();
      fireEvent.click(bellIcon!);

      // No notification titles should be present
      expect(screen.queryByText(initialNotifications[0].title)).not.toBeInTheDocument();
    });
  });

  describe("markAllAsRead action", () => {
    it("sets isRead: true on all items and zeroes unread count", () => {
      const { container } = renderNotificationIcon();

      const bellIcon = container.querySelector(".relative.inline-block > div");
      fireEvent.click(bellIcon!);

      const markAllButton = screen.getByText("Mark All As Read");
      fireEvent.click(markAllButton);

      const state = useNotification.getState();
      expect(state.notification.every((n) => n.isRead)).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it("creates a new array without mutating the original", () => {
      const before = useNotification.getState().notification;

      const { container } = renderNotificationIcon();

      const bellIcon = container.querySelector(".relative.inline-block > div");
      fireEvent.click(bellIcon!);

      const markAllButton = screen.getByText("Mark All As Read");
      fireEvent.click(markAllButton);

      const after = useNotification.getState().notification;
      expect(before).not.toBe(after);
    });

    it("is idempotent - calling on all-read list keeps unread count at 0", () => {
      useNotification.setState({
        notification: initialNotifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      });

      const { container } = renderNotificationIcon();

      const bellIcon = container.querySelector(".relative.inline-block > div");
      fireEvent.click(bellIcon!);

      const markAllButton = screen.getByText("Mark All As Read");
      fireEvent.click(markAllButton);
      fireEvent.click(markAllButton);

      const state = useNotification.getState();
      expect(state.unreadCount).toBe(0);
      expect(state.notification.every((n) => n.isRead)).toBe(true);
    });

    it("handles empty notification list", () => {
      useNotification.setState({
        notification: [],
        unreadCount: 0,
      });

      const { container } = renderNotificationIcon();

      const bellIcon = container.querySelector(".relative.inline-block > div");
      fireEvent.click(bellIcon!);

      const markAllButton = screen.getByText("Mark All As Read");
      fireEvent.click(markAllButton);

      const state = useNotification.getState();
      expect(state.notification).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe("bell icon state", () => {
    it("shows CiBellOn when there are unread notifications", () => {
      const { container } = renderNotificationIcon();

      const unreadCount = initialNotifications.filter((n) => !n.isRead).length;
      if (unreadCount > 0) {
        const bellIcon = container.querySelector(".relative.inline-block > div");
        expect(bellIcon).toBeInTheDocument();
      }
    });

    it("shows CiBellOff when all notifications are read", () => {
      useNotification.setState({
        notification: initialNotifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      });

      const { container } = renderNotificationIcon();

      const bellIcon = container.querySelector(".relative.inline-block > div");
      expect(bellIcon).toBeInTheDocument();
    });

    it("switches from CiBellOn to CiBellOff after marking all as read", () => {
      const { container } = renderNotificationIcon();

      const bellIcon = container.querySelector(".relative.inline-block > div");
      fireEvent.click(bellIcon!);

      const markAllButton = screen.getByText("Mark All As Read");
      fireEvent.click(markAllButton);

      const state = useNotification.getState();
      expect(state.unreadCount).toBe(0);
      expect(state.notification.every((n) => n.isRead)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles empty store gracefully", () => {
      useNotification.setState({
        notification: [],
        unreadCount: 0,
      });

      const { container } = renderNotificationIcon();

      const bellIcon = container.querySelector(".relative.inline-block > div");
      expect(bellIcon).toBeInTheDocument();

      fireEvent.click(bellIcon!);

      const badge = screen.queryByText(/\d+/);
      expect(badge).not.toBeInTheDocument();
    });

    it("handles all-read store", () => {
      useNotification.setState({
        notification: initialNotifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      });

      renderNotificationIcon();

      const badge = screen.getByText("0");
      expect(badge).toBeInTheDocument();
    });

    it("handles store with fewer than five notifications", () => {
      const twoNotifications = initialNotifications.slice(0, 2);
      useNotification.setState({
        notification: twoNotifications,
        unreadCount: twoNotifications.filter((n) => !n.isRead).length,
      });

      const { container } = renderNotificationIcon();

      const bellIcon = container.querySelector(".relative.inline-block > div");
      fireEvent.click(bellIcon!);

      // Both notifications should be displayed
      twoNotifications.forEach((notif) => {
        expect(screen.getByText(notif.title)).toBeInTheDocument();
      });

      // The 3rd notification should not be displayed
      expect(screen.queryByText(initialNotifications[2].title)).not.toBeInTheDocument();
    });
  });
})
