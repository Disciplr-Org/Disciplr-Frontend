import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValidationTask } from '../../Zustand/Store';
import { useVerifierStore } from '../../Zustand/Store';
import ValidationHistory from '../ValidationHistory';

const { mockDownloadCsv } = vi.hoisted(() => ({
  mockDownloadCsv: vi.fn(),
}));

vi.mock('../../utils/csv', async () => {
  const actual = await vi.importActual('../../utils/csv');
  return { ...actual, downloadCsv: mockDownloadCsv };
});

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

const baseHistory: ValidationTask[] = [
  {
    id: 'v-001',
    vaultName: 'Alpha Vault',
    owner: 'GOWNERALPHA',
    amount: '1,000 USDC',
    deadline: '2026-01-01',
    daysRemaining: 0,
    status: 'approved',
    milestone: 'Launch',
    notes: 'Approved launch evidence.',
  },
  {
    id: 'v-002',
    vaultName: 'Beta Reserve',
    owner: 'GOWNERBETA',
    amount: '2,000 USDC',
    deadline: '2026-01-02',
    daysRemaining: 0,
    status: 'rejected',
    milestone: 'Audit',
    notes: 'Missing audit proof.',
  },
  {
    id: 'v-003',
    vaultName: 'Gamma Fund',
    owner: 'GOWNERGAMMA',
    amount: '3,000 USDC',
    deadline: '2026-01-03',
    daysRemaining: 0,
    status: 'approved',
    milestone: 'Delivery',
  },
  {
    id: 'v-004',
    vaultName: 'Delta Grant',
    owner: 'GOWNERDELTA',
    amount: '4,000 USDC',
    deadline: '2026-01-04',
    daysRemaining: 0,
    status: 'rejected',
    milestone: 'Design',
  },
  {
    id: 'v-005',
    vaultName: 'Epsilon Pool',
    owner: 'GOWNEREPSILON',
    amount: '5,000 USDC',
    deadline: '2026-01-05',
    daysRemaining: 0,
    status: 'approved',
    milestone: 'Docs',
  },
  {
    id: 'v-006',
    vaultName: 'Zeta Treasury',
    owner: 'GOWNERZETA',
    amount: '6,000 USDC',
    deadline: '2026-01-06',
    daysRemaining: 0,
    status: 'approved',
    milestone: 'Payout',
  },
];

function renderHistory(history = baseHistory) {
  vi.mocked(useVerifierStore).mockReturnValue({
    validationHistory: history,
  } as ReturnType<typeof useVerifierStore>);

  return render(<ValidationHistory />);
}

describe('ValidationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders summary stats and first page of validation history', () => {
    renderHistory();

    expect(screen.getByRole('heading', { name: 'Validation History' })).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();

    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.getByText('Epsilon Pool')).toBeInTheDocument();
    expect(screen.queryByText('Zeta Treasury')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('filters by rejected status', () => {
    renderHistory();

    fireEvent.change(screen.getByLabelText('Filter validation history by outcome'), {
      target: { value: 'rejected' },
    });

    expect(screen.getByText('Beta Reserve')).toBeInTheDocument();
    expect(screen.getByText('Delta Grant')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Vault')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 2 matching validations.')).toBeInTheDocument();
  });

  it('searches vault names and owners', () => {
    renderHistory();

    fireEvent.change(screen.getByLabelText('Search validation history by vault or owner'), {
      target: { value: 'gamma' },
    });

    expect(screen.getByText('Gamma Fund')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Vault')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search validation history by vault or owner'), {
      target: { value: 'GOWNERBETA' },
    });

    expect(screen.getByText('Beta Reserve')).toBeInTheDocument();
    expect(screen.queryByText('Gamma Fund')).not.toBeInTheDocument();
  });

  it('paginates results with accessible controls', () => {
    renderHistory();

    const nav = screen.getByRole('navigation', { name: 'Validation history pagination' });
    const previous = within(nav).getByRole('button', { name: 'Go to previous validation history page' });
    const next = within(nav).getByRole('button', { name: 'Go to next validation history page' });

    expect(previous).toBeDisabled();
    expect(next).not.toBeDisabled();

    fireEvent.click(next);

    expect(screen.getByText('Zeta Treasury')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Vault')).not.toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(next).toBeDisabled();
    expect(previous).not.toBeDisabled();
  });

  it('updates page size and shows no-match empty state', () => {
    renderHistory();

    fireEvent.change(screen.getByLabelText('Validation history page size'), {
      target: { value: '10' },
    });

    expect(screen.getByText('Zeta Treasury')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search validation history by vault or owner'), {
      target: { value: 'nothing matches' },
    });

    expect(screen.getByText('No matching validations')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Validation history pagination' })).not.toBeInTheDocument();
  });

  it('navigates back to the verifier dashboard', () => {
    renderHistory();

    fireEvent.click(screen.getByRole('button', { name: /back to dashboard/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/verifier');
  });

  describe('date range filters', () => {
    it('filters to only items on or after the from date', () => {
      renderHistory();

      fireEvent.change(screen.getByLabelText('Filter validation history from date'), {
        target: { value: '2026-01-05' },
      });

      expect(screen.getByText('Epsilon Pool')).toBeInTheDocument();
      expect(screen.getByText('Zeta Treasury')).toBeInTheDocument();
      expect(screen.queryByText('Alpha Vault')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 2 of 2 matching validations.')).toBeInTheDocument();
    });

    it('filters to only items on or before the to date', () => {
      renderHistory();

      fireEvent.change(screen.getByLabelText('Filter validation history to date'), {
        target: { value: '2026-01-01' },
      });

      expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
      expect(screen.queryByText('Beta Reserve')).not.toBeInTheDocument();
    });

    it('shows no-match state when date range excludes all items', () => {
      renderHistory();

      fireEvent.change(screen.getByLabelText('Filter validation history from date'), {
        target: { value: '2030-01-01' },
      });

      expect(screen.getByText('No matching validations')).toBeInTheDocument();
    });

    it('resets to page 1 when from date changes', () => {
      renderHistory();

      fireEvent.click(screen.getByRole('button', { name: 'Go to next validation history page' }));
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText('Filter validation history from date'), {
        target: { value: '2026-01-01' },
      });

      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });
  });

  describe('milestone filter', () => {
    it('filters by milestone substring case-insensitively', () => {
      renderHistory();

      fireEvent.change(screen.getByLabelText('Filter validation history by milestone'), {
        target: { value: 'LAUNCH' },
      });

      expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
      expect(screen.queryByText('Beta Reserve')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 1 of 1 matching validations.')).toBeInTheDocument();
    });

    it('shows no-match state when milestone matches nothing', () => {
      renderHistory();

      fireEvent.change(screen.getByLabelText('Filter validation history by milestone'), {
        target: { value: 'nonexistent' },
      });

      expect(screen.getByText('No matching validations')).toBeInTheDocument();
    });

    it('resets to page 1 when milestone changes', () => {
      renderHistory();

      fireEvent.click(screen.getByRole('button', { name: 'Go to next validation history page' }));
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText('Filter validation history by milestone'), {
        target: { value: 'D' },
      });

      // 'D' matches Delivery (v-003) and Design (v-004) and Docs (v-005) — 3 items, 1 page at default page size 5
      expect(screen.queryByText('Page 2 of 2')).not.toBeInTheDocument();
    });
  });

  it('combines date range and milestone with status/search filters', () => {
    renderHistory();

    fireEvent.change(screen.getByLabelText('Filter validation history by outcome'), {
      target: { value: 'approved' },
    });
    fireEvent.change(screen.getByLabelText('Filter validation history from date'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Filter validation history to date'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Filter validation history by milestone'), {
      target: { value: 'Launch' },
    });

    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.queryByText('Beta Reserve')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 1 matching validations.')).toBeInTheDocument();
  });

  describe('CSV export', () => {
    beforeEach(() => {
      mockDownloadCsv.mockClear();
    });

    it('exports all items when no filter is active', () => {
      renderHistory();

      const btn = screen.getByRole('button', { name: /export.*csv/i });
      fireEvent.click(btn);

      expect(mockDownloadCsv).toHaveBeenCalledTimes(1);
      const [csv, filename] = mockDownloadCsv.mock.calls[0];
      expect(filename).toBe('validation-history.csv');
      expect(csv).toContain('ID,Status,Vault Name,Owner,Amount,Deadline,Milestone,Notes');
      for (const task of baseHistory) {
        expect(csv).toContain(task.id);
      }
    });

    it('exports only the filtered set when status filter is applied', () => {
      renderHistory();

      fireEvent.change(screen.getByLabelText('Filter validation history by outcome'), {
        target: { value: 'approved' },
      });

      const btn = screen.getByRole('button', { name: /export.*csv/i });
      fireEvent.click(btn);

      const [csv] = mockDownloadCsv.mock.calls[0];
      expect(csv).toContain('v-001');
      expect(csv).toContain('v-003');
      expect(csv).toContain('v-005');
      expect(csv).toContain('v-006');
      expect(csv).not.toContain('v-002');
      expect(csv).not.toContain('v-004');
    });

    it('exports only the filtered set when search query is active', () => {
      renderHistory();

      fireEvent.change(screen.getByLabelText('Search validation history by vault or owner'), {
        target: { value: 'delta' },
      });

      const btn = screen.getByRole('button', { name: /export.*csv/i });
      fireEvent.click(btn);

      const [csv] = mockDownloadCsv.mock.calls[0];
      expect(csv).toContain('v-004');
      expect(csv).not.toContain('v-001');
    });
  });
});
