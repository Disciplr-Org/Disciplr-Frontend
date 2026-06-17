import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PendingValidations from '../PendingValidations';
import { useVerifierStore } from '../../Zustand/Store';

vi.mock('../../Zustand/Store', () => ({
  useVerifierStore: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockTasks = [
  {
    id: 'v-medium',
    vaultName: 'Medium Priority Vault',
    owner: '0x2222...bbbb',
    amount: '2,500 USDC',
    deadline: '2026-06-10',
    daysRemaining: 8,
    status: 'pending' as const,
    milestone: 'Medium milestone',
  },
  {
    id: 'v-urgent',
    vaultName: 'Urgent Vault',
    owner: '0x1111...aaaa',
    amount: '9,000 USDC',
    deadline: '2026-06-03',
    daysRemaining: 1,
    status: 'pending' as const,
    milestone: 'Urgent milestone',
  },
  {
    id: 'v-later',
    vaultName: 'Later Vault',
    owner: '0x3333...cccc',
    amount: '750 USDC',
    deadline: '2026-06-22',
    daysRemaining: 20,
    status: 'pending' as const,
    milestone: 'Later milestone',
  },
];

function mockPendingValidations(pendingValidations = mockTasks) {
  vi.mocked(useVerifierStore).mockReturnValue({
    pendingValidations,
    validationHistory: [],
    approveValidation: vi.fn(),
    rejectValidation: vi.fn(),
  });
}

function renderedVaultOrder() {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent);
}

describe('PendingValidations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPendingValidations();
  });

  it('renders pending validations sorted by highest urgency first', () => {
    render(<PendingValidations />);

    expect(screen.getByRole('heading', { name: 'Pending Validations' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort by Urgency: High to Low' })).toBeInTheDocument();
    expect(renderedVaultOrder()).toEqual([
      'Urgent VaultUrgent milestone',
      'Medium Priority VaultMedium milestone',
      'Later VaultLater milestone',
    ]);
  });

  it('toggles to low-to-high sorting and back again', () => {
    render(<PendingValidations />);

    const sortButton = screen.getByRole('button', { name: 'Sort by Urgency: High to Low' });
    fireEvent.click(sortButton);

    expect(screen.getByRole('button', { name: 'Sort by Urgency: Low to High' })).toBeInTheDocument();
    expect(renderedVaultOrder()).toEqual([
      'Later VaultLater milestone',
      'Medium Priority VaultMedium milestone',
      'Urgent VaultUrgent milestone',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Urgency: Low to High' }));

    expect(screen.getByRole('button', { name: 'Sort by Urgency: High to Low' })).toBeInTheDocument();
    expect(renderedVaultOrder()).toEqual([
      'Urgent VaultUrgent milestone',
      'Medium Priority VaultMedium milestone',
      'Later VaultLater milestone',
    ]);
  });

  it('renders the empty queue state', () => {
    mockPendingValidations([]);

    render(<PendingValidations />);

    expect(screen.getByText('All caught up!')).toBeInTheDocument();
    expect(screen.getByText('There are no pending validations in your queue.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('navigates back to the verifier dashboard', () => {
    render(<PendingValidations />);

    fireEvent.click(screen.getByRole('button', { name: /Back to Dashboard/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/verifier');
  });

  it('navigates to the selected validation detail route', () => {
    render(<PendingValidations />);

    const urgentRow = screen.getByText('Urgent Vault').closest('tr') as HTMLElement;
    fireEvent.click(within(urgentRow).getByRole('button', { name: 'Review' }));

    expect(mockNavigate).toHaveBeenCalledWith('/verifier/queue/v-urgent');
  });
});
