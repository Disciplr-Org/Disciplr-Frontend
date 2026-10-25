import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PendingValidations from '../PendingValidations';
import { useVerifierStore } from '../../Zustand/Store';
import { ACCOUNT_A } from '@/__tests__/fixtures/stellarAddresses';

const walletState = vi.hoisted(() => ({
  status: 'connected' as string,
  isConnecting: false,
  isDemo: false,
  address: null as string | null,
  network: null as 'TESTNET' | 'PUBLIC' | null,
  connectDemo: vi.fn(),
}));

vi.mock('../../context/WalletContext', () => ({
  useWallet: () => walletState,
  useOptionalWallet: () => walletState,
}));

vi.mock('../../Zustand/Store', () => ({
  useVerifierStore: vi.fn(),
}));

const mockBatchApprove = vi.fn();
const mockBatchReject = vi.fn();

const tasks = [
  {
    id: 'v-101',
    vaultName: 'Guard Vault A',
    owner: '0xAAA',
    amount: '100 USDC',
    deadline: '2030-06-01',
    status: 'pending',
    milestone: 'Milestone A',
    evidenceUrl: 'https://example.com/a',
  },
  {
    id: 'v-102',
    vaultName: 'Guard Vault B',
    owner: '0xBBB',
    amount: '200 USDC',
    deadline: '2030-07-01',
    status: 'pending',
    milestone: 'Milestone B',
    evidenceUrl: 'https://example.com/b',
  },
];

function mockStore(state: Record<string, unknown>) {
  vi.mocked(useVerifierStore).mockImplementation(
    (selector: (s: unknown) => unknown) => selector(state),
  );
}

function renderQueue() {
  return render(
    <MemoryRouter initialEntries={['/verifier/queue']}>
      <PendingValidations />
    </MemoryRouter>,
  );
}

function selectVaultA() {
  fireEvent.click(screen.getByRole('checkbox', { name: /Select Guard Vault A/i }));
  fireEvent.click(screen.getByRole('button', { name: /Approve Selected/i }));
}

describe('PendingValidations write guard (network mismatch)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    walletState.address = ACCOUNT_A;
    walletState.network = 'TESTNET';
    walletState.status = 'connected';
    walletState.isConnecting = false;
    mockStore({
      pendingValidations: tasks,
      validationHistory: [],
      batchApprove: mockBatchApprove,
      batchReject: mockBatchReject,
    });
  });

  it('disables batch Approve/Reject with the guard reason while the wallet is on the wrong network', () => {
    walletState.network = 'PUBLIC';

    renderQueue();

    const approveButton = screen.getByRole('button', { name: /Approve Selected/i });
    const rejectButton = screen.getByRole('button', { name: /Reject Selected/i });
    expect(approveButton).toBeDisabled();
    expect(approveButton.getAttribute('aria-describedby')).toBe('batch-guard-reason');
    expect(rejectButton).toBeDisabled();

    const reason = document.getElementById('batch-guard-reason');
    expect(reason).toHaveTextContent(/wrong wallet network/i);

    // Forcing clicks on the disabled batch actions never opens the decision
    // modal and never reaches the batch services.
    fireEvent.click(approveButton);
    fireEvent.click(rejectButton);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockBatchApprove).not.toHaveBeenCalled();
    expect(mockBatchReject).not.toHaveBeenCalled();
  });

  it('re-checks the guard at submit time: a wallet that flips networks after the modal opens never reaches the batch service', () => {
    const { rerender } = renderQueue();

    fireEvent.click(screen.getByRole('checkbox', { name: /Select Guard Vault A/i }));
    fireEvent.click(screen.getByRole('button', { name: /Approve Selected/i }));
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: /Confirm Approve/i })).toBeInTheDocument();

    // Freighter switches to PUBLIC before the verifier confirms.
    walletState.network = 'PUBLIC';
    rerender(
      <MemoryRouter initialEntries={['/verifier/queue']}>
        <PendingValidations />
      </MemoryRouter>,
    );

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Confirm Approve/i }));

    expect(mockBatchApprove).not.toHaveBeenCalled();
    expect(mockBatchReject).not.toHaveBeenCalled();
    // The reason surfaces both in the sr-only description and in the error alert.
    expect(screen.getAllByText(/Wrong wallet network/i).length).toBeGreaterThan(0);
  });

  it('opens the batch modal normally when the network matches (guard passes)', () => {
    renderQueue();

    selectVaultA();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm Approve/i }));
    expect(mockBatchApprove).toHaveBeenCalledWith(['v-101'], '');
  });
});
