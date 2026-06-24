import { useNavigate } from 'react-router-dom';
import { Text } from '../components/Text';
import { useVerifierStore } from '../Zustand/Store';

const tokenStyles = {
  mutedText: { color: 'var(--muted)' },
  surfacePanel: { background: 'var(--surface)', borderColor: 'var(--border)' },
  raisedPanel: { background: 'var(--surface-raised)', borderColor: 'var(--border)' },
  primaryButton: { background: 'var(--accent)', color: 'var(--bg)' },
  secondaryButton: { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' },
  accentText: { color: 'var(--accent)' },
};

export default function VerifierDashboard() {
  const navigate = useNavigate();
  
  // Pull our mock data from the Zustand store
  const { pendingValidations, validationHistory } = useVerifierStore();

  // Calculate high-level stats
  const totalPending = pendingValidations.length;
  const totalCompleted = validationHistory.length;
  const totalAssigned = totalPending + totalCompleted;

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="mb-4">
        <Text role="display" as="h1">Verifier Dashboard</Text>
        <Text role="body" as="p" className="mt-1" style={tokenStyles.mutedText}>
          Overview of your assigned vaults and validation activity.
        </Text>
      </header>

      {/* Overview Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 border rounded-lg shadow-sm" style={tokenStyles.surfacePanel}>
          <Text role="body" as="p" className="mb-2" style={tokenStyles.mutedText}>Total Assigned</Text>
          <Text role="display" as="h1">{totalAssigned}</Text>
        </div>
        <div
          className="p-6 border rounded-lg shadow-sm"
          style={{
            ...tokenStyles.surfacePanel,
            borderLeftWidth: 'var(--border-width-4)',
            borderLeftColor: 'var(--accent)',
          }}
        >
          <Text role="body" as="p" className="mb-2" style={tokenStyles.mutedText}>Pending Validations</Text>
          <Text role="display" as="h1">{totalPending}</Text>
        </div>
        <div
          className="p-6 border rounded-lg shadow-sm"
          style={{
            ...tokenStyles.surfacePanel,
            borderLeftWidth: 'var(--border-width-4)',
            borderLeftColor: 'var(--success)',
          }}
        >
          <Text role="body" as="p" className="mb-2" style={tokenStyles.mutedText}>Completed</Text>
          <Text role="display" as="h1">{totalCompleted}</Text>
        </div>
      </section>

      {/* Quick Actions / Navigation */}
      <section className="flex gap-4 mt-4">
        <button 
          onClick={() => navigate('/verifier/queue')}
          className="px-6 py-3 font-medium rounded transition"
          style={tokenStyles.primaryButton}
        >
          View Pending Queue
        </button>
        <button 
          onClick={() => navigate('/verifier/history')}
          className="px-6 py-3 border font-medium rounded transition"
          style={tokenStyles.secondaryButton}
        >
          View History
        </button>
      </section>

      {/* Recent / Urgent Activity Snippet */}
      <section className="mt-8">
        <Text role="display" as="h2" className="mb-4">Urgent Pending Validations</Text>
        <div className="flex flex-col gap-3">
          {pendingValidations.length === 0 ? (
            <div
              className="p-8 border rounded shadow-sm text-center"
              style={{ ...tokenStyles.raisedPanel, ...tokenStyles.mutedText }}
            >
              <Text role="body" as="p">You have no pending validations at this time.</Text>
            </div>
          ) : (
            pendingValidations.slice(0, 3).map((task) => (
              <div 
                key={task.id} 
                className="p-4 border rounded shadow-sm flex flex-col md:flex-row justify-between md:items-center hover:shadow-md transition gap-4"
                style={tokenStyles.surfacePanel}
              >
                <div>
                  <Text role="body" as="h3">{task.vaultName}</Text>
                  <Text role="body" as="p" className="text-sm mt-1" style={tokenStyles.mutedText}>
                    Milestone: {task.milestone}
                  </Text>
                </div>
                <div className="text-left md:text-right">
                  <Text 
                    role="body" 
                    as="p"
                    className="font-bold"
                    style={{ color: task.daysRemaining <= 3 ? 'var(--danger)' : 'var(--text)' }}
                  >
                    {task.daysRemaining <= 3 ? 'Urgent: ' : ''}{task.daysRemaining} days left
                  </Text>
                  <button 
                    onClick={() => navigate(`/verifier/queue/${task.id}`)}
                    className="font-medium text-sm mt-2"
                    style={tokenStyles.accentText}
                  >
                    Review Now &rarr;
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
