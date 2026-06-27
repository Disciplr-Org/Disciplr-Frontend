import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VaultTransactions, { Transaction } from '../VaultTransactions';
import { toCsv, downloadCsv } from '../../utils/csv';
import { WINDOW_SIZE, WINDOW_THRESHOLD } from '../../utils/windowRange';

vi.mock('../../utils/csv', () => ({
  toCsv: vi.fn((_data, _type) => 'mocked,csv,content'),
  downloadCsv: vi.fn(),
}));

const TX_TYPES = ['create', 'validate', 'release', 'redirect'] as const;

function buildTransaction(index: number, status: 'confirmed' | 'pending' | 'failed' = 'confirmed') {
  const hashPrefix = status === 'confirmed' ? 'aa' : status === 'pending' ? 'cc' : 'dd';
  return {
    id: `win-tx-${index}`,
    type: TX_TYPES[index % TX_TYPES.length],
    vault: `Vault ${index % 3}`,
    amount: 1000 + index,
    fee: 0.0001,
    block: 48_000_000 + index,
    hash: `${hashPrefix}${String(index).padStart(62, '0')}`,
    status,
    from: 'GFROM123...ADDR',
    to: 'GTO12345...ADDR',
    timestamp: new Date(FIXED_NOW - index * 60_000),
    memo: '',
  };
}

function buildConfirmedList(count: number) {
  return Array.from({ length: count }, (_, index) => buildTransaction(index, 'confirmed'));
}

function renderPage() {
  return render(<VaultTransactions />);
}

// ── Clock setup ──────────────────────────────────────────────────────────────
// MOCK_TRANSACTIONS timestamps are computed as (Date.now() - offset) at module
// init time (when VaultTransactions.tsx is first imported). Capturing Date.now()
// here — right after the import resolves — and then freezing to that value means
// fmtTime() at render time sees the same reference point, so "2h ago", "45m ago"
// etc. are deterministic across every run without relying on the wall clock.
const FIXED_NOW = Date.now();
vi.useFakeTimers();
vi.setSystemTime(FIXED_NOW);

describe('VaultTransactions', () => {
  beforeEach(() => {
    // jsdom may not provide navigator.clipboard; stub it so the copy handler
    // doesn't throw when hash/address copy buttons are rendered.
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('core rendering', () => {
    it('renders the page heading', () => {
      renderPage();
      expect(screen.getByRole('heading', { name: /Transaction History/i })).toBeInTheDocument();
    });

    it('renders the export button', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    });

    it('renders all three status sections from mock data', () => {
      renderPage();
      // Mock data has pending, failed, and confirmed transactions
      expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Failed').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Confirmed').length).toBeGreaterThan(0);
    });
  });

  describe('accessible table semantics', () => {
    it('each non-empty status section is announced as a table', () => {
      renderPage();
      const tables = screen.getAllByRole('table');
      // Mock data has Pending (2 tx), Failed (1 tx), Confirmed (7 tx)
      expect(tables.length).toBeGreaterThanOrEqual(3);
    });

    it('every table has an accessible name', () => {
      renderPage();
      const tables = screen.getAllByRole('table');
      tables.forEach(table => {
        expect(table).toHaveAccessibleName();
      });
    });

    it('each table section has a descriptive label including its status', () => {
      renderPage();
      expect(screen.getByRole('table', { name: /Pending transactions/i })).toBeInTheDocument();
      expect(screen.getByRole('table', { name: /Failed transactions/i })).toBeInTheDocument();
      expect(screen.getByRole('table', { name: /Confirmed transactions/i })).toBeInTheDocument();
    });

    it('column headers are present in each table', () => {
      renderPage();
      const headers = screen.getAllByRole('columnheader');
      // 3 sections × 4 headers each
      expect(headers.length).toBeGreaterThanOrEqual(12);
    });

    it('transaction data rows are announced as table rows', () => {
      renderPage();
      const rows = screen.getAllByRole('row');
      // At minimum: 3 hidden header rows + 10 data rows
      expect(rows.length).toBeGreaterThanOrEqual(13);
    });

    it('status is conveyed via visible text, not color only', () => {
      renderPage();
      // Each tx row's status span includes a text label
      expect(screen.getAllByText('Confirmed').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Failed').length).toBeGreaterThan(0);
    });

    it('decorative status dots are hidden from screen readers', () => {
      const { container } = renderPage();
      const dots = container.querySelectorAll('.vt-status-dot');
      expect(dots.length).toBeGreaterThan(0);
      dots.forEach(dot => {
        expect(dot).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('decorative section accent dots are hidden from screen readers', () => {
      const { container } = renderPage();
      const dots = container.querySelectorAll('.vt-section-dot');
      expect(dots.length).toBeGreaterThan(0);
      dots.forEach(dot => {
        expect(dot).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  // ── TxType label + color (TYPE_META) ──────────────────────────────────────
  describe('TxType metadata', () => {
    it.each([
      ['Create',   '#6ee7b7'],
      ['Validate', '#93c5fd'],
      ['Release',  '#fcd34d'],
      ['Redirect', '#f9a8d4'],
    ])('renders type label "%s" with color %s', (label, color) => {
      const { container } = render(<VaultTransactions />);
      const typeSpans = Array.from(container.querySelectorAll('.vt-tx-type'));
      const match = typeSpans.find(el => el.textContent?.trim() === label);
      expect(match, `expected a .vt-tx-type span with text "${label}"`).toBeDefined();
      expect(match).toHaveStyle({ color });
    });
  });

  // ── TxStatus label + color (STATUS_META) ─────────────────────────────────
  describe('TxStatus metadata', () => {
    it.each([
      ['Confirmed', '#6ee7b7'],
      ['Pending',   '#fcd34d'],
      ['Failed',    '#fca5a5'],
    ])('renders status label "%s" with color %s', (label, color) => {
      const { container } = render(<VaultTransactions />);
      // .vt-tx-status spans are the badge elements; section heading spans use
      // .vt-section-title and carry no inline color style, so this query is precise.
      const statusSpans = Array.from(container.querySelectorAll('.vt-tx-status'));
      const match = statusSpans.find(el => el.textContent?.includes(label));
      expect(match, `expected a .vt-tx-status badge with text "${label}"`).toBeDefined();
      expect(match).toHaveStyle({ color });
    });
  });

  // ── Hash truncation (truncHash) ───────────────────────────────────────────
  describe('hash truncation', () => {
    it('shows first-8 + "..." + last-6 for a known 64-char hash', () => {
      render(<VaultTransactions />);
      // tx1 hash: a3f9d1c8e2b74056af3d9c1b2e8f0a4d7c5e9b3f1a2d4c6e8b0f2a4c6d8e0f2a  (64 chars)
      // truncHash(hash, 8, 6) → slice(0,8) + '...' + slice(-6)
      //   = 'a3f9d1c8' + '...' + '8e0f2a'  →  'a3f9d1c8...8e0f2a'
      const hashButtons = screen.getAllByTitle('Copy hash');
      const tx1Btn = hashButtons.find(btn => btn.textContent?.includes('a3f9d1c8...8e0f2a'));
      expect(tx1Btn, 'expected a hash button displaying "a3f9d1c8...8e0f2a"').toBeDefined();
    });

    it('every visible hash button follows the 8-char head + "..." + 6-char tail pattern', () => {
      render(<VaultTransactions />);
      const hashButtons = screen.getAllByTitle('Copy hash');
      expect(hashButtons.length).toBeGreaterThan(0);
      hashButtons.forEach(btn => {
        // Match any 8 chars, literal '...', then any 6 chars
        expect(btn.textContent).toMatch(/.{8}\.\.\..{6}/);
      });
    });
  });

  describe('sort controls', () => {
    it('sort button defaults to newest-first', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /Newest/i })).toBeInTheDocument();
    });

    it('clicking sort toggles to oldest-first', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /Newest/i }));
      expect(screen.getByRole('button', { name: /Oldest/i })).toBeInTheDocument();
    });

    it('clicking sort twice returns to newest-first', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /Newest/i }));
      fireEvent.click(screen.getByRole('button', { name: /Oldest/i }));
      expect(screen.getByRole('button', { name: /Newest/i })).toBeInTheDocument();
    });
  });

  describe('filters', () => {
    it('clear button appears when a filter is applied', () => {
      renderPage();
      expect(screen.queryByRole('button', { name: /Clear/i })).not.toBeInTheDocument();
      const toolbar = screen.getByRole('group', { name: /filter by transaction type/i });
      fireEvent.click(within(toolbar).getByText('Create').closest('button')!);
      expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
    });

    it('clearing filters removes the clear button', () => {
      renderPage();
      const toolbar = screen.getByRole('group', { name: /filter by transaction type/i });
      fireEvent.click(within(toolbar).getByText('Create').closest('button')!);
      const clearButtons = screen.getAllByRole('button', { name: /Clear/i });
      fireEvent.click(clearButtons[0]);
      expect(screen.queryByRole('button', { name: /Clear/i })).not.toBeInTheDocument();
    });
  });

  // ── Relative timestamps (fmtTime) ─────────────────────────────────────────
  describe('relative timestamp display', () => {
    it('renders "Xm ago" labels for transactions within the last hour', () => {
      render(<VaultTransactions />);
      // MOCK_TRANSACTIONS offsets include 2m, 5m, 10m, 20m, 45m
      const minuteLabels = screen.getAllByText(/^\d+m ago$/);
      expect(minuteLabels.length).toBeGreaterThan(0);
    });

    it('renders "Xh ago" labels for transactions older than 60 minutes', () => {
      render(<VaultTransactions />);
      // MOCK_TRANSACTIONS offsets include 1.5h (→1h), 2h, 3.5h (→3h), 5h, 8h
      const hourLabels = screen.getAllByText(/^\d+h ago$/);
      expect(hourLabels.length).toBeGreaterThan(0);
    });

    it('never exposes raw ISO-8601 strings in transaction rows', () => {
      render(<VaultTransactions />);
      // ISO strings should only appear in the raw-data section of the modal (closed by default)
      expect(screen.queryByText(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)).not.toBeInTheDocument();
    });
  });

  // ── From / To address display (modal) ─────────────────────────────────────
  describe('transaction detail modal', () => {
    it('shows the from and to addresses when a row is clicked', () => {
      const { container } = render(<VaultTransactions />);
      // Rows render: Pending section first (tx8, tx4), then Failed (tx6), then Confirmed.
      // rows[0] is tx8 (redirect, Alpha Vault): from "GCVAULT...M3P", to "GBVZ3...QK7L"
      const rows = container.querySelectorAll('.vt-tx-row');
      expect(rows.length).toBeGreaterThan(0);
      fireEvent.click(rows[0]);

      expect(screen.getByText('GCVAULT...M3P')).toBeInTheDocument();
      expect(screen.getByText('GBVZ3...QK7L')).toBeInTheDocument();
    });

    it('closes the modal when the backdrop is clicked', () => {
      const { container } = render(<VaultTransactions />);
      const rows = container.querySelectorAll('.vt-tx-row');
      fireEvent.click(rows[0]);
      expect(container.querySelector('.vt-modal')).toBeInTheDocument();

      fireEvent.click(container.querySelector('.vt-modal-backdrop')!);
      expect(container.querySelector('.vt-modal')).not.toBeInTheDocument();
    });

    it('displays the full hash in the modal, not the truncated form', () => {
      const { container } = render(<VaultTransactions />);
      const rows = container.querySelectorAll('.vt-tx-row');
      fireEvent.click(rows[0]);
      // tx8 full hash
      const fullHash = 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3';
      expect(screen.getByText(fullHash)).toBeInTheDocument();
    });
  });

  // ── Filter behaviour (no network dependency) ──────────────────────────────
  describe('filter controls', () => {
    it('shows only confirmed transactions when the Confirmed status filter is applied', () => {
      const { container } = render(<VaultTransactions />);
      const selects = container.querySelectorAll('.vt-select');
      // Third select is the status filter
      fireEvent.change(selects[1], { target: { value: 'confirmed' } });

      // Pending and Failed sections should disappear
      expect(screen.queryByRole('table', { name: /Pending transactions/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('table', { name: /Failed transactions/i })).not.toBeInTheDocument();
      expect(screen.getByRole('table', { name: /Confirmed transactions/i })).toBeInTheDocument();
      expect(screen.queryByText('Pending')).not.toBeInTheDocument();
      expect(screen.queryByText('Failed')).not.toBeInTheDocument();
      expect(screen.getAllByText('Confirmed').length).toBeGreaterThan(0);
    });

    it('hash search filters the list to matching transactions only', () => {
      render(<VaultTransactions />);
      const searchInput = screen.getByPlaceholderText(/search by transaction hash/i);
      // tx1 hash starts with 'a3f9d1c8'; no other hash shares this prefix
      fireEvent.change(searchInput, { target: { value: 'a3f9d1c8' } });

      const hashButtons = screen.getAllByTitle('Copy hash');
      expect(hashButtons).toHaveLength(1);
      expect(hashButtons[0].textContent).toMatch(/^a3f9d1c8/);
    });
  });
});

describe('VaultTransactions with small list', () => {
  it('renders header and stats', () => {
    render(<VaultTransactions />);
    expect(screen.getByText('Transaction History')).toBeInTheDocument();
    expect(screen.getByText('Total Transactions')).toBeInTheDocument();
  });

  it('renders all 10 mock transaction rows', () => {
    render(<VaultTransactions />);
    const rows = document.querySelectorAll('.vt-tx-row');
    expect(rows.length).toBe(10);
  });

  it('does not show window banner for small list (below threshold)', () => {
    render(<VaultTransactions />);
    expect(document.querySelector('.vt-window-banner')).toBeNull();
  });

  it('filters by transaction type via chip buttons', () => {
    render(<VaultTransactions />);
    const toolbar = screen.getByRole('group', { name: /filter by transaction type/i });
    // Deselect "Create" by clicking it → remaining rows = 7 (all non-Create)
    fireEvent.click(within(toolbar).getByText('Create').closest('button')!);
    expect(document.querySelectorAll('.vt-tx-row').length).toBe(7);
    // Re-select "Create" and deselect everything else
    fireEvent.click(within(toolbar).getByText('Create').closest('button')!);
    fireEvent.click(within(toolbar).getByText('Validate').closest('button')!);
    fireEvent.click(within(toolbar).getByText('Release').closest('button')!);
    fireEvent.click(within(toolbar).getByText('Redirect').closest('button')!);
    expect(document.querySelectorAll('.vt-tx-row').length).toBe(3);
  });

  it('filters by vault', () => {
    render(<VaultTransactions />);
    const selects = document.querySelectorAll('.vt-select');
    fireEvent.change(selects[0], { target: { value: 'Alpha Vault' } });
    expect(document.querySelectorAll('.vt-tx-row').length).toBe(4);
  });

  it('toggles sort direction', () => {
    render(<VaultTransactions />);
    const sortBtn = document.querySelector('.vt-sort-btn')!;
    expect(screen.getByText(/Newest/)).toBeInTheDocument();
    fireEvent.click(sortBtn);
    expect(screen.getByText(/Oldest/)).toBeInTheDocument();
    fireEvent.click(sortBtn);
    expect(screen.getByText(/Newest/)).toBeInTheDocument();
  });

  it('opens detail modal on row click', () => {
    render(<VaultTransactions />);
    const rows = document.querySelectorAll('.vt-tx-row');
    fireEvent.click(rows[0]);
    expect(document.querySelector('.vt-modal')).toBeInTheDocument();
  });

  it('closes modal on backdrop click', () => {
    render(<VaultTransactions />);
    const rows = document.querySelectorAll('.vt-tx-row');
    fireEvent.click(rows[0]);
    expect(document.querySelector('.vt-modal')).toBeInTheDocument();
    fireEvent.click(document.querySelector('.vt-modal-backdrop')!);
    expect(document.querySelector('.vt-modal')).toBeNull();
  });

  it('shows filters and clear button resets them', () => {
    render(<VaultTransactions />);
    const selects = document.querySelectorAll('.vt-select');
    fireEvent.change(selects[0], { target: { value: 'Alpha Vault' } });
    expect(screen.getByText('Clear')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Clear'));
    expect(document.querySelectorAll('.vt-tx-row').length).toBe(10);
  });

  it('searches by hash', () => {
    render(<VaultTransactions />);
    const searchInput = document.querySelector('.vt-search') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'a3f9' } });
    expect(document.querySelectorAll('.vt-tx-row').length).toBe(1);
  });

  it('filters by status via select', () => {
    render(<VaultTransactions />);
    const selects = document.querySelectorAll('.vt-select');
    fireEvent.change(selects[1], { target: { value: 'pending' } });
    expect(document.querySelectorAll('.vt-tx-row').length).toBe(2);
  });

  it('filters by amount range', () => {
    render(<VaultTransactions />);
    const amountInputs = document.querySelectorAll('.vt-amount-input');
    fireEvent.change(amountInputs[0], { target: { value: '10000' } });
    const rows = document.querySelectorAll('.vt-tx-row');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(10);
  });

  // ── Type filter toolbar chips ─────────────────────────────────────
  it('renders the type filter toolbar with All and per-type chips', () => {
    render(<VaultTransactions />);
    const toolbar = screen.getByRole('group', { name: /filter by transaction type/i });
    expect(toolbar).toBeInTheDocument();

    expect(within(toolbar).getByText('All')).toBeInTheDocument();
    expect(within(toolbar).getByText('Create')).toBeInTheDocument();
    expect(within(toolbar).getByText('Validate')).toBeInTheDocument();
    expect(within(toolbar).getByText('Release')).toBeInTheDocument();
    expect(within(toolbar).getByText('Redirect')).toBeInTheDocument();
  });

  function getAllChip() {
    return screen.getByRole('group', { name: /filter by transaction type/i })
      .querySelector('button')!;
  }

  it('chip counts reflect the visible (filtered) set — All chip shows total', () => {
    render(<VaultTransactions />);
    const countEl = getAllChip().querySelector('.vt-type-chip-count')!;
    expect(countEl.textContent).toBe('10');
  });

  it('type chip counts update when vault filter is applied', () => {
    render(<VaultTransactions />);
    const selects = document.querySelectorAll('.vt-select');
    fireEvent.change(selects[0], { target: { value: 'Alpha Vault' } });
    const countEl = getAllChip().querySelector('.vt-type-chip-count')!;
    expect(countEl.textContent).toBe('4');
  });

  it('type chip counts update when status filter is applied', () => {
    render(<VaultTransactions />);
    const selects = document.querySelectorAll('.vt-select');
    fireEvent.change(selects[1], { target: { value: 'pending' } });
    const countEl = getAllChip().querySelector('.vt-type-chip-count')!;
    expect(countEl.textContent).toBe('2');
  });

  it('the "All" chip is aria-pressed when all types are selected', () => {
    render(<VaultTransactions />);
    const allBtn = getAllChip();
    expect(allBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('deselecting a type removes it from visible rows and updates chip count', () => {
    render(<VaultTransactions />);
    const toolbar = screen.getByRole('group', { name: /filter by transaction type/i });
    const createBtn = within(toolbar).getByText('Create').closest('button')!;
    expect(document.querySelectorAll('.vt-tx-row')).toHaveLength(10);
    fireEvent.click(createBtn);
    expect(document.querySelectorAll('.vt-tx-row')).toHaveLength(7);
    const countEl = getAllChip().querySelector('.vt-type-chip-count')!;
    expect(countEl.textContent).toBe('7');
  });

  it('re-selecting a type restores it to visible rows', () => {
    render(<VaultTransactions />);
    const toolbar = screen.getByRole('group', { name: /filter by transaction type/i });
    const createBtn = within(toolbar).getByText('Create').closest('button')!;
    fireEvent.click(createBtn);
    expect(document.querySelectorAll('.vt-tx-row')).toHaveLength(7);
    fireEvent.click(createBtn);
    expect(document.querySelectorAll('.vt-tx-row')).toHaveLength(10);
  });

  // ── Totals strip ──────────────────────────────────────────────────
  it('renders the totals strip with count, amount and fees for visible set', () => {
    render(<VaultTransactions />);
    expect(screen.getByText(/10 transactions/i)).toBeInTheDocument();
    expect(screen.getByText(/Amount:/i)).toBeInTheDocument();
    expect(screen.getByText(/Fees:/i)).toBeInTheDocument();
    expect(document.querySelector('.vt-totals-strip')).toBeInTheDocument();
  });

  it('totals strip updates when a type filter is applied', () => {
    render(<VaultTransactions />);
    const toolbar = screen.getByRole('group', { name: /filter by transaction type/i });
    const createBtn = within(toolbar).getByText('Create').closest('button')!;
    fireEvent.click(createBtn);
    expect(screen.getByText(/7 transactions/i)).toBeInTheDocument();
  });

  it('totals strip is hidden when filtered list is empty', () => {
    render(<VaultTransactions />);
    const allBtn = getAllChip();
    fireEvent.click(allBtn);
    expect(document.querySelector('.vt-totals-strip')).toBeNull();
  });
});

describe('VaultTransactions windowing threshold rendering', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all rows when the confirmed list is below WINDOW_THRESHOLD', () => {
    const transactions = buildConfirmedList(WINDOW_THRESHOLD - 1);

    render(<VaultTransactions transactions={transactions} />);

    expect(document.querySelectorAll('.vt-tx-row')).toHaveLength(WINDOW_THRESHOLD - 1);
    expect(document.querySelector('.vt-window-banner')).toBeNull();
  });

  it('renders all rows at exactly WINDOW_THRESHOLD without windowing', () => {
    const transactions = buildConfirmedList(WINDOW_THRESHOLD);

    render(<VaultTransactions transactions={transactions} />);

    expect(document.querySelectorAll('.vt-tx-row')).toHaveLength(WINDOW_THRESHOLD);
    expect(document.querySelector('.vt-window-banner')).toBeNull();
  });

  it('renders at most WINDOW_SIZE rows when the confirmed list exceeds the threshold', () => {
    const transactions = buildConfirmedList(WINDOW_THRESHOLD + 5);

    render(<VaultTransactions transactions={transactions} />);

    expect(document.querySelectorAll('.vt-tx-row')).toHaveLength(WINDOW_SIZE);
    expect(screen.getByText(`Showing 1–${WINDOW_SIZE} of ${WINDOW_THRESHOLD + 5}`)).toBeInTheDocument();
  });

  it('keeps section headers and row metadata for windowed rows', () => {
    const transactions = buildConfirmedList(WINDOW_THRESHOLD + 10);

    render(<VaultTransactions transactions={transactions} />);

    expect(screen.getByRole('table', { name: /Confirmed transactions/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Transaction Type/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Status/i })).toBeInTheDocument();

    const statusBadges = document.querySelectorAll('.vt-tx-status');
    expect(statusBadges).toHaveLength(WINDOW_SIZE);
    statusBadges.forEach((badge) => {
      expect(badge.textContent).toContain('Confirmed');
    });

    const typeLabels = Array.from(document.querySelectorAll('.vt-tx-type')).map((el) => el.textContent?.trim());
    expect(typeLabels).toHaveLength(WINDOW_SIZE);
    typeLabels.forEach((label) => {
      expect(['Create', 'Validate', 'Release', 'Redirect']).toContain(label);
    });
  });

  it('renders the empty confirmed state when no transactions are provided', () => {
    render(<VaultTransactions transactions={[]} />);

    expect(document.querySelectorAll('.vt-tx-row')).toHaveLength(0);
    expect(document.querySelector('.vt-window-banner')).toBeNull();
    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
  });

  it('updates visible rows when the transactions prop changes', () => {
    const firstBatch = buildConfirmedList(WINDOW_THRESHOLD + 5);
    const secondBatch = buildConfirmedList(WINDOW_THRESHOLD + 5).map((tx, index) => ({
      ...tx,
      id: `updated-${index}`,
      hash: `bb${String(index).padStart(62, '0')}`,
    }));

    const { rerender } = render(<VaultTransactions transactions={firstBatch} />);

    expect(document.querySelectorAll('.vt-tx-row')).toHaveLength(WINDOW_SIZE);
    expect(screen.getAllByTitle('Copy hash')[0].textContent).toContain('aa000000');

    rerender(<VaultTransactions transactions={secondBatch} />);

    expect(document.querySelectorAll('.vt-tx-row')).toHaveLength(WINDOW_SIZE);
    const hashButtons = screen.getAllByTitle('Copy hash');
    expect(hashButtons[0].textContent).toContain('bb000000');
    expect(hashButtons.some((btn) => btn.textContent?.includes('aa000000'))).toBe(false);
  });

  it('advances the visible window when Next is clicked', () => {
    const transactions = buildConfirmedList(WINDOW_THRESHOLD + 15);

    render(<VaultTransactions transactions={transactions} />);

    expect(screen.getByText(`Showing 1–${WINDOW_SIZE} of ${WINDOW_THRESHOLD + 15}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    expect(screen.getByText(`Showing 11–${WINDOW_SIZE + 10} of ${WINDOW_THRESHOLD + 15}`)).toBeInTheDocument();
    expect(document.querySelectorAll('.vt-tx-row')).toHaveLength(WINDOW_SIZE);
  });
});

describe('VaultTransactions large fixture integration', () => {
  it('TxRow is memoized and skips re-render for unchanged props', () => {
    render(<VaultTransactions />);
    const rows = document.querySelectorAll('.vt-tx-row');
    expect(rows.length).toBe(10);
  });
});

describe('CSV Export', () => {
  it('calls toCsv and downloadCsv with the filtered subset when Export CSV is clicked', () => {
    vi.mocked(toCsv).mockClear();
    vi.mocked(downloadCsv).mockClear();

    renderPage();
    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    expect(exportBtn).not.toBeDisabled();

    // Click the export button
    fireEvent.click(exportBtn);

    // It should have called toCsv with the mock transactions array (length 10) and 'transactions'
    expect(toCsv).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(toCsv).mock.calls[0];
    expect(callArgs[0]).toHaveLength(10);
    expect(callArgs[1]).toBe('transactions');

    expect(downloadCsv).toHaveBeenCalledTimes(1);
    expect(downloadCsv).toHaveBeenCalledWith('mocked,csv,content', 'vault-transactions.csv');
  });

  it('reflects active filters when exporting', () => {
    vi.mocked(toCsv).mockClear();
    vi.mocked(downloadCsv).mockClear();

    renderPage();
    
    // Filter by type "create" (which has 3 items)
    const toolbar = screen.getByRole('group', { name: /filter by transaction type/i });
    // Deselect all non-create types, leaving only "Create" selected
    fireEvent.click(within(toolbar).getByText('Validate').closest('button')!);
    fireEvent.click(within(toolbar).getByText('Release').closest('button')!);
    fireEvent.click(within(toolbar).getByText('Redirect').closest('button')!);

    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    fireEvent.click(exportBtn);

    expect(toCsv).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(toCsv).mock.calls[0];
    // Should only have the 3 filtered "create" transactions
    expect(callArgs[0]).toHaveLength(3);
    expect((callArgs[0] as Transaction[]).every(tx => tx.type === 'create')).toBe(true);

    expect(downloadCsv).toHaveBeenCalledTimes(1);
  });

  it('disables the export button when the filtered list is empty', () => {
    renderPage();

    // Enter a search query that matches nothing
    const searchInput = screen.getByPlaceholderText(/search by transaction hash/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistenthash12345' } });

    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    expect(exportBtn).toBeDisabled();

    // Clicking it does not trigger download
    vi.mocked(downloadCsv).mockClear();
    fireEvent.click(exportBtn);
    expect(downloadCsv).not.toHaveBeenCalled();
  });
});
