import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CountdownDeadline } from '../components/CountdownDeadline';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Text } from '../components/Text';
import { useVerifierStore } from '../Zustand/Store';
import { StatusChip } from '../components/StatusChip';
import { filterPending, PendingTask } from '../utils/filterPending';

export default function PendingValidations() {
  const navigate = useNavigate();
  const { pendingValidations, batchApprove, batchReject } = useVerifierStore();

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Multi-select state for batch actions.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'approve' | 'reject'>('approve');
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Get unique milestones from all pending validations
  const availableMilestones = useMemo(() => {
    const milestones = new Set(pendingValidations.map((t) => t.milestone));
    return Array.from(milestones).sort();
  }, [pendingValidations]);

  // Apply filters first, then sort
  const filteredValidations = useMemo(() => {
    return filterPending(pendingValidations, {
      query: searchQuery,
      milestone: selectedMilestone,
    });
  }, [pendingValidations, searchQuery, selectedMilestone]);

  const sortedValidations = useMemo(
    () =>
      [...filteredValidations].sort((a, b) =>
        sortOrder === 'asc'
          ? a.daysRemaining - b.daysRemaining
          : b.daysRemaining - a.daysRemaining,
      ),
    [filteredValidations, sortOrder],
  );

  // Keep selection in sync with the queue and reset it when the active filters change.
  useEffect(() => {
    setSelectedIds((prev) => {
      if (searchQuery || selectedMilestone) {
        return [];
      }

      const next = prev.filter((id) => pendingValidations.some((t) => t.id === id));
      return next.length === prev.length ? prev : next;
    });
  }, [pendingValidations, searchQuery, selectedMilestone]);

  const allIds = sortedValidations.map((t) => t.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  // Native checkboxes expose "indeterminate" only via the DOM property.
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : allIds);
  };

  const openBatch = (decision: 'approve' | 'reject') => {
    if (selectedIds.length === 0) return;
    setPendingDecision(decision);
    setModalOpen(true);
  };

  const handleConfirm = (decision: 'approve' | 'reject', notes: string) => {
    if (decision === 'approve') {
      batchApprove(selectedIds, notes);
    } else {
      batchReject(selectedIds, notes);
    }
    setSelectedIds([]);
    setModalOpen(false);
  };

  const hasSelection = selectedIds.length > 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-2">
        <div>
          <button
            onClick={() => navigate('/verifier')}
            className="mb-2 text-sm font-medium transition"
            style={{ color: 'var(--muted)' }}
          >
            &larr; Back to Dashboard
          </button>
          <Text role="display" as="h1">Pending Validations</Text>
          <Text role="body" as="p" className="mt-1" style={{ color: 'var(--muted)' }}>
            Review and validate milestones submitted by vault owners.
          </Text>
        </div>

        <button
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="px-4 py-2 border rounded text-sm font-medium transition"
          style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}
        >
          Sort by Urgency: {sortOrder === 'asc' ? 'High to Low' : 'Low to High'}
        </button>
      </header>

      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex-1">
          <label htmlFor="search-input" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
            Search by Vault Name or Owner
          </label>
          <input
            id="search-input"
            type="text"
            placeholder="Enter vault name or owner address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm transition"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
            }}
            aria-describedby="search-hint"
          />
          <Text role="body" as="p" className="text-xs mt-1" id="search-hint" style={{ color: 'var(--muted)' }}>
            Search is case-insensitive and searches across vault names and owner addresses.
          </Text>
        </div>

        <div className="flex-1">
          <label htmlFor="milestone-filter" className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
            Filter by Milestone
          </label>
          <select
            id="milestone-filter"
            value={selectedMilestone}
            onChange={(e) => setSelectedMilestone(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm transition"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
            }}
          >
            <option value="">All Milestones</option>
            {availableMilestones.map((milestone) => (
              <option key={milestone} value={milestone}>
                {milestone}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="border rounded-lg shadow-sm overflow-x-auto" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        {sortedValidations.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--muted)' }}>
            {pendingValidations.length === 0 ? (
              <>
                <Text role="body" as="h3">All caught up!</Text>
                <Text role="body" as="p" className="mt-2">There are no pending validations in your queue.</Text>
              </>
            ) : (
              <>
                <Text role="body" as="h3">No results found</Text>
                <Text role="body" as="p" className="mt-2">
                  No validations match your search filters. Try adjusting your search or milestone selection.
                </Text>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse" aria-label="Pending Validations">
            <thead>
              <tr className="border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <th scope="col" className="p-4 w-12">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    aria-label="Select all validations"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                  />
                </th>
                <th scope="col" className="p-4 font-medium text-sm" style={{ color: 'var(--muted)' }}>Vault & Milestone</th>
                <th scope="col" className="p-4 font-medium text-sm" style={{ color: 'var(--muted)' }}>Owner</th>
                <th scope="col" className="p-4 font-medium text-sm" style={{ color: 'var(--muted)' }}>Amount at Stake</th>
                <th scope="col" className="p-4 font-medium text-sm" style={{ color: 'var(--muted)' }} aria-sort={sortOrder === 'asc' ? 'ascending' : 'descending'}>Deadline</th>
                <th scope="col" className="p-4 font-medium text-sm text-right" style={{ color: 'var(--muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedValidations.map((task) => {
                const checked = selectedIds.includes(task.id);
                return (
                  <tr
                    key={task.id}
                    className="border-b transition"
                    style={{ borderColor: 'var(--border)', background: checked ? 'var(--accent-transparent)' : undefined }}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        aria-label={`Select ${task.vaultName}`}
                        checked={checked}
                        onChange={() => toggleOne(task.id)}
                        className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Text role="body" as="p" className="font-semibold" style={{ color: 'var(--text)' }}>{task.vaultName}</Text>
                        <StatusChip status="pending_validation" size="sm" />
                      </div>
                      <Text role="body" as="p" className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{task.milestone}</Text>
                    </td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-1 rounded font-mono" style={{ background: 'var(--surface-raised)', color: 'var(--text)' }}>
                        {task.owner}
                      </span>
                    </td>
                    <td className="p-4">
                      <Text role="body" as="p" className="font-medium" style={{ color: 'var(--text)' }}>{task.amount}</Text>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <Text role="body" as="p" className="text-sm">{task.deadline}</Text>
                        <span className="text-sm font-medium" style={{ color: task.daysRemaining <= 3 ? 'var(--danger)' : 'var(--success)' }}>
                          {task.daysRemaining} days left
                        </span>
                        {task.daysRemaining <= 3 && (
                          <span className="sr-only">Urgent</span>
                        )}
                        <CountdownDeadline deadline={task.deadline} />
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/verifier/queue/${task.id}`)}
                        className="px-4 py-2 rounded transition text-sm font-medium"
                        style={{ background: 'var(--accent-transparent)', color: 'var(--accent)' }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Sticky batch action bar */}
      <div
        role="region"
        aria-label="Batch actions"
        className="sticky bottom-4 mx-auto w-full max-w-2xl rounded-lg border px-4 py-3 shadow-lg flex items-center justify-between gap-4"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
      >
        <Text role="body" as="span" className="text-sm" style={{ color: 'var(--muted)' }}>
          {selectedIds.length} selected
        </Text>
        <div className="flex gap-3">
          <button
            onClick={() => openBatch('reject')}
            disabled={!hasSelection}
            className="px-4 py-2 text-sm font-medium rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--danger-transparent)', color: 'var(--danger)' }}
          >
            Reject Selected
          </button>
          <button
            onClick={() => openBatch('approve')}
            disabled={!hasSelection}
            className="px-4 py-2 text-sm font-bold rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--success)', color: 'white' }}
          >
            Approve Selected
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        initialDecision={pendingDecision}
        affectedCount={selectedIds.length}
      />
    </div>
  );
}
