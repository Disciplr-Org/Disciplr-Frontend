import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CountdownDeadline } from '../components/CountdownDeadline';
import { Text } from '../components/Text';
import { useVerifierStore } from '../Zustand/Store';

const tokenStyles = {
  mutedText: { color: 'var(--muted)' },
  surfacePanel: { background: 'var(--surface)', borderColor: 'var(--border)' },
  raisedPanel: { background: 'var(--surface-raised)', borderColor: 'var(--border)' },
  textPanel: { color: 'var(--text)' },
  primaryButton: { background: 'var(--accent)', color: 'var(--bg)' },
  secondaryButton: { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' },
};

export default function PendingValidations() {
  const navigate = useNavigate();
  const { pendingValidations } = useVerifierStore();

  // Optional: Simple state to handle sorting by days remaining
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedValidations = [...pendingValidations].sort((a, b) => {
    return sortOrder === 'asc' 
      ? a.daysRemaining - b.daysRemaining 
      : b.daysRemaining - a.daysRemaining;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-2">
        <div>
          <button
            onClick={() => navigate('/verifier')}
            className="mb-2 text-sm font-medium transition"
            style={tokenStyles.mutedText}
          >
            &larr; Back to Dashboard
          </button>
          <Text role="display" as="h1">Pending Validations</Text>
          <Text role="body" as="p" className="mt-1" style={tokenStyles.mutedText}>
            Review and validate milestones submitted by vault owners.
          </Text>
        </div>

        <button
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="px-4 py-2 border rounded text-sm font-medium transition"
          style={tokenStyles.secondaryButton}
        >
          Sort by Urgency: {sortOrder === 'asc' ? 'High to Low' : 'Low to High'}
        </button>
      </header>

      <section className="border rounded-lg shadow-sm overflow-x-auto" style={tokenStyles.surfacePanel}>
        {sortedValidations.length === 0 ? (
          <div className="p-12 text-center" style={tokenStyles.mutedText}>
            <Text role="body" as="h3">All caught up!</Text>
            <Text role="body" as="p" className="mt-2">There are no pending validations in your queue.</Text>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={tokenStyles.raisedPanel}>
                <th className="p-4 font-medium text-sm" style={tokenStyles.mutedText}>Vault & Milestone</th>
                <th className="p-4 font-medium text-sm" style={tokenStyles.mutedText}>Owner</th>
                <th className="p-4 font-medium text-sm" style={tokenStyles.mutedText}>Amount at Stake</th>
                <th className="p-4 font-medium text-sm" style={tokenStyles.mutedText}>Deadline</th>
                <th className="p-4 font-medium text-sm text-right" style={tokenStyles.mutedText}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedValidations.map((task) => (
                <tr key={task.id} className="border-b transition" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-4">
                    <Text role="body" as="p" className="font-semibold" style={tokenStyles.textPanel}>{task.vaultName}</Text>
                    <Text role="body" as="p" className="text-sm mt-1" style={tokenStyles.mutedText}>{task.milestone}</Text>
                  </td>
                  <td className="p-4">
                    <span className="text-xs px-2 py-1 rounded font-mono" style={{ ...tokenStyles.raisedPanel, ...tokenStyles.textPanel }}>
                      {task.owner}
                    </span>
                  </td>
                  <td className="p-4">
                    <Text role="body" as="p" className="font-medium" style={tokenStyles.textPanel}>{task.amount}</Text>
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
                      className="px-4 py-2 rounded transition text-sm font-medium"
                      style={tokenStyles.primaryButton}
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
    </div>
  );
}
