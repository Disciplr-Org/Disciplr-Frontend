import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { CountdownDeadline } from '../components/CountdownDeadline';
import { Text } from '../components/Text';
import { useVerifierStore } from '../Zustand/Store';

export default function PendingValidations() {
  const navigate = useNavigate();
  const { pendingValidations, batchApprove, batchReject } = useVerifierStore();
  const selectAllRef = useRef<HTMLInputElement>(null);
  
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);

  const sortedValidations = useMemo(() => [...pendingValidations].sort((a, b) => {
    return sortOrder === 'asc' 
      ? a.daysRemaining - b.daysRemaining 
      : b.daysRemaining - a.daysRemaining;
  }), [pendingValidations, sortOrder]);

  const visibleIds = useMemo(() => sortedValidations.map((task) => task.id), [sortedValidations]);
  const selectedCount = selectedIds.size;
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id)) && !allVisibleSelected;

  useEffect(() => {
    setSelectedIds((current) => {
      const pendingIds = new Set(pendingValidations.map((task) => task.id));
      const next = new Set([...current].filter((id) => pendingIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [pendingValidations]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  const toggleTaskSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const executeBatchAction = (decision: 'approve' | 'reject', notes: string) => {
    const ids = [...selectedIds].filter((id) => pendingValidations.some((task) => task.id === id));

    if (decision === 'approve') {
      batchApprove(ids, notes);
    } else {
      batchReject(ids, notes);
    }

    setSelectedIds(new Set());
    setConfirmAction(null);
  };

  const actionLabel = confirmAction === 'approve' ? 'approved' : 'rejected';
  const batchSummary = confirmAction
    ? `${selectedCount} ${selectedCount === 1 ? 'validation' : 'validations'} will be ${actionLabel}.`
    : undefined;

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-2">
        <div>
          <button 
            onClick={() => navigate('/verifier')}
            className="text-gray-500 hover:text-gray-800 mb-2 text-sm font-medium transition"
          >
            &larr; Back to Dashboard
          </button>
          <Text role="display" as="h1">Pending Validations</Text>
          <Text role="body" as="p" className="text-gray-500 mt-1">
            Review and validate milestones submitted by vault owners.
          </Text>
        </div>
        
        <button 
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition"
        >
          Sort by Urgency: {sortOrder === 'asc' ? 'High to Low' : 'Low to High'}
        </button>
      </header>

      <section
        aria-label="Batch validation actions"
        className="sticky top-0 z-10 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between"
      >
        <Text role="body" as="p" className="font-medium text-gray-700">
          {selectedCount} {selectedCount === 1 ? 'validation' : 'validations'} selected
        </Text>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setConfirmAction('approve')}
            disabled={selectedCount === 0}
            className="px-4 py-2 rounded bg-green-600 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batch Approve
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction('reject')}
            disabled={selectedCount === 0}
            className="px-4 py-2 rounded bg-red-600 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batch Reject
          </button>
        </div>
      </section>

      <section className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        {sortedValidations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Text role="body" as="h3">All caught up!</Text>
            <Text role="body" as="p" className="mt-2">There are no pending validations in your queue.</Text>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-medium text-sm text-gray-600">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    aria-label="Select all pending validations"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="p-4 font-medium text-sm text-gray-600">Vault & Milestone</th>
                <th className="p-4 font-medium text-sm text-gray-600">Owner</th>
                <th className="p-4 font-medium text-sm text-gray-600">Amount at Stake</th>
                <th className="p-4 font-medium text-sm text-gray-600">Deadline</th>
                <th className="p-4 font-medium text-sm text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedValidations.map((task) => (
                <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      aria-label={`Select ${task.vaultName}`}
                      checked={selectedIds.has(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-4">
                    <Text role="body" as="p" className="font-semibold text-gray-800">{task.vaultName}</Text>
                    <Text role="body" as="p" className="text-sm text-gray-500 mt-1">{task.milestone}</Text>
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-mono">
                      {task.owner}
                    </span>
                  </td>
                  <td className="p-4">
                    <Text role="body" as="p" className="font-medium text-gray-800">{task.amount}</Text>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <Text role="body" as="p" className="text-sm">{task.deadline}</Text>
                      <CountdownDeadline deadline={task.deadline} />
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => navigate(`/verifier/queue/${task.id}`)}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition text-sm font-medium"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <ConfirmationModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeBatchAction}
        initialDecision={confirmAction ?? undefined}
        summary={batchSummary}
      />
    </div>
  );
}
