import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ValidationHistory from '../ValidationHistory';
import { useVerifierStore } from '../../Zustand/Store';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../Zustand/Store', () => ({
  useVerifierStore: vi.fn(),
}));

const makeHistory = () => [
  {
    id: 'v-1',
    vaultName: 'Alpha Vault',
    owner: 'GALPHAOWNER',
    amount: '100 USDC',
    deadline: '2026-01-01',
    daysRemaining: 0,
    status: 'approved' as const,
    milestone: 'Launch',
    notes: 'Approved quickly.',
  },
  {
    id: 'v-2',
    vaultName: 'Beta Vault',
    owner: 'GBETAOWNER',
    amount: '200 USDC',
    deadline: '2026-01-02',
    daysRemaining: 0,
    status: 'rejected' as const,
    milestone: 'Audit',
    notes: 'Needs more evidence.',
  },
  {
    id: 'v-3',
    vaultName: 'Gamma Vault',
    owner: 'GGAMMAOWNER',
    amount: '300 USDC',
    deadline: '2026-01-03',
    daysRemaining: 0,
    status: 'approved' as const,
    milestone: 'Docs',
  },
  {
    id: 'v-4',
    vaultName: 'Delta Vault',
    owner: 'GDELTAOWNER',
    amount: '400 USDC',
    deadline: '2026-01-04',
    daysRemaining: 0,
    status: 'rejected' as const,
    milestone: 'Release',
  },
  {
    id: 'v-5',
    vaultName: 'Epsilon Vault',
    owner: 'GEPSOWNER',
    amount: '500 USDC',
    deadline: '2026-01-05',
    daysRemaining: 0,
    status: 'approved' as const,
    milestone: 'Wrap-up',
  },
  {
    id: 'v-6',
    vaultName: 'Zeta Vault',
    owner: 'GZETAOWNER',
    amount: '600 USDC',
    deadline: '2026-01-06',
    daysRemaining: 0,
    status: 'rejected' as const,
    milestone: 'Closeout',
  },
];

describe('ValidationHistory', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    (useVerifierStore as any).mockReturnValue({
      validationHistory: makeHistory(),
    });
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/verifier/history']}>
        <Routes>
          <Route path="/verifier/history" element={<ValidationHistory />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders history summary and the first page of results', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Validation History' })).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-5 of 6')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
    expect(screen.queryByText('Zeta Vault')).not.toBeInTheDocument();
  });

  it('filters by outcome and search text', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Rejected' }));
    expect(screen.getByText('Beta Vault')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Vault')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search vault or owner'), { target: { value: 'delta' } });
    expect(screen.getByText('Delta Vault')).toBeInTheDocument();
    expect(screen.queryByText('Beta Vault')).not.toBeInTheDocument();
  });

  it('paginates and resets when page size changes', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Zeta Vault')).toBeInTheDocument();
    expect(screen.getByText('Showing 6-6 of 6')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Page size'), { target: { value: '10' } });
    expect(screen.getByText('Showing 1-6 of 6')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
  });

  it('shows empty state when filters match nothing', () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Search vault or owner'), { target: { value: 'missing' } });

    expect(screen.getByRole('heading', { name: 'No Matching Validations' })).toBeInTheDocument();
    expect(screen.getByText(/Adjust the search text or outcome filter/i)).toBeInTheDocument();
  });

  it('returns the dashboard button to the verifier route', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Back to Dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/verifier');
  });
});
