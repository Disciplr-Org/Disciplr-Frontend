import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ValidationDetail from '../ValidationDetail';
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

// Mock focus-trap-react as it can be tricky in jsdom
vi.mock('focus-trap-react', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../Zustand/Store', () => ({
  useVerifierStore: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ vaultId: 'v-101' }),
  };
});

const mockApproveValidation = vi.fn();
const mockRejectValidation = vi.fn();

const task = {
  id: 'v-101',
  vaultName: 'Guard Vault',
  owner: '0x123',
  amount: '100 USDC',
  deadline: '2030-06-01',
  status: 'pending',
  milestone: 'Guard Milestone',
  evidenceUrl: 'https://example.com/evidence',
};

function mockStore(state: Record<string, unknown>) {
  vi.mocked(useVerifierStore).mockImplementation(
    (selector: (s: unknown) => unknown) => selector(state),
  );
}

function renderPage(vaultId = 'v-101') {
  return render(
    <MemoryRouter initialEntries={[`/verifier/queue/${vaultId}`]}>
      <ValidationDetail />
    </MemoryRouter>,
  );
}

describe('ValidationDetail write guard (network mismatch)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    walletState.address = ACCOUNT_A;
    walletState.network = 'TESTNET';
    walletState.status = 'connected';
    walletState.isConnecting = false;
    mockStore({
      pendingValidations: [task],
      approveValidation: mockApproveValidation,
      rejectValidation: mockRejectValidation,
    });
  });

  it('disables Approve and Reject with the guard reason while the wallet is on the wrong network', () => {
    walletState.network = 'PUBLIC';

    renderPage();

    const approveButton = screen.getByRole('button', { name: /Approve Milestone/i });
    const rejectButton = screen.getByRole('button', { name: /Reject Milestone/i });
    expect(approveButton).toBeDisabled();
    expect(approveButton.getAttribute('aria-describedby')).toBe('write-guard-reason');
    expect(rejectButton).toBeDisabled();

    // The reason itself is available to assistive tech (screen-reader text).
    const reason = document.getElementById('write-guard-reason');
    expect(reason).toHaveTextContent(/wrong wallet network/i);
    expect(reason).toHaveTextContent(/Mainnet/);
    expect(reason).toHaveTextContent(/Testnet/);

    // Firing the (disabled) button can never open the decision modal.
    fireEvent.click(approveButton);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockApproveValidation).not.toHaveBeenCalled();
  });

  it('re-checks the guard at submit time: a wallet that flips networks after the modal opens never reaches the decision store', () => {
    const { rerender } = renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Approve Milestone/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: /Confirm Approve/i })).not.toBeDisabled();

    // Freighter switches to PUBLIC while the verifier is mid-review.
    walletState.network = 'PUBLIC';
    rerender(
      <MemoryRouter initialEntries={['/verifier/queue/v-101']}>
        <ValidationDetail />
      </MemoryRouter>,
    );

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Confirm Approve/i }));

    expect(mockApproveValidation).not.toHaveBeenCalled();
    // The reason surfaces both in the sr-only description and in the error alert.
    expect(screen.getAllByText(/Wrong wallet network/i).length).toBeGreaterThan(0);
  });
});
