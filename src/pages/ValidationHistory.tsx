import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Text } from '../components/Text';
import { useVerifierStore } from '../Zustand/Store';

export default function ValidationHistory() {
  const navigate = useNavigate();
  const { validationHistory } = useVerifierStore();

  // Calculate the Approve/Reject Ratio
  const total = validationHistory.length;
  const approvedCount = validationHistory.filter((t) => t.status === 'approved').length;
  const rejectedCount = validationHistory.filter((t) => t.status === 'rejected').length;
  const approvalRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="mb-2">
        <button 
          onClick={() => navigate('/verifier')}
          className="text-gray-500 hover:text-gray-800 mb-2 text-sm font-medium transition"
        >
          &larr; Back to Dashboard
        </button>
        <Text role="display" as="h1">Validation History</Text>
        <Text role="body" as="p" className="text-gray-500 mt-1">
          A complete log of your past milestone verifications and notes.
        </Text>
      </header>

      {/* Stats / Ratio Banner */}
      <section className="flex flex-col md:flex-row gap-4 bg-white p-6 border rounded-lg shadow-sm">
        <div className="flex-1">
          <Text role="body" as="p" className="text-gray-500">Total Validated</Text>
          <Text role="display" as="h2">{total}</Text>
        </div>
        <div className="flex-1">
          <Text role="body" as="p" className="text-gray-500">Approved</Text>
          <Text role="display" as="h2" className="text-green-600">{approvedCount}</Text>
        </div>
        <div className="flex-1">
          <Text role="body" as="p" className="text-gray-500">Rejected</Text>
          <Text role="display" as="h2" className="text-red-600">{rejectedCount}</Text>
        </div>
        <div className="flex-1">
          <Text role="body" as="p" className="text-gray-500">Approval Rate</Text>
          <Text role="display" as="h2">{approvalRate}%</Text>
        </div>
      </section>

      {/* History Log */}
      <section className="bg-white border rounded-lg shadow-sm overflow-hidden">
        {total === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Text role="body" as="h3">No History Found</Text>
            <Text role="body" as="p" className="mt-2">You haven't processed any validations yet.</Text>
          </div>
        ) : (
          <div className="flex flex-col">
            {validationHistory.map((task) => (
              <div 
                key={task.id} 
                className="p-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition flex flex-col md:flex-row gap-4 justify-between"
              >
                <div className="flex flex-col gap-2 md:w-1/3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      task.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {task.status}
                    </span>
                    <Text role="body" as="span" className="text-sm text-gray-500">ID: {task.id}</Text>
                  </div>
                  <Text role="body" as="h3">{task.vaultName}</Text>
                  <Text role="body" as="p" className="text-sm font-medium">{task.milestone}</Text>
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-mono w-max">
                    Owner: {task.owner}
                  </span>
                </div>

                <div className="md:w-2/3 bg-gray-50 p-4 rounded border text-sm text-gray-700">
                  <Text role="body" as="p" className="font-bold mb-1 text-xs uppercase text-gray-500">
                    Verification Notes:
                  </Text>
                  <Text role="body" as="p" className="italic">
                    "{task.notes || 'No notes provided during verification.'}"
                  </Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}