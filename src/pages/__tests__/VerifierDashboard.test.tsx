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
    vi.mocked(useVerifierStore).mockReturnValue({
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
    expect(screen.getByText('Total Assigned')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    expect(screen.getByText('Pending Validations')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
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
    vi.mocked(useVerifierStore).mockReturnValue({
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
});
