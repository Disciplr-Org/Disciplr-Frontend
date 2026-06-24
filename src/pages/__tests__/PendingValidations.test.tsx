import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PendingValidations from '../PendingValidations';
import { useVerifierStore, type ValidationTask } from '../../Zustand/Store';

vi.mock('focus-trap-react', () => ({
  default: ({
    children,
    focusTrapOptions,
  }: {
    children: React.ReactNode;
    focusTrapOptions?: { onDeactivate?: () => void };
  }) => (
    <div
      data-testid="focus-trap"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          focusTrapOptions?.onDeactivate?.();
        }
      }}
    >
      {children}
    </div>
  ),
}));

vi.mock('../../Zustand/Store', () => ({
  useVerifierStore: vi.fn(),
}));

const mockNavigate = vi.fn();
const mockApproveValidation = vi.fn();
const mockRejectValidation = vi.fn();
const mockBatchApprove = vi.fn();
const mockBatchReject = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const makeTasks = (): ValidationTask[] => [
  {
    id: 'v-1',
    vaultName: 'Alpha Vault',
    owner: '0xAAAA',
    amount: '10,000 USDC',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    daysRemaining: 10,
    status: 'pending' as const,
    milestone: 'Phase 1',
  },
  {
    id: 'v-2',
    vaultName: 'Beta Vault',
    owner: '0xBBBB',
    amount: '5,000 USDC',
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    daysRemaining: 2,
    status: 'pending' as const,
    milestone: 'Phase 2',
  },
  {
    id: 'v-3',
    vaultName: 'Gamma Vault',
    owner: '0xCCCC',
    amount: '20,000 USDC',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    daysRemaining: 20,
    status: 'pending' as const,
    milestone: 'Phase 3',
  },
];

function mockVerifierStore(pendingValidations: ValidationTask[] = makeTasks()) {
  vi.mocked(useVerifierStore).mockReturnValue({
    pendingValidations,
    validationHistory: [],
    approveValidation: mockApproveValidation,
    rejectValidation: mockRejectValidation,
    batchApprove: mockBatchApprove,
    batchReject: mockBatchReject,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PendingValidations />
    </MemoryRouter>
  );
}

describe('PendingValidations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifierStore();
  });

  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByText('Pending Validations')).toBeInTheDocument();
  });

  it('shows "All caught up!" when there are no pending validations', () => {
    mockVerifierStore([]);
    renderPage();
    expect(screen.getByText('All caught up!')).toBeInTheDocument();
    expect(screen.getByText(/no pending validations/i)).toBeInTheDocument();
  });

  it('does not render the table when queue is empty', () => {
    mockVerifierStore([]);
    renderPage();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders a row for each pending task', () => {
    renderPage();
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.getByText('Beta Vault')).toBeInTheDocument();
    expect(screen.getByText('Gamma Vault')).toBeInTheDocument();
  });

  it('default sort is ascending (most urgent first) and button shows "High to Low"', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /High to Low/i })).toBeInTheDocument();

    // ascending: v-2 (2 days) ??v-1 (10 days) ??v-3 (20 days)
    const vaultCells = screen.getAllByText(/Vault$/);
    expect(vaultCells[0].textContent).toBe('Beta Vault');
    expect(vaultCells[1].textContent).toBe('Alpha Vault');
    expect(vaultCells[2].textContent).toBe('Gamma Vault');
  });

  it('toggling sort reverses the order and button shows "Low to High"', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /High to Low/i }));

    expect(screen.getByRole('button', { name: /Low to High/i })).toBeInTheDocument();

    // descending: v-3 (20 days) ??v-1 (10 days) ??v-2 (2 days)
    const vaultCells = screen.getAllByText(/Vault$/);
    expect(vaultCells[0].textContent).toBe('Gamma Vault');
    expect(vaultCells[1].textContent).toBe('Alpha Vault');
    expect(vaultCells[2].textContent).toBe('Beta Vault');
  });

  it('toggling twice returns to original ascending order', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /High to Low/i }));
    fireEvent.click(screen.getByRole('button', { name: /Low to High/i }));

    expect(screen.getByRole('button', { name: /High to Low/i })).toBeInTheDocument();

    // back to ascending: v-2 ??v-1 ??v-3
    const vaultCells = screen.getAllByText(/Vault$/);
    expect(vaultCells[0].textContent).toBe('Beta Vault');
    expect(vaultCells[1].textContent).toBe('Alpha Vault');
    expect(vaultCells[2].textContent).toBe('Gamma Vault');
  });

  it('clicking Review navigates to the correct ValidationDetail route', () => {
    renderPage();
    const reviewButtons = screen.getAllByRole('button', { name: /Review/i });
    // first row after asc sort is v-2 (daysRemaining: 2)
    fireEvent.click(reviewButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/verifier/queue/v-2');
  });

  it('clicking Back navigates to /verifier', () => {
    renderPage();
    fireEvent.click(screen.getByText(/Back to Dashboard/i));
    expect(mockNavigate).toHaveBeenCalledWith('/verifier');
  });

  it('renders a single task without crashing', () => {
    mockVerifierStore([makeTasks()[0]]);
    renderPage();
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2); // header + 1 row
  });

  it('handles ties in daysRemaining (stable relative order preserved)', () => {
    mockVerifierStore([
      { ...makeTasks()[0], id: 'v-a', daysRemaining: 5 },
      { ...makeTasks()[1], id: 'v-b', daysRemaining: 5 },
    ]);
    renderPage();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('Alpha Vault')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Beta Vault')).toBeInTheDocument();
  });

  it('shows urgent deadline tone for tasks with fewer than 24 hours remaining', () => {
    renderPage();
    const betaRow = screen.getByRole('checkbox', { name: /Select Beta Vault/i }).closest('tr');
    expect(betaRow?.querySelector('[data-tone="urgent"]')).toBeInTheDocument();
  });

  it('shows normal deadline tone for tasks with more than 24 hours remaining', () => {
    renderPage();
    const alphaRow = screen.getByRole('checkbox', { name: /Select Alpha Vault/i }).closest('tr');
    expect(alphaRow?.querySelector('[data-tone="normal"]')).toBeInTheDocument();
  });

  it('disables batch actions until at least one validation is selected', () => {
    renderPage();
    expect(screen.getByText('0 validations selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Batch Approve/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Batch Reject/i })).toBeDisabled();
  });

  it('selects one validation and marks the header checkbox indeterminate', () => {
    renderPage();

    fireEvent.click(screen.getByRole('checkbox', { name: /Select Beta Vault/i }));

    const selectAll = screen.getByRole('checkbox', { name: /Select all pending validations/i }) as HTMLInputElement;
    expect(screen.getByText('1 validation selected')).toBeInTheDocument();
    expect(selectAll.checked).toBe(false);
    expect(selectAll.indeterminate).toBe(true);
    expect(screen.getByRole('button', { name: /Batch Approve/i })).toBeEnabled();
  });

  it('selects and clears all visible validations from the header checkbox', () => {
    renderPage();

    const selectAll = screen.getByRole('checkbox', { name: /Select all pending validations/i });
    fireEvent.click(selectAll);

    expect(screen.getByText('3 validations selected')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Select Alpha Vault/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Select Beta Vault/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Select Gamma Vault/i })).toBeChecked();

    fireEvent.click(selectAll);
    expect(screen.getByText('0 validations selected')).toBeInTheDocument();
  });

  it('confirms a batch approve with the selected validation ids', () => {
    renderPage();

    fireEvent.click(screen.getByRole('checkbox', { name: /Select Beta Vault/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Select Alpha Vault/i }));
    fireEvent.click(screen.getByRole('button', { name: /Batch Approve/i }));

    expect(screen.getByText('2 validations will be approved.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Confirm Approve/i }));

    expect(mockBatchApprove).toHaveBeenCalledWith(['v-2', 'v-1'], '');
    expect(mockBatchReject).not.toHaveBeenCalled();
  });

  it('confirms a batch reject with required notes', () => {
    renderPage();

    fireEvent.click(screen.getByRole('checkbox', { name: /Select Gamma Vault/i }));
    fireEvent.click(screen.getByRole('button', { name: /Batch Reject/i }));

    expect(screen.getByText('1 validation will be rejected.')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Reason for rejection is required/i), {
      target: { value: 'Evidence does not match the milestone scope.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Confirm Reject/i }));

    expect(mockBatchReject).toHaveBeenCalledWith(['v-3'], 'Evidence does not match the milestone scope.');
    expect(mockBatchApprove).not.toHaveBeenCalled();
  });
});
