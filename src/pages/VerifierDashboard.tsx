import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Text } from '../components/Text';
import { useVerifierStore } from '../Zustand/Store';

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
        <Text role="body" as="p" className="text-gray-500 mt-1">
          Overview of your assigned vaults and validation activity.
        </Text>
      </header>

      {/* Overview Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 border rounded-lg shadow-sm bg-white">
          <Text role="body" as="p" className="text-gray-500 mb-2">Total Assigned</Text>
          <Text role="display" as="h1">{totalAssigned}</Text>
        </div>
        <div className="p-6 border rounded-lg shadow-sm bg-white border-l-4 border-l-blue-500">
          <Text role="body" as="p" className="text-gray-500 mb-2">Pending Validations</Text>
          <Text role="display" as="h1">{totalPending}</Text>
        </div>
        <div className="p-6 border rounded-lg shadow-sm bg-white border-l-4 border-l-green-500">
          <Text role="body" as="p" className="text-gray-500 mb-2">Completed</Text>
          <Text role="display" as="h1">{totalCompleted}</Text>
        </div>
      </section>

      {/* Quick Actions / Navigation */}
      <section className="flex gap-4 mt-4">
        <button 
          onClick={() => navigate('/verifier/queue')}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
        >
          View Pending Queue
        </button>
        <button 
          onClick={() => navigate('/verifier/history')}
          className="px-6 py-3 border border-gray-300 font-medium rounded hover:bg-gray-50 transition"
        >
          View History
        </button>
      </section>

      {/* Recent / Urgent Activity Snippet */}
      <section className="mt-8">
        <Text role="display" as="h2" className="mb-4">Urgent Pending Validations</Text>
        <div className="flex flex-col gap-3">
          {pendingValidations.length === 0 ? (
            <div className="p-8 border rounded shadow-sm text-center text-gray-500 bg-gray-50">
              <Text role="body" as="p">You have no pending validations at this time.</Text>
            </div>
          ) : (
            pendingValidations.slice(0, 3).map((task) => (
              <div 
                key={task.id} 
                className="p-4 border rounded shadow-sm flex flex-col md:flex-row justify-between md:items-center bg-white hover:shadow-md transition gap-4"
              >
                <div>
                  <Text role="body" as="h3">{task.vaultName}</Text>
                  <Text role="body" as="p" className="text-sm text-gray-500 mt-1">
                    Milestone: {task.milestone}
                  </Text>
                </div>
                <div className="text-left md:text-right">
                  <Text 
                    role="body" 
                    as="p"
                    className={`font-bold ${task.daysRemaining <= 3 ? 'text-red-600' : 'text-gray-700'}`}
                  >
                    {task.daysRemaining} days left
                  </Text>
                  <button 
                    onClick={() => navigate(`/verifier/queue/${task.id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm mt-2"
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