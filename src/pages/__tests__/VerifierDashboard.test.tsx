import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import VerifierDashboard from '../VerifierDashboard';
import { useVerifierStore } from '../../Zustand/Store';
import { expectNoVerifierHardcodedColorClasses } from './verifierColorClassAssertions';

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

const pendingValidations = [
  {
    id: 'v-urgent',
    vaultName: 'Urgent Vault',
    owner: 'GOWNERURGENT',
    amount: '1,000 USDC',
    deadline: '2026-06-25',
    daysRemaining: 2,
    status: 'pending' as const,
    milestone: 'Ship evidence',
  },
  {
    id: 'v-normal',
    vaultName: 'Steady Vault',
    owner: 'GOWNERNORMAL',
    amount: '2,000 USDC',
    deadline: '2026-07-10',
    daysRemaining: 8,
    status: 'pending' as const,
    milestone: 'Finalize milestone',
  },
];

function renderDashboard() {
  vi.mocked(useVerifierStore).mockReturnValue({
    pendingValidations,
    validationHistory: [
      {
        id: 'v-complete',
        vaultName: 'Complete Vault',
        owner: 'GOWNERDONE',
        amount: '3,000 USDC',
        deadline: '2026-06-20',
        daysRemaining: 0,
        status: 'approved',
        milestone: 'Launch',
      },
    ],
  } as ReturnType<typeof useVerifierStore>);

  return render(
    <MemoryRouter>
      <VerifierDashboard />
    </MemoryRouter>,
  );
}

describe('VerifierDashboard token colors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses design tokens for verifier surfaces and urgent cues', () => {
    renderDashboard();

    expectNoVerifierHardcodedColorClasses();
    expect(screen.getByText(/overview of your assigned vaults/i)).toHaveStyle({ color: 'var(--muted)' });
    expect(screen.getByText('Total Assigned').closest('div')).toHaveStyle({
      background: 'var(--surface)',
      borderColor: 'var(--border)',
    });
    expect(screen.getByText('Pending Validations').closest('div')).toHaveStyle({
      borderLeftColor: 'var(--accent)',
    });
    expect(screen.getByText('Completed').closest('div')).toHaveStyle({
      borderLeftColor: 'var(--success)',
    });
    expect(screen.getByText('Urgent: 2 days left')).toHaveStyle({ color: 'var(--danger)' });
    expect(screen.getByText('8 days left')).toHaveStyle({ color: 'var(--text)' });
    expect(screen.getByRole('button', { name: /view pending queue/i })).toHaveStyle({
      background: 'var(--accent)',
      color: 'var(--bg)',
    });
  });
});
