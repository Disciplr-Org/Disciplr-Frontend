import { useNavigate } from 'react-router-dom';
import { Text } from '../components/Text';
import { useVerifierStore } from '../Zustand/Store';
import './VerifierPages.css';

export default function VerifierDashboard() {
  const navigate = useNavigate();
  
  // Pull our mock data from the Zustand store
  const { pendingValidations, validationHistory } = useVerifierStore();

  // Calculate high-level stats
  const totalPending = pendingValidations.length;
  const totalCompleted = validationHistory.length;
  const totalAssigned = totalPending + totalCompleted;

  return (
    <div className="verifier-dashboard">
      <header className="verifier-dashboard__header">
        <Text role="display" as="h1">Verifier Dashboard</Text>
        <Text role="body" as="p" className="verifier-dashboard__lede">
          Overview of your assigned vaults and validation activity.
        </Text>
      </header>

      {/* Overview Stats Cards */}
      <section className="verifier-dashboard__stats" aria-label="Validation statistics">
        <div className="verifier-dashboard__stat-card">
          <Text role="body" as="p" className="verifier-dashboard__stat-label">Total Assigned</Text>
          <Text role="display" as="h1">{totalAssigned}</Text>
        </div>
        <div className="verifier-dashboard__stat-card verifier-dashboard__stat-card--pending">
          <Text role="body" as="p" className="verifier-dashboard__stat-label">Pending Validations</Text>
          <Text role="display" as="h1">{totalPending}</Text>
        </div>
        <div className="verifier-dashboard__stat-card verifier-dashboard__stat-card--completed">
          <Text role="body" as="p" className="verifier-dashboard__stat-label">Completed</Text>
          <Text role="display" as="h1">{totalCompleted}</Text>
        </div>
      </section>

      {/* Quick Actions / Navigation */}
      <section className="verifier-dashboard__actions" aria-label="Verifier navigation">
        <button 
          onClick={() => navigate('/verifier/queue')}
          className="verifier-dashboard__button verifier-dashboard__button--primary"
        >
          View Pending Queue
        </button>
        <button 
          onClick={() => navigate('/verifier/history')}
          className="verifier-dashboard__button verifier-dashboard__button--secondary"
        >
          View History
        </button>
      </section>

      {/* Recent / Urgent Activity Snippet */}
      <section className="verifier-dashboard__urgent">
        <Text role="display" as="h2" className="verifier-dashboard__section-title">Urgent Pending Validations</Text>
        <div className="verifier-dashboard__task-list">
          {pendingValidations.length === 0 ? (
            <div className="verifier-dashboard__empty-state">
              <Text role="body" as="p">You have no pending validations at this time.</Text>
            </div>
          ) : (
            pendingValidations.slice(0, 3).map((task) => (
              <div 
                key={task.id} 
                className="verifier-dashboard__task-card"
              >
                <div>
                  <Text role="body" as="h3">{task.vaultName}</Text>
                  <Text role="body" as="p" className="verifier-dashboard__task-meta">
                    Milestone: {task.milestone}
                  </Text>
                </div>
                <div className="verifier-dashboard__task-actions">
                  <Text 
                    role="body" 
                    as="p"
                    className={`verifier-dashboard__deadline ${task.daysRemaining <= 3 ? 'is-urgent' : ''}`}
                  >
                    {task.daysRemaining} days left
                  </Text>
                  <button 
                    onClick={() => navigate(`/verifier/queue/${task.id}`)}
                    className="verifier-dashboard__review-button"
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
