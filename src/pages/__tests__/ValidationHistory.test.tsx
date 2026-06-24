import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValidationTask } from '../../Zustand/Store';
import { useVerifierStore } from '../../Zustand/Store';
import ValidationHistory from '../ValidationHistory';

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

  it('exports the full filtered history as CSV instead of only the current page', async () => {
    let exportedBlob: Blob | null = null;
    const anchorClick = vi.fn();
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const originalCreateElement = document.createElement.bind(document);
    const createObjectURL = vi.fn((blob: Blob) => {
      exportedBlob = blob;
      return 'blob:validation-history';
    });
    const revokeObjectURL = vi.fn();
    const createElement = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        Object.defineProperty(element, 'click', { configurable: true, value: anchorClick });
      }
      return element;
    });

    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

    try {
      renderHistory();

      fireEvent.change(screen.getByLabelText('Search validation history by vault or owner'), {
        target: { value: 'gowner' },
      });

      expect(screen.queryByText('Zeta Treasury')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', {
        name: 'Export filtered validation history as CSV',
      }));

      expect(anchorClick).toHaveBeenCalledTimes(1);
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:validation-history');
      expect(exportedBlob).not.toBeNull();

      const csv = await exportedBlob!.text();
      expect(csv).toContain('ID,Status,Vault Name,Owner,Amount,Deadline,Milestone,Notes');
      expect(csv).toContain('Alpha Vault');
      expect(csv).toContain('Zeta Treasury');
      expect(csv).toContain('"6,000 USDC"');
    } finally {
      createElement.mockRestore();
      Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL });
      Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevokeObjectURL });
    }
  });

  it('does not crash when object URL downloads are unavailable', () => {
    const originalCreateObjectURL = URL.createObjectURL;
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: undefined });

    try {
      renderHistory();

      expect(() => {
        fireEvent.click(screen.getByRole('button', {
          name: 'Export filtered validation history as CSV',
        }));
      }).not.toThrow();
    } finally {
      Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL });
    }
  });

  it('navigates back to the verifier dashboard', () => {
    renderHistory();

    fireEvent.click(screen.getByRole('button', { name: /back to dashboard/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/verifier');
  });
});
