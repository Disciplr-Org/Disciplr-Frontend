import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Text } from "../components/Text";
import { useVerifierStore } from "../Zustand/Store";
import "./VerifierPages.css";

export default function PendingValidations() {
  const navigate = useNavigate();
  const { pendingValidations } = useVerifierStore();

  // Optional: Simple state to handle sorting by days remaining
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const sortedValidations = [...pendingValidations].sort((a, b) => {
    return sortOrder === "asc"
      ? a.daysRemaining - b.daysRemaining
      : b.daysRemaining - a.daysRemaining;
  });

  return (
    <div className="verifier-page">
      <header className="verifier-page__header">
        <div>
          <button
            onClick={() => navigate("/verifier")}
            className="verifier-page__link-button"
          >
            &larr; Back to Dashboard
          </button>
          <Text role="display" as="h1">
            Pending Validations
          </Text>
          <Text role="body" as="p" className="verifier-page__lede">
            Review and validate milestones submitted by vault owners.
          </Text>
        </div>

        <button
          onClick={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
          className="verifier-page__button"
        >
          Sort by Urgency: {sortOrder === "asc" ? "High to Low" : "Low to High"}
        </button>
      </header>

      <section className="verifier-table-card">
        {sortedValidations.length === 0 ? (
          <div className="verifier-page__empty">
            <Text role="body" as="h3">
              All caught up!
            </Text>
            <Text role="body" as="p" className="verifier-page__lede">
              There are no pending validations in your queue.
            </Text>
          </div>
        ) : (
          <table className="verifier-table">
            <thead>
              <tr className="verifier-table__head-row">
                <th className="verifier-table__header">Vault & Milestone</th>
                <th className="verifier-table__header">Owner</th>
                <th className="verifier-table__header">Amount at Stake</th>
                <th className="verifier-table__header">Deadline</th>
                <th className="verifier-table__header verifier-table__header--actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedValidations.map((task) => (
                <tr key={task.id} className="verifier-table__row">
                  <td className="verifier-table__cell">
                    <Text role="body" as="p" className="verifier-table__title">
                      {task.vaultName}
                    </Text>
                    <Text
                      role="body"
                      as="p"
                      className="verifier-table__subtext"
                    >
                      {task.milestone}
                    </Text>
                  </td>
                  <td className="verifier-table__cell">
                    <span className="verifier-table__wallet">{task.owner}</span>
                  </td>
                  <td className="verifier-table__cell">
                    <Text role="body" as="p" className="verifier-table__amount">
                      {task.amount}
                    </Text>
                  </td>
                  <td className="verifier-table__cell">
                    <div className="verifier-table__deadline-cell">
                      <Text role="body" as="p">
                        {task.deadline}
                      </Text>
                      <span
                        className={`verifier-table__deadline ${
                          task.daysRemaining <= 3 ? "is-urgent" : ""
                        }`}
                      >
                        {task.daysRemaining} days left
                      </span>
                    </div>
                  </td>
                  <td className="verifier-table__cell verifier-table__cell--actions">
                    <button
                      onClick={() => navigate(`/verifier/queue/${task.id}`)}
                      className="verifier-table__review-button"
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
