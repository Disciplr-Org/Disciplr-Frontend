import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PendingValidations from '../PendingValidations';
import ValidationDetail from '../ValidationDetail';
import ValidationHistory from '../ValidationHistory';
import VerifierDashboard from '../VerifierDashboard';
import { useVerifierStore } from '../../Zustand/Store';
import { clearCache } from '../../services/queryCache';

// The pending queue is sorted by deadline (ascending) by default, so the
// on-screen row order does not match insertion order in the store. Look the
// Review button up by the row's vault name instead of relying on a fixed
// index, so tests stay correct regardless of default sort order.
function clickReviewFor(vaultName: string) {
  const row = screen.getByText(vaultName).closest('tr');
  if (!row) {
    throw new Error(`Could not find a table row for vault "${vaultName}"`);
  }
  fireEvent.click(within(row).getByRole('button', { name: /Review/i }));
}

// Helper to reset the store between tests
function resetStore() {
  useVerifierStore.setState({
    pendingValidations: [
      {
        id: 'v-101',
        vaultName: 'Q3 Development Fund',
        owner: '0x1234...abcd',
        amount: '50,000 USDC',
        deadline: '2026-05-15',
        status: 'pending',
        milestone: 'Beta Release Deployment',
        evidenceUrl: 'https://github.com/example/release-v1',
        criteria: [
          'Deployment URL is live and publicly accessible',
          'All critical bugs from the backlog are resolved',
          'Release notes are published',
        ],
      },
      {
        id: 'v-102',
        vaultName: 'Community Grant #42',
        owner: '0x8888...9999',
        amount: '10,000 USDC',
        deadline: '2026-05-02',
        status: 'pending',
        milestone: 'Design System Figma Delivery',
        evidenceUrl: 'https://figma.com/example-link',
        criteria: [
          'Figma file is shared with the org',
          'All component pages are complete',
        ],
      }
    ],
    validationHistory: [
      {
        id: 'v-099',
        vaultName: 'Audit Bounty',
        owner: '0x7777...4444',
        amount: '5,000 USDC',
        deadline: '2026-04-10',
        status: 'approved',
        milestone: 'Smart Contract Security Audit',
        notes: 'Audit looks solid, all critical issues addressed.',
      }
    ],
  });
}

const apiResponse = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => ({ data }),
});

const apiVault = (id: string, name: string, milestoneId: string) => ({
  id,
  name,
  creator: 'GOWNER',
  amount: '5000',
  status: 'active',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-12-31T00:00:00.000Z',
  verifier: 'GVERIFIER',
  successDestination: 'GSUCCESS',
  failureDestination: 'GFAILURE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  milestones: [
    {
      id: milestoneId,
      title: `${name} milestone`,
      amount: '2500',
      dueDate: '2026-06-01',
      status: 'pending',
    },
  ],
});

const apiQueue = () => [apiVault('vault-1', 'API Vault One', 'm-1'), apiVault('vault-2', 'API Vault Two', 'm-2')];

const postCalls = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.filter((call) => ((call[1] as RequestInit | undefined)?.method ?? 'GET') === 'POST');

describe('Verifier Flow Integration Tests', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('Approve flow', () => {
    it('approves a pending task and it appears in history with correct status and notes', async () => {
      render(
        <MemoryRouter initialEntries={['/verifier/queue']}>
          <Routes>
            <Route path="/verifier/queue" element={<PendingValidations />} />
            <Route path="/verifier/queue/:vaultId" element={<ValidationDetail />} />
            <Route path="/verifier/history" element={<ValidationHistory />} />
          </Routes>
        </MemoryRouter>
      );

      // Verify initial state: 2 pending tasks
      expect(screen.getByText('Q3 Development Fund')).toBeInTheDocument();
      expect(screen.getByText('Community Grant #42')).toBeInTheDocument();

      // Click Review on the Q3 Development Fund task (v-101)
      clickReviewFor('Q3 Development Fund');

      // Should navigate to ValidationDetail for v-101
      await waitFor(() => {
        expect(screen.getByText('Review Milestone')).toBeInTheDocument();
        expect(screen.getByText('Task ID: v-101')).toBeInTheDocument();
      });

      // Check all criteria to enable approve button
      const criteriaCheckboxes = screen.getAllByRole('checkbox');
      criteriaCheckboxes.forEach(checkbox => {
        if (!checkbox.checked) {
          fireEvent.click(checkbox);
        }
      });

      // Add verification notes
      const notesArea = screen.getByPlaceholderText(/Start adding your review notes here/i);
      fireEvent.change(notesArea, { target: { value: 'All criteria met, deployment verified.' } });

      // Click Approve Milestone
      fireEvent.click(screen.getByRole('button', { name: /Approve Milestone/i }));

      // Confirm approval in modal
      const confirmBtn = screen.getByRole('button', { name: /Confirm Approve/i });
      fireEvent.click(confirmBtn);

      // Should navigate back to queue
      await waitFor(() => {
        expect(screen.getByText('Pending Validations')).toBeInTheDocument();
      });

      // Verify pending count decreased from 2 to 1
      expect(screen.queryByText('Q3 Development Fund')).not.toBeInTheDocument();
      expect(screen.getByText('Community Grant #42')).toBeInTheDocument();

      // Navigate to history
      const historyButton = screen.getByRole('button', { name: /View History/i });
      fireEvent.click(historyButton);

      // Should navigate to ValidationHistory
      await waitFor(() => {
        expect(screen.getByText('Validation History')).toBeInTheDocument();
      });

      // Verify the approved task appears in history
      expect(screen.getByText('Q3 Development Fund')).toBeInTheDocument();
      
      // Verify status is approved
      const approvedTask = screen.getByText('Q3 Development Fund').closest('div');
      expect(approvedTask?.textContent).toContain('approved');

      // Verify notes are present
      expect(screen.getByText(/All criteria met, deployment verified./)).toBeInTheDocument();
    });

    it('pending count decrements after approval', async () => {
      render(
        <MemoryRouter initialEntries={['/verifier/queue']}>
          <Routes>
            <Route path="/verifier/queue" element={<PendingValidations />} />
            <Route path="/verifier/queue/:vaultId" element={<ValidationDetail />} />
            <Route path="/verifier/history" element={<ValidationHistory />} />
          </Routes>
        </MemoryRouter>
      );

      // Get initial pending count from store
      const initialPending = useVerifierStore.getState().pendingValidations.length;
      expect(initialPending).toBe(2);

      // Navigate to detail and approve
      const reviewButtons = screen.getAllByRole('button', { name: /Review/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Review Milestone')).toBeInTheDocument();
      });

      // Approve without criteria (task v-101 has criteria, but let's test v-102 which might not)
      // Actually, let's just check all criteria
      const criteriaCheckboxes = screen.getAllByRole('checkbox');
      criteriaCheckboxes.forEach(checkbox => {
        if (!checkbox.checked) {
          fireEvent.click(checkbox);
        }
      });

      fireEvent.click(screen.getByRole('button', { name: /Approve Milestone/i }));
      fireEvent.click(screen.getByRole('button', { name: /Confirm Approve/i }));

      await waitFor(() => {
        expect(screen.getByText('Pending Validations')).toBeInTheDocument();
      });

      // Verify pending count decreased
      const finalPending = useVerifierStore.getState().pendingValidations.length;
      expect(finalPending).toBe(1);
      expect(finalPending).toBe(initialPending - 1);
    });
  });

  describe('Reject flow', () => {
    it('rejects a pending task and it appears in history with rejected status', async () => {
      render(
        <MemoryRouter initialEntries={['/verifier/queue']}>
          <Routes>
            <Route path="/verifier/queue" element={<PendingValidations />} />
            <Route path="/verifier/queue/:vaultId" element={<ValidationDetail />} />
            <Route path="/verifier/history" element={<ValidationHistory />} />
          </Routes>
        </MemoryRouter>
      );

      // Click Review on the Q3 Development Fund task (v-101)
      clickReviewFor('Q3 Development Fund');

      await waitFor(() => {
        expect(screen.getByText('Review Milestone')).toBeInTheDocument();
      });

      // Click Reject Milestone
      fireEvent.click(screen.getByRole('button', { name: /Reject Milestone/i }));

      // Add rejection notes in modal
      const modalNotesArea = screen.getByPlaceholderText(/Reason for rejection is required/i);
      fireEvent.change(modalNotesArea, { target: { value: 'Deployment URL not accessible.' } });

      // Confirm rejection
      const confirmBtn = screen.getByRole('button', { name: /Confirm Reject/i });
      fireEvent.click(confirmBtn);

      // Should navigate back to queue
      await waitFor(() => {
        expect(screen.getByText('Pending Validations')).toBeInTheDocument();
      });

      // Navigate to history
      fireEvent.click(screen.getByRole('button', { name: /View History/i }));

      await waitFor(() => {
        expect(screen.getByText('Validation History')).toBeInTheDocument();
      });

      // Verify the rejected task appears in history
      const historyRow = screen.getByText('Q3 Development Fund').closest('div.p-6');
      if (!historyRow) throw new Error('Could not find history row for Q3 Development Fund');

      // Verify status is rejected (scoped to this row - "Rejected" also
      // appears in the outcome filter dropdown elsewhere on the page)
      expect(within(historyRow).getByText('Rejected')).toBeInTheDocument();

      // Verify rejection notes are present
      expect(screen.getByText(/Deployment URL not accessible./)).toBeInTheDocument();
    });

    it('reject without notes is blocked by modal validation', async () => {
      render(
        <MemoryRouter initialEntries={['/verifier/queue']}>
          <Routes>
            <Route path="/verifier/queue" element={<PendingValidations />} />
            <Route path="/verifier/queue/:vaultId" element={<ValidationDetail />} />
            <Route path="/verifier/history" element={<ValidationHistory />} />
          </Routes>
        </MemoryRouter>
      );

      // Navigate to first task detail
      const reviewButtons = screen.getAllByRole('button', { name: /Review/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Review Milestone')).toBeInTheDocument();
      });

      // Click Reject Milestone
      fireEvent.click(screen.getByRole('button', { name: /Reject Milestone/i }));

      // Modal opens — confirm button should be disabled without notes
      const confirmBtn = screen.getByRole('button', { name: /Confirm Reject/i });
      expect(confirmBtn).toBeDisabled();

      // Verify the validation message is shown
      expect(screen.getByText(/Notes are required for rejection./)).toBeInTheDocument();

      // Store state should remain unchanged (task still in pending)
      const pendingCount = useVerifierStore.getState().pendingValidations.length;
      expect(pendingCount).toBe(2);
    });

    it('reject button is enabled regardless of criteria gate (no criteria check needed)', async () => {
      render(
        <MemoryRouter initialEntries={['/verifier/queue']}>
          <Routes>
            <Route path="/verifier/queue" element={<PendingValidations />} />
            <Route path="/verifier/queue/:vaultId" element={<ValidationDetail />} />
            <Route path="/verifier/history" element={<ValidationHistory />} />
          </Routes>
        </MemoryRouter>
      );

      // Navigate to first task detail (has 3 criteria)
      const reviewButtons = screen.getAllByRole('button', { name: /Review/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Review Milestone')).toBeInTheDocument();
      });

      // Approve button should be disabled (criteria not checked)
      const approveBtn = screen.getByRole('button', { name: /Approve Milestone/i });
      expect(approveBtn).toBeDisabled();

      // Reject button should be enabled (no criteria gate)
      const rejectBtn = screen.getByRole('button', { name: /Reject Milestone/i });
      expect(rejectBtn).toBeEnabled();
    });
  });
});

describe('Verifier Flow — API-backed queue', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetStore();
    useVerifierStore.setState({ validationHistory: [] });
    vi.stubEnv('VITE_API', 'https://api.test/api');
    clearCache();
    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      if (method === 'GET' && url.endsWith('/vaults')) return apiResponse(apiQueue());
      if (method === 'POST') return apiResponse({});
      return apiResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    clearCache();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('loads pending tasks from the API instead of fixtures', async () => {
    render(
      <MemoryRouter initialEntries={['/verifier/queue']}>
        <Routes>
          <Route path="/verifier/queue" element={<PendingValidations />} />
          <Route path="/verifier/queue/:vaultId" element={<ValidationDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('API Vault One')).toBeInTheDocument();
    expect(screen.getByText('API Vault Two')).toBeInTheDocument();
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://api.test/api/vaults');
    expect(useVerifierStore.getState().pendingValidations.map((task) => task.id)).toEqual([
      'vault-1:m-1',
      'vault-2:m-2',
    ]);
  });

  it('approves both selected tasks, reports the failed one, and keeps it selected', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      if (method === 'GET' && url.endsWith('/vaults')) return apiResponse(apiQueue());
      if (method === 'POST' && url.includes('/vaults/vault-2/')) {
        return {
          ok: false,
          status: 409,
          json: async () => ({ error: 'Conflict on second task' }),
        };
      }
      if (method === 'POST') return apiResponse({});
      return apiResponse({}, 404);
    });

    render(
      <MemoryRouter initialEntries={['/verifier/queue']}>
        <Routes>
          <Route path="/verifier/queue" element={<PendingValidations />} />
          <Route path="/verifier/queue/:vaultId" element={<ValidationDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('API Vault One')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Select API Vault One'));
    fireEvent.click(screen.getByLabelText('Select API Vault Two'));
    fireEvent.click(screen.getByRole('button', { name: /Approve Selected/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Approve/i }));

    await waitFor(() => expect(postCalls(fetchMock)).toHaveLength(2));
    expect(useVerifierStore.getState().validationHistory.map((task) => task.id)).toEqual([
      'vault-1:m-1',
    ]);
    expect(useVerifierStore.getState().pendingValidations.map((task) => task.id)).toEqual([
      'vault-2:m-2',
    ]);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('vault-2:m-2');
    expect(alert).toHaveTextContent('Conflict on second task');
    expect(screen.getByLabelText('Select API Vault Two')).toBeChecked();
  });

  it('sends a single POST for rapid confirm clicks on one task', async () => {
    render(
      <MemoryRouter initialEntries={[`/verifier/queue/${encodeURIComponent('vault-1:m-1')}`]}>
        <Routes>
          <Route path="/verifier/queue" element={<PendingValidations />} />
          <Route path="/verifier/queue/:vaultId" element={<ValidationDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Review Milestone')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Approve Milestone/i }));
    const confirm = screen.getByRole('button', { name: /Confirm Approve/i });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    await waitFor(() => expect(postCalls(fetchMock)).toHaveLength(1));
    expect(String(postCalls(fetchMock)[0][0])).toBe(
      'https://api.test/api/vaults/vault-1/milestones/m-1/validate',
    );
    await waitFor(() => {
      expect(useVerifierStore.getState().validationHistory.map((task) => task.id)).toEqual([
        'vault-1:m-1',
      ]);
    });
  });

  it('does not call the API when VITE_API is unset', async () => {
    vi.stubEnv('VITE_API', '');
    const offlineFetch = vi.fn();
    vi.stubGlobal('fetch', offlineFetch);

    render(
      <MemoryRouter initialEntries={['/verifier/queue']}>
        <Routes>
          <Route path="/verifier/queue" element={<PendingValidations />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Q3 Development Fund')).toBeInTheDocument();
    expect(offlineFetch).not.toHaveBeenCalled();
  });
});
