import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VerifierDashboard from '../VerifierDashboard';
import { useVerifierStore } from '../../Zustand/Store';

const mockNavigate = vi.fn();

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

const pendingValidations = [
  {
    id: 'v-101',
    vaultName: 'Q3 Development Fund',
    owner: '0x1234...abcd',
    amount: '50,000 USDC',
    deadline: '2026-05-15',
    daysRemaining: 16,
    status: 'pending',
    milestone: 'Beta Release Deployment',
  },
  {
    id: 'v-102',
    vaultName: 'Community Grant #42',
    owner: '0x8888...9999',
    amount: '10,000 USDC',
    deadline: '2026-05-02',
    daysRemaining: 3,
    status: 'pending',
    milestone: 'Design System Figma Delivery',
  },
];

const validationHistory = [
  {
    id: 'v-099',
    vaultName: 'Audit Bounty',
    owner: '0x7777...4444',
    amount: '5,000 USDC',
    deadline: '2026-04-10',
    daysRemaining: 0,
    status: 'approved',
    milestone: 'Smart Contract Security Audit',
  },
];

describe('VerifierDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useVerifierStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      pendingValidations,
      validationHistory,
    });
  });

  it('renders verifier stats and urgent pending validations', () => {
    render(
      <MemoryRouter>
        <VerifierDashboard />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Verifier Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Total Assigned')).toBeInTheDocument();
    expect(screen.getByText('Pending Validations')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Q3 Development Fund')).toBeInTheDocument();
    expect(screen.getByText('Community Grant #42')).toBeInTheDocument();
  });

  it('navigates to the verifier queue, history, and task detail pages', () => {
    render(
      <MemoryRouter>
        <VerifierDashboard />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'View Pending Queue' }));
    fireEvent.click(screen.getByRole('button', { name: 'View History' }));
    fireEvent.click(screen.getAllByRole('button', { name: /Review Now/i })[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/verifier/queue');
    expect(mockNavigate).toHaveBeenCalledWith('/verifier/history');
    expect(mockNavigate).toHaveBeenCalledWith('/verifier/queue/v-101');
  });

  it('keeps hardcoded Tailwind color utilities out of the dashboard markup', () => {
    const source = readFileSync(join(process.cwd(), 'src/pages/VerifierDashboard.tsx'), 'utf8');

    expect(source).not.toMatch(/\b(?:bg|text|border|hover:bg|hover:text)-(?:gray|blue|green|red)-\d{2,3}\b/);
    expect(source).toContain("import './VerifierPages.css'");
  });
});
