import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PendingValidations from '../PendingValidations';
import ValidationDetail from '../ValidationDetail';
import ValidationHistory from '../ValidationHistory';
import { useVerifierStore } from '../../Zustand/Store';

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
        daysRemaining: 16,
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
        daysRemaining: 3,
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
        daysRemaining: 0,
        status: 'approved',
        milestone: 'Smart Contract Security Audit',
        notes: 'Audit looks solid, all critical issues addressed.',
      }
    ],
  });
}

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

      // Click Review on the first task (v-101)
      const reviewButtons = screen.getAllByRole('button', { name: /Review/i });
      fireEvent.click(reviewButtons[0]);

      // Should navigate to ValidationDetail for v-101
      await waitFor(() => {
        expect(screen.getByText('Review Milestone')).toBeInTheDocument();
        expect(screen.getByText('Task ID: v-101')).toBeInTheDocument();
      });

      // Check all criteria to enable approve button
      const criteriaCheckboxes = screen.getAllByRole('checkbox');
      criteriaCheckboxes.forEach(checkbox => {
        if (!(checkbox as HTMLInputElement).checked) {
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
      expect(screen.getByText('Q3 Development Fund')).not.toBeInTheDocument();
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
        if (!(checkbox as HTMLInputElement).checked) {
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

      // Click Review on the first task
      const reviewButtons = screen.getAllByRole('button', { name: /Review/i });
      fireEvent.click(reviewButtons[0]);

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
      expect(screen.getByText('Q3 Development Fund')).toBeInTheDocument();
      
      // Verify status is rejected
      expect(screen.getByText('rejected')).toBeInTheDocument();

      // Verify rejection notes are present
      expect(screen.getByText(/Deployment URL not accessible./)).toBeInTheDocument();
    });
  });

  describe('Batch approve flow', () => {
    it('batch approves multiple tasks and they appear in history', async () => {
      render(
        <MemoryRouter initialEntries={['/verifier/queue']}>
          <Routes>
            <Route path="/verifier/queue" element={<PendingValidations />} />
            <Route path="/verifier/history" element={<ValidationHistory />} />
          </Routes>
        </MemoryRouter>
      );

      // Select all tasks
      const selectAllCheckbox = screen.getByLabelText(/Select all validations/i);
      fireEvent.click(selectAllCheckbox);

      // Click batch approve
      const batchApproveBtn = screen.getByRole('button', { name: /Approve Selected/i });
      expect(batchApproveBtn).not.toBeDisabled();
      fireEvent.click(batchApproveBtn);

      // Confirm batch approval in modal
      const confirmBtn = screen.getByRole('button', { name: /Confirm Approve/i });
      fireEvent.click(confirmBtn);

      // Should stay on queue but with no pending tasks
      await waitFor(() => {
        expect(screen.getByText('All caught up!')).toBeInTheDocument();
      });

      // Navigate to history
      fireEvent.click(screen.getByRole('button', { name: /View History/i }));

      await waitFor(() => {
        expect(screen.getByText('Validation History')).toBeInTheDocument();
      });

      // Verify both tasks appear in history
      expect(screen.getByText('Q3 Development Fund')).toBeInTheDocument();
      expect(screen.getByText('Community Grant #42')).toBeInTheDocument();

      // Verify pending count is now 0
      const finalPending = useVerifierStore.getState().pendingValidations.length;
      expect(finalPending).toBe(0);

      // Verify history count increased by 2
      const historyCount = useVerifierStore.getState().validationHistory.length;
      expect(historyCount).toBe(3); // 1 initial + 2 batch approved
    });
  });

  describe('Navigation edge cases', () => {
    it('navigating before mutation does not affect store state', async () => {
      render(
        <MemoryRouter initialEntries={['/verifier/queue']}>
          <Routes>
            <Route path="/verifier/queue" element={<PendingValidations />} />
            <Route path="/verifier/queue/:vaultId" element={<ValidationDetail />} />
            <Route path="/verifier/history" element={<ValidationHistory />} />
          </Routes>
        </MemoryRouter>
      );

      // Navigate to detail
      const reviewButtons = screen.getAllByRole('button', { name: /Review/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Review Milestone')).toBeInTheDocument();
      });

      // Navigate back without taking action
      fireEvent.click(screen.getByText(/Back to Queue/i));

      await waitFor(() => {
        expect(screen.getByText('Pending Validations')).toBeInTheDocument();
      });

      // Verify store state unchanged
      const pendingCount = useVerifierStore.getState().pendingValidations.length;
      expect(pendingCount).toBe(2);

      const historyCount = useVerifierStore.getState().validationHistory.length;
      expect(historyCount).toBe(1);
    });

    it('navigating after mutation shows updated state across pages', async () => {
      render(
        <MemoryRouter initialEntries={['/verifier/queue']}>
          <Routes>
            <Route path="/verifier/queue" element={<PendingValidations />} />
            <Route path="/verifier/queue/:vaultId" element={<ValidationDetail />} />
            <Route path="/verifier/history" element={<ValidationHistory />} />
          </Routes>
        </MemoryRouter>
      );

      // Approve a task
      const reviewButtons = screen.getAllByRole('button', { name: /Review/i });
      fireEvent.click(reviewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Review Milestone')).toBeInTheDocument();
      });

      const criteriaCheckboxes = screen.getAllByRole('checkbox');
      criteriaCheckboxes.forEach(checkbox => {
        if (!(checkbox as HTMLInputElement).checked) {
          fireEvent.click(checkbox);
        }
      });

      fireEvent.click(screen.getByRole('button', { name: /Approve Milestone/i }));
      fireEvent.click(screen.getByRole('button', { name: /Confirm Approve/i }));

      await waitFor(() => {
        expect(screen.getByText('Pending Validations')).toBeInTheDocument();
      });

      // Navigate to history and back
      fireEvent.click(screen.getByRole('button', { name: /View History/i }));

      await waitFor(() => {
        expect(screen.getByText('Validation History')).toBeInTheDocument();
      });

      // Navigate back to queue
      fireEvent.click(screen.getByText(/Back to Dashboard/i));

      await waitFor(() => {
        expect(screen.getByText('Verifier Dashboard')).toBeInTheDocument();
      });

      // Navigate to queue again
      fireEvent.click(screen.getByRole('button', { name: /View Pending Queue/i }));

      await waitFor(() => {
        expect(screen.getByText('Pending Validations')).toBeInTheDocument();
      });

      // Verify state persists - only 1 pending task remains
      expect(screen.getByText('Community Grant #42')).toBeInTheDocument();
      expect(screen.queryByText('Q3 Development Fund')).not.toBeInTheDocument();
    });
  });

  describe('Store isolation between tests', () => {
    it('each test starts with fresh store state', () => {
      // This test verifies that the beforeEach reset works
      const state = useVerifierStore.getState();
      expect(state.pendingValidations.length).toBe(2);
      expect(state.validationHistory.length).toBe(1);
      expect(state.pendingValidations[0].id).toBe('v-101');
      expect(state.pendingValidations[1].id).toBe('v-102');
    });
  });
});
