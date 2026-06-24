import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HTMLAttributes, ReactNode } from 'react';
import Notification from '../../pages/Notification';
import { useNotification } from '../../Zustand/Store';

type NotificationItem = ReturnType<typeof useNotification.getState>['notification'][number];
type MotionDivProps = HTMLAttributes<HTMLDivElement> & {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
};

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: MotionDivProps) => {
      const domProps = { ...props };
      delete domProps.initial;
      delete domProps.animate;
      delete domProps.exit;
      delete domProps.transition;

      return <div {...domProps}>{children}</div>;
    },
  },
}));

const fixtureNotifications: NotificationItem[] = [
  {
    id: 'ntf-test-1',
    type: 'vault_deadline_approaching',
    isUrgent: true,
    title: 'Unread Vault Deadline',
    message: 'The vault deadline is approaching soon.',
    timestamp: '2026-04-24T08:00:00Z',
    timeAgo: '2m ago',
    isRead: false,
    category: 'vault',
  },
  {
    id: 'ntf-test-2',
    type: 'funds_released',
    isUrgent: false,
    title: 'Read Funds Released',
    message: 'Funds were released for the completed milestone.',
    timestamp: '2026-04-24T07:45:00Z',
    timeAgo: '17m ago',
    isRead: true,
    category: 'funds',
  },
  {
    id: 'ntf-test-3',
    type: 'verification_requested',
    isUrgent: false,
    title: 'Unread Verification Request',
    message: 'A verifier requested milestone evidence.',
    timestamp: '2026-04-24T07:10:00Z',
    timeAgo: '52m ago',
    isRead: false,
    category: 'verification',
  },
  {
    id: 'ntf-test-4',
    type: 'milestone_validated',
    isUrgent: false,
    title: 'Unread Milestone Validated',
    message: 'A milestone was validated by the verifier.',
    timestamp: '2026-04-24T04:00:00Z',
    timeAgo: '4h ago',
    isRead: false,
    category: 'milestone',
  },
  {
    id: 'ntf-test-5',
    type: 'system_announcement',
    isUrgent: false,
    title: 'Read System Notice',
    message: 'System maintenance is scheduled later today.',
    timestamp: '2026-04-23T20:00:00Z',
    timeAgo: 'Yesterday',
    isRead: true,
    category: 'system',
  },
  {
    id: 'ntf-test-6',
    type: 'vault_created_successfully',
    isUrgent: false,
    title: 'Read Vault Created',
    message: 'A new vault was created successfully.',
    timestamp: '2026-04-22T16:45:00Z',
    timeAgo: '2 days ago',
    isRead: true,
    category: 'vault',
  },
];

function renderNotificationPage() {
  return render(
    <MemoryRouter>
      <div data-testid="outside-filter">Outside filter target</div>
      <Notification />
    </MemoryRouter>
  );
}

function openFilterPanel() {
  fireEvent.click(screen.getByRole('button', { name: /filter/i }));
  expect(screen.getByText(/filter by/i)).toBeInTheDocument();
  return screen.getAllByRole('combobox') as HTMLSelectElement[];
}

describe('Notification page', () => {
  beforeEach(() => {
    useNotification.setState({ notification: fixtureNotifications });
  });

  it('paginates notifications at five items per page', () => {
    renderNotificationPage();

    expect(screen.getByText('Unread Vault Deadline')).toBeInTheDocument();
    expect(screen.getByText('Read System Notice')).toBeInTheDocument();
    expect(screen.queryByText('Read Vault Created')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText('Read Vault Created')).toBeInTheDocument();
    expect(screen.queryByText('Unread Vault Deadline')).not.toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('filters notifications by read state and resets to the first page', async () => {
    renderNotificationPage();

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

    const [readFilter] = openFilterPanel();
    fireEvent.change(readFilter, { target: { value: '0' } });

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });
    expect(screen.getByText('Unread Vault Deadline')).toBeInTheDocument();
    expect(screen.getByText('Unread Verification Request')).toBeInTheDocument();
    expect(screen.getByText('Unread Milestone Validated')).toBeInTheDocument();
    expect(screen.queryByText('Read Funds Released')).not.toBeInTheDocument();
    expect(screen.queryByText('Read Vault Created')).not.toBeInTheDocument();
  });

  it('filters notifications by type and renders the empty result state', async () => {
    renderNotificationPage();

    const [readFilter, typeFilter] = openFilterPanel();
    fireEvent.change(typeFilter, { target: { value: 'funds' } });

    await waitFor(() => {
      expect(screen.getByText('Read Funds Released')).toBeInTheDocument();
    });
    expect(screen.queryByText('Unread Vault Deadline')).not.toBeInTheDocument();
    expect(screen.queryByText('Read Vault Created')).not.toBeInTheDocument();

    fireEvent.change(readFilter, { target: { value: '0' } });

    await waitFor(() => {
      expect(screen.getByText('No notifications found.')).toBeInTheDocument();
    });
    expect(screen.queryByText('Read Funds Released')).not.toBeInTheDocument();
  });

  it('keeps the filter panel open for inside clicks and closes it on outside mousedown', () => {
    renderNotificationPage();

    openFilterPanel();

    fireEvent.mouseDown(screen.getByText(/filter by/i));
    expect(screen.getByText(/filter by/i)).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside-filter'));

    expect(screen.queryByText(/filter by/i)).not.toBeInTheDocument();
  });
});
