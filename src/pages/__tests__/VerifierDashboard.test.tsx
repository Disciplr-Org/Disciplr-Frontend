import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import VerifierDashboard from '../VerifierDashboard';
import { useVerifierStore, type ValidationTask } from '../../Zustand/Store';
import { CRITICAL_DAYS_THRESHOLD } from '../../utils/verifierMetrics';

const mockPendingTasks: ValidationTask[] = [
  {
    id: 'task-1',
    vaultName: 'Alpha Vault',
    owner: '0x1111',
    amount: '10,000 USDC',
    deadline: '2026-05-02T12:00:00Z', // 1 day remaining (critical, <= CRITICAL_DAYS_THRESHOLD)
    status: 'pending',
    milestone: 'Milestone 1',
    criteria: ['Criteria 1'],
  },
  {
    id: 'task-2',
    vaultName: 'Beta Vault',
    owner: '0x2222',
    amount: '20,000 USDC',
    deadline: '2026-05-10T12:00:00Z', // 9 days remaining
    status: 'pending',
    milestone: 'Milestone 2',
    criteria: ['Criteria 2'],
  },
  {
    id: 'task-3',
    vaultName: 'Gamma Vault',
    owner: '0x3333',
    amount: '30,000 USDC',
    deadline: '2026-05-20T12:00:00Z', // 19 days remaining
    status: 'pending',
    milestone: 'Milestone 3',
    criteria: ['Criteria 3'],
  },
];

const mockHistoryTasks: ValidationTask[] = [
  {
    id: 'hist-1',
    vaultName: 'Delta Vault',
    owner: '0x4444',
    amount: '5,000 USDC',
    deadline: '2026-04-20T12:00:00Z',
    status: 'approved',
    milestone: 'Milestone 1',
    decidedAt: '2026-04-25T12:00:00Z',
  },
  {
    id: 'hist-2',
    vaultName: 'Epsilon Vault',
    owner: '0x5555',
    amount: '15,000 USDC',
    deadline: '2026-04-15T12:00:00Z',
    status: 'rejected',
    milestone: 'Milestone 2',
    decidedAt: '2026-04-18T12:00:00Z',
  },
];

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/verifier']}>
      <VerifierDashboard />
    </MemoryRouter>
  );
}

describe('VerifierDashboard page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T12:00:00Z'));
    useVerifierStore.setState({
      pendingValidations: [...mockPendingTasks],
      validationHistory: [...mockHistoryTasks],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders summary metrics reflecting seeded pending and history counts', () => {
    renderDashboard();

    const totalCard = screen.getByText('Total Assigned').closest('div')!;
    expect(within(totalCard).getByRole('heading', { level: 1 })).toHaveTextContent('5');

    const pendingCard = screen.getByText('Pending Validations').closest('div')!;
    expect(within(pendingCard).getByRole('heading', { level: 1 })).toHaveTextContent('3');

    const completedCard = screen.getByText('Completed').closest('div')!;
    expect(within(completedCard).getByRole('heading', { level: 1 })).toHaveTextContent('2');
  });

  it('has navigation links pointing to /verifier/queue and /verifier/history', () => {
    renderDashboard();

    const queueLink = screen.getByRole('link', { name: /view pending queue/i });
    expect(queueLink).toHaveAttribute('href', '/verifier/queue');

    const historyLink = screen.getByRole('link', { name: /view history/i });
    expect(historyLink).toHaveAttribute('href', '/verifier/history');
  });

  it('highlights critical pending tasks within the threshold', () => {
    renderDashboard();

    // task-1 is due tomorrow (1 day remaining <= CRITICAL_DAYS_THRESHOLD)
    expect(screen.getByText(/1 days left/i)).toBeInTheDocument();
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.getByText(/\(urgent\)/i)).toBeInTheDocument();

    const reviewLink = screen.getByRole('link', { name: /review alpha vault/i });
    expect(reviewLink).toHaveAttribute('href', '/verifier/queue/task-1');
  });

  it('renders empty state when pending validations queue is empty', () => {
    useVerifierStore.setState({
      pendingValidations: [],
      validationHistory: [...mockHistoryTasks],
    });

    renderDashboard();

    expect(screen.getByText('You have no pending validations at this time.')).toBeInTheDocument();
    const pendingCard = screen.getByText('Pending Validations').closest('div')!;
    expect(within(pendingCard).getByRole('heading', { level: 1 })).toHaveTextContent('0');
  });

  it('renders empty state when history is cleared and history count is 0', () => {
    useVerifierStore.setState({
      pendingValidations: [...mockPendingTasks],
      validationHistory: [],
    });

    renderDashboard();

    expect(screen.getByText('No recent decisions found.')).toBeInTheDocument();
    const completedCard = screen.getByText('Completed').closest('div')!;
    expect(within(completedCard).getByRole('heading', { level: 1 })).toHaveTextContent('0');
  });

  it('handles completely empty store gracefully', () => {
    useVerifierStore.setState({
      pendingValidations: [],
      validationHistory: [],
    });

    renderDashboard();

    expect(screen.getByText('You have no pending validations at this time.')).toBeInTheDocument();
    expect(screen.getByText('No recent decisions found.')).toBeInTheDocument();
  });
});
