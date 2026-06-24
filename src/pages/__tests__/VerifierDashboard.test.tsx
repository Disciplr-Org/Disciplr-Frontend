import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VerifierDashboard from '../VerifierDashboard';
import { useVerifierStore, type ValidationTask } from '../../Zustand/Store';

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../Zustand/Store', () => ({
  useVerifierStore: vi.fn(),
}));

function makeTask(overrides: Partial<ValidationTask> = {}): ValidationTask {
  return {
    id: 'validation-1',
    vaultName: 'Alpha Vault',
    owner: '0xowner',
    amount: '1,000 USDC',
    deadline: '2026-07-01',
    daysRemaining: 3,
    status: 'pending',
    milestone: 'Ship milestone',
    evidenceUrl: 'https://example.com/evidence',
    ...overrides,
  };
}

function mockStore({
  pendingValidations,
  validationHistory,
}: {
  pendingValidations: ValidationTask[];
  validationHistory: ValidationTask[];
}) {
  vi.mocked(useVerifierStore).mockReturnValue({
    pendingValidations,
    validationHistory,
  } as ReturnType<typeof useVerifierStore>);
}

describe('VerifierDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders derived assigned, pending, and completed counts from the verifier store', () => {
    mockStore({
      pendingValidations: [
        makeTask({ id: 'validation-1' }),
        makeTask({ id: 'validation-2' }),
        makeTask({ id: 'validation-3' }),
      ],
      validationHistory: [
        makeTask({ id: 'history-1', status: 'approved' }),
        makeTask({ id: 'history-2', status: 'rejected' }),
      ],
    });

    render(<VerifierDashboard />);

    expect(screen.getByText('Total Assigned').nextElementSibling).toHaveTextContent('5');
    expect(screen.getByText('Pending Validations').nextElementSibling).toHaveTextContent('3');
    expect(screen.getByText('Completed').nextElementSibling).toHaveTextContent('2');
  });

  it('shows only the first three pending validations in the urgent list', () => {
    mockStore({
      pendingValidations: [
        makeTask({ id: 'validation-1', vaultName: 'Vault One' }),
        makeTask({ id: 'validation-2', vaultName: 'Vault Two' }),
        makeTask({ id: 'validation-3', vaultName: 'Vault Three' }),
        makeTask({ id: 'validation-4', vaultName: 'Vault Four' }),
      ],
      validationHistory: [],
    });

    render(<VerifierDashboard />);

    expect(screen.getByText('Vault One')).toBeInTheDocument();
    expect(screen.getByText('Vault Two')).toBeInTheDocument();
    expect(screen.getByText('Vault Three')).toBeInTheDocument();
    expect(screen.queryByText('Vault Four')).not.toBeInTheDocument();
  });

  it('applies the urgent red class at three days left but not at four days', () => {
    mockStore({
      pendingValidations: [
        makeTask({ id: 'urgent', vaultName: 'Urgent Vault', daysRemaining: 3 }),
        makeTask({ id: 'soon', vaultName: 'Soon Vault', daysRemaining: 4 }),
      ],
      validationHistory: [],
    });

    render(<VerifierDashboard />);

    expect(screen.getByText('3 days left')).toHaveClass('text-red-600');
    expect(screen.getByText('4 days left')).toHaveClass('text-gray-700');
    expect(screen.getByText('4 days left')).not.toHaveClass('text-red-600');
  });

  it('navigates to the queue, history, and selected validation detail routes', () => {
    mockStore({
      pendingValidations: [makeTask({ id: 'validation-42', vaultName: 'Review Target' })],
      validationHistory: [makeTask({ id: 'history-1', status: 'approved' })],
    });

    render(<VerifierDashboard />);

    fireEvent.click(screen.getByRole('button', { name: /view pending queue/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/verifier/queue');

    fireEvent.click(screen.getByRole('button', { name: /view history/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/verifier/history');

    fireEvent.click(screen.getByRole('button', { name: /review now/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/verifier/queue/validation-42');
  });

  it('renders the empty pending state when there are no pending validations', () => {
    mockStore({
      pendingValidations: [],
      validationHistory: [makeTask({ id: 'history-1', status: 'approved' })],
    });

    render(<VerifierDashboard />);

    expect(screen.getByText('You have no pending validations at this time.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /review now/i })).not.toBeInTheDocument();
    expect(screen.getByText('Total Assigned').nextElementSibling).toHaveTextContent('1');
    expect(screen.getByText('Pending Validations').nextElementSibling).toHaveTextContent('0');
  });
});
