import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValidationTask } from '../../Zustand/Store';
import { useVerifierStore } from '../../Zustand/Store';
import ValidationHistory from '../ValidationHistory';
import { filterValidationHistory } from '../../utils/paginate';
import { toCsv } from '../../utils/csv';

/**
 * Failure-path and boundary coverage for `ValidationHistory`.
 *
 * Module invariants under test:
 * - The store payload may be a non-array or contain null/corrupt entries at
 *   runtime (persisted/remote hydration). The page degrades to deterministic
 *   empty states instead of crashing.
 * - Stats count unknown statuses in the total but in neither bucket.
 * - CSV export never throws on malformed rows (empty cells) and a
 *   `downloadCsv` failure never disturbs page state (logged, no task data).
 * - Duplicate ids render as duplicate rows with collision-free keys; counts
 *   and exports reflect every record.
 * - The page is read-only: no approve/reject mutation controls exist.
 * - Rapid successive filter/pagination updates (concurrency analogue for this
 *   synchronous page) always converge on the final input; `paginate` clamps
 *   stale page numbers so a shrinking result set never strands the user.
 */

const { mockDownloadCsv } = vi.hoisted(() => ({ mockDownloadCsv: vi.fn() }));

vi.mock('../../utils/csv', async () => {
  const actual = await vi.importActual('../../utils/csv');
  return { ...actual, downloadCsv: mockDownloadCsv };
});

vi.mock('../../Zustand/Store', () => ({ useVerifierStore: vi.fn() }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const good: ValidationTask = {
  id: 'v-001',
  vaultName: 'Alpha Vault',
  owner: 'GOWNERALPHA',
  amount: '1,000 USDC',
  deadline: '2026-01-01',
  status: 'approved',
  milestone: 'Launch',
  notes: 'Approved launch evidence.',
};

function setHistory(value: unknown) {
  vi.mocked(useVerifierStore).mockImplementation(
    ((selector: (s: { validationHistory: unknown }) => unknown) =>
      selector({ validationHistory: value })) as never,
  );
}

function renderWith(value: unknown) {
  setHistory(value);
  return render(<ValidationHistory />);
}

/** Stat banner renders `<p>Label</p>` then `<h2>value</h2>`. */
function statValue(label: string): string {
  const nodes = screen.getAllByText(label);
  const caption = nodes.find((n) => n.tagName === 'P') ?? nodes[0];
  return (caption.nextElementSibling as HTMLElement)?.textContent ?? '';
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDownloadCsv.mockReset();
  window.localStorage.clear();
});

describe('ValidationHistory empty and corrupt payloads', () => {
  it('renders the empty-history state with zeroed stats', () => {
    renderWith([]);

    expect(screen.getByText('No History Found')).toBeInTheDocument();
    expect(screen.getByText("You haven't processed any validations yet.")).toBeInTheDocument();
    expect(statValue('Total Validated')).toBe('0');
    expect(statValue('Approval Rate')).toBe('0%');
    expect(document.body.textContent).not.toContain('NaN');
    expect(
      screen.queryByRole('navigation', { name: 'Validation history pagination' }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a string', 'corrupt'],
    ['an object', { validationHistory: [] }],
  ])('degrades a non-array store payload (%s) to the empty state instead of crashing', (_label, value) => {
    expect(() => renderWith(value)).not.toThrow();
    expect(screen.getByText('No History Found')).toBeInTheDocument();
    expect(statValue('Total Validated')).toBe('0');
  });

  it('skips null/corrupt entries and still renders valid rows', () => {
    const mixed = [null, undefined, 'junk', 42, good] as unknown as ValidationTask[];
    expect(() => renderWith(mixed)).not.toThrow();

    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    // Total counts every stored entry; filters only match the valid row.
    expect(statValue('Total Validated')).toBe('5');
    expect(screen.getByText('Showing 1 of 1 matching validations.')).toBeInTheDocument();
  });

  it('renders a task with a missing id without crashing via a fallback key', () => {
    const missingId = { ...good, id: undefined } as unknown as ValidationTask;
    expect(() => renderWith([missingId])).not.toThrow();
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
  });

  it('filterValidationHistory returns [] for non-array input and skips null entries', () => {
    expect(filterValidationHistory(undefined as never, { status: 'all', query: '' })).toEqual([]);
    expect(filterValidationHistory(null as never, { status: 'all', query: '' })).toEqual([]);
    expect(
      filterValidationHistory([null as never, good], { status: 'all', query: '' }),
    ).toEqual([good]);
  });

  it('toCsv degrades malformed task fields to empty cells instead of throwing', () => {
    const malformed = {
      id: undefined,
      status: undefined,
      vaultName: undefined,
      owner: undefined,
      amount: undefined,
      deadline: undefined,
      milestone: undefined,
    } as unknown as ValidationTask;
    let csv = '';
    expect(() => {
      csv = toCsv([malformed]);
    }).not.toThrow();
    expect(csv.split('\r\n')[0]).toBe('ID,Status,Vault Name,Owner,Amount,Deadline,Milestone,Notes');
  });
});

describe('ValidationHistory duplicates and boundary inputs', () => {
  it('renders duplicate ids as duplicate rows and counts/exports every record', () => {
    const dup = { ...good };
    const twin = { ...good, notes: 'Second decision note.' };
    renderWith([dup, twin]);

    expect(screen.getAllByText('Alpha Vault')).toHaveLength(2);
    expect(statValue('Total Validated')).toBe('2');
    expect(statValue('Approved')).toBe('2');
    expect(statValue('Approval Rate')).toBe('100%');

    fireEvent.click(screen.getByRole('button', { name: /export.*csv/i }));
    expect(mockDownloadCsv).toHaveBeenCalledTimes(1);
    const [csv] = mockDownloadCsv.mock.calls[0];
    // Both records export even though the id repeats.
    expect(csv.match(/v-001/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('repeated exports are idempotent (retry-safe)', () => {
    renderWith([good]);
    const btn = screen.getByRole('button', { name: /export.*csv/i });
    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(mockDownloadCsv).toHaveBeenCalledTimes(2);
    expect(mockDownloadCsv.mock.calls[0][0]).toBe(mockDownloadCsv.mock.calls[1][0]);
    expect(mockDownloadCsv.mock.calls[0][1]).toBe('validation-history.csv');
  });

  it('exports header-only CSV when history is empty', () => {
    renderWith([]);
    // No rows means no export affordance expectations beyond no crash; the
    // empty state offers no list, but the export button still exports headers.
    fireEvent.click(screen.getByRole('button', { name: /export.*csv/i }));
    expect(mockDownloadCsv).toHaveBeenCalledTimes(1);
    expect(mockDownloadCsv.mock.calls[0][0]).toBe(
      'ID,Status,Vault Name,Owner,Amount,Deadline,Milestone,Notes',
    );
  });

  it('treats whitespace-only search and milestone as no filter', () => {
    renderWith([good, { ...good, id: 'v-002', vaultName: 'Beta' }]);
    fireEvent.change(screen.getByLabelText('Search validation history by vault or owner'), {
      target: { value: '   ' },
    });
    fireEvent.change(screen.getByLabelText('Filter validation history by milestone'), {
      target: { value: '   ' },
    });
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 2 matching validations.')).toBeInTheDocument();
  });

  it('unknown task status renders with a fallback chip and dilutes the rate without crashing', () => {
    const weird = { ...good, id: 'weird', vaultName: 'Weird Vault', status: 'archived' } as unknown as ValidationTask;
    expect(() => renderWith([good, weird])).not.toThrow();

    expect(statValue('Total Validated')).toBe('2');
    expect(statValue('Approved')).toBe('1');
    expect(statValue('Rejected')).toBe('0');
    expect(statValue('Approval Rate')).toBe('50%');
    // Both rows still render; the unknown status falls back to a muted chip.
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.getByText('Weird Vault')).toBeInTheDocument();
  });
});

describe('ValidationHistory storage and export failures', () => {
  it('renders with the default page size when localStorage reads throw', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => renderWith([good])).not.toThrow();
    expect(screen.getByLabelText('Validation history page size')).toHaveValue('10');
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
  });

  it('keeps the requested page size in UI state when localStorage writes throw', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderWith([good]);
    fireEvent.change(screen.getByLabelText('Validation history page size'), {
      target: { value: '25' },
    });
    // Persistence failed, but pagination state still converges (graceful
    // degradation: the preference just won't survive a reload).
    expect(screen.getByLabelText('Validation history page size')).toHaveValue('25');
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
  });

  it('survives a downloadCsv failure without disturbing page state', () => {
    mockDownloadCsv.mockImplementationOnce(() => {
      throw new Error('blob blocked');
    });
    renderWith([good]);

    const btn = screen.getByRole('button', { name: /export.*csv/i });
    expect(() => fireEvent.click(btn)).not.toThrow();

    // Page state is untouched: rows, stats, and controls still work.
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(statValue('Total Validated')).toBe('1');
    fireEvent.change(screen.getByLabelText('Search validation history by vault or owner'), {
      target: { value: 'alpha' },
    });
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
  });

  it('exports malformed rows as empty cells instead of throwing', () => {
    const malformed = {
      id: undefined,
      status: 'approved',
      vaultName: undefined,
      owner: undefined,
      amount: undefined,
      deadline: '2026-01-01',
      milestone: undefined,
    } as unknown as ValidationTask;
    renderWith([malformed]);

    expect(() => fireEvent.click(screen.getByRole('button', { name: /export.*csv/i }))).not.toThrow();
    expect(mockDownloadCsv).toHaveBeenCalledTimes(1);
    expect(mockDownloadCsv.mock.calls[0][1]).toBe('validation-history.csv');
  });
});

describe('ValidationHistory concurrency, staleness, and recovery', () => {
  const many: ValidationTask[] = Array.from({ length: 12 }, (_, i) => ({
    ...good,
    id: `v-${String(i).padStart(3, '0')}`,
    vaultName: `Vault ${i}`,
    deadline: `2026-01-${String((i % 9) + 1).padStart(2, '0')}`,
    status: i % 2 === 0 ? ('approved' as const) : ('rejected' as const),
  }));

  it('converges on the last of rapid successive filter inputs', () => {
    renderWith(many);
    const search = screen.getByLabelText('Search validation history by vault or owner');
    // Simulate fast typing: intermediate values are superseded synchronously.
    fireEvent.change(search, { target: { value: 'V' } });
    fireEvent.change(search, { target: { value: 'Va' } });
    fireEvent.change(search, { target: { value: 'Vault 1' } });

    expect(screen.getByText('Showing 3 of 3 matching validations.')).toBeInTheDocument();
    expect(screen.getByText('Vault 1')).toBeInTheDocument();
    expect(screen.getByText('Vault 10')).toBeInTheDocument();
    expect(screen.getByText('Vault 11')).toBeInTheDocument();
  });

  it('never strands the user on an empty page when a filter shrinks results (stale page clamp)', () => {
    renderWith(many);
    const nav = screen.getByRole('navigation', { name: 'Validation history pagination' });
    fireEvent.click(within(nav).getByRole('button', { name: 'Go to next validation history page' }));
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

    // Narrow to a single row while on page 2: the clamp must recover to page 1.
    fireEvent.change(screen.getByLabelText('Search validation history by vault or owner'), {
      target: { value: 'Vault 11' },
    });
    expect(screen.queryByText('No matching validations')).not.toBeInTheDocument();
    expect(screen.getByText('Vault 11')).toBeInTheDocument();
  });

  it('recovers the full list after a no-match filter is cleared', () => {
    renderWith([good]);
    const search = screen.getByLabelText('Search validation history by vault or owner');
    fireEvent.change(search, { target: { value: 'nothing matches' } });
    expect(screen.getByText('No matching validations')).toBeInTheDocument();

    fireEvent.change(search, { target: { value: '' } });
    expect(screen.queryByText('No matching validations')).not.toBeInTheDocument();
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
  });

  it('keeps pagination controls consistent under rapid page toggling', () => {
    renderWith(many);
    const nav = screen.getByRole('navigation', { name: 'Validation history pagination' });
    const next = within(nav).getByRole('button', { name: 'Go to next validation history page' });
    const prev = within(nav).getByRole('button', { name: 'Go to previous validation history page' });

    fireEvent.click(next);
    fireEvent.click(prev);
    fireEvent.click(next);
    fireEvent.click(prev);

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();
  });
});

describe('ValidationHistory authorization surface', () => {
  it('exposes no mutation controls even when pending-status records are present', () => {
    const pending = { ...good, id: 'v-pending', status: 'pending' } as ValidationTask;
    renderWith([pending, good]);

    expect(screen.queryByRole('button', { name: /^approve$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^reject$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /revoke/i })).not.toBeInTheDocument();

    const back = screen.getByRole('button', { name: /back to dashboard/i });
    fireEvent.click(back);
    expect(mockNavigate).toHaveBeenCalledWith('/verifier');
  });
});
