import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import VerifierDashboard from '../VerifierDashboard';
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

const pendingTasks = [
  {
    id: 'v-1',
    vaultName: 'Alpha Vault',
    owner: '0xAAAA',
    amount: '10,000 USDC',
    deadline: '2026-07-01',
    daysRemaining: 10,
    status: 'pending' as const,
    milestone: 'Phase 1',
  },
  {
    id: 'v-2',
    vaultName: 'Beta Vault',
    owner: '0xBBBB',
    amount: '5,000 USDC',
    deadline: '2026-06-20',
    daysRemaining: 2,
    status: 'pending' as const,
    milestone: 'Phase 2',
  },
];

const historyTasks = [
  {
    id: 'h-1',
    vaultName: 'Gamma Vault',
    owner: '0xCCCC',
    amount: '20,000 USDC',
    deadline: '2026-05-01',
    daysRemaining: 0,
    status: 'approved' as const,
    milestone: 'Phase 3',
    notes: 'Looks good.',
    decidedAt: '2026-05-02',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <VerifierDashboard />
    </MemoryRouter>
  );
}

describe('VerifierDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useVerifierStore as any).mockReturnValue({
      pendingValidations: pendingTasks,
      validationHistory: historyTasks,
    });
  });

  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByText('Verifier Dashboard')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    renderPage();
    expect(screen.getByText(/Overview of your assigned vaults/)).toBeInTheDocument();
  });

  it('renders stat cards with correct values', () => {
    renderPage();

    const totalAssignedCard = screen.getByText('Total Assigned').parentElement;
    expect(totalAssignedCard).toHaveTextContent('3');

    const pendingCard = screen.getByText('Pending Validations').parentElement;
    expect(pendingCard).toHaveTextContent('2');

    const completedCard = screen.getByText('Completed').parentElement;
    expect(completedCard).toHaveTextContent('1');
  });

  it('renders View Pending Queue button that navigates to /verifier/queue', () => {
    renderPage();
    fireEvent.click(screen.getByText('View Pending Queue'));
    expect(mockNavigate).toHaveBeenCalledWith('/verifier/queue');
  });

  it('renders View History button that navigates to /verifier/history', () => {
    renderPage();
    fireEvent.click(screen.getByText('View History'));
    expect(mockNavigate).toHaveBeenCalledWith('/verifier/history');
  });

  it('shows empty message when no pending validations exist', () => {
    (useVerifierStore as any).mockReturnValue({
      pendingValidations: [],
      validationHistory: [],
    });
    renderPage();
    expect(screen.getByText(/no pending validations/i)).toBeInTheDocument();
  });

  it('renders urgent pending tasks', () => {
    renderPage();
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.getByText('Beta Vault')).toBeInTheDocument();
  });

  it('shows days remaining for each task', () => {
    renderPage();
    expect(screen.getByText('10 days left')).toBeInTheDocument();
    expect(screen.getByText('2 days left')).toBeInTheDocument();
  });

  it('applies danger color for tasks with 3 or fewer days remaining', () => {
    renderPage();
    const urgentText = screen.getByText('2 days left');
    expect(urgentText.getAttribute('style')).toContain('var(--danger)');
  });

  it('applies text color for tasks with more than 3 days remaining', () => {
    renderPage();
    const normalText = screen.getByText('10 days left');
    expect(normalText.getAttribute('style')).toContain('var(--text)');
  });

  it('navigates to task detail when Review Now is clicked', () => {
    renderPage();
    const reviewButtons = screen.getAllByText('Review Now →');
    fireEvent.click(reviewButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/verifier/queue/v-1');
  });

  it('uses design tokens for stat cards', () => {
    renderPage();
    const statLabels = ['Total Assigned', 'Pending Validations', 'Completed'];
    statLabels.forEach((label) => {
      const card = screen.getByText(label);
      expect(card.getAttribute('style')).toContain('var(--muted)');
    });
  });

  it('uses design tokens for action buttons', () => {
    renderPage();
    const queueBtn = screen.getByText('View Pending Queue');
    expect(queueBtn.getAttribute('style')).toContain('var(--accent)');
  });

  it('does not have hardcoded color classes on the primary container', () => {
    const { container } = renderPage();
    const primaryContainer = container.firstChild as HTMLElement;
    expect(primaryContainer.className).not.toContain('bg-white');
    expect(primaryContainer.className).not.toContain('text-gray-500');
    expect(primaryContainer.className).not.toContain('text-red-600');
  });

  describe('Recent Decisions feed', () => {
    it('renders the recent decisions section heading', () => {
      renderPage();
      expect(screen.getByText('Recent Decisions')).toBeInTheDocument();
    });

    it('renders recent decisions details correctly', () => {
      renderPage();
      expect(screen.getByText('Gamma Vault')).toBeInTheDocument();
      expect(screen.getByText('Milestone: Phase 3')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('2026-05-02')).toBeInTheDocument();
    });

    it('shows empty message when no history exists', () => {
      (useVerifierStore as any).mockReturnValue({
        pendingValidations: [],
        validationHistory: [],
      });
      renderPage();
      expect(screen.getByText('No recent decisions found.')).toBeInTheDocument();
    });

    it('navigates to history page when View in History is clicked', () => {
      renderPage();
      const viewHistoryBtn = screen.getByRole('button', { name: 'View in History →' });
      fireEvent.click(viewHistoryBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/verifier/history');
    });

    it('renders a maximum of 5 recent decisions', () => {
      const manyHistoryTasks = Array.from({ length: 8 }, (_, i) => ({
        id: `h-${i}`,
        vaultName: `Vault ${i}`,
        owner: '0xCCCC',
        amount: '20,000 USDC',
        deadline: '2026-05-01',
        daysRemaining: 0,
        status: i % 2 === 0 ? ('approved' as const) : ('rejected' as const),
        milestone: `Phase ${i}`,
        decidedAt: `2026-05-0${i + 1}`,
      }));

      (useVerifierStore as any).mockReturnValue({
        pendingValidations: [],
        validationHistory: manyHistoryTasks,
      });

      renderPage();

      // Should show the first 5 (Vault 0 to Vault 4)
      expect(screen.getByText('Vault 0')).toBeInTheDocument();
      expect(screen.getByText('Vault 4')).toBeInTheDocument();
      // Should not show Vault 5 to 7
      expect(screen.queryByText('Vault 5')).not.toBeInTheDocument();
      expect(screen.queryByText('Vault 7')).not.toBeInTheDocument();
    });
  });
});
