import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Text } from "../components/Text";
import { useVerifierStore } from "../Zustand/Store";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { SafeLink } from "../components/SafeLink";
import "./VerifierPages.css";

export default function ValidationDetail() {
  const { vaultId } = useParams<{ vaultId: string }>();
  const navigate = useNavigate();

  // Pull data and actions from Zustand
  const { pendingValidations, approveValidation, rejectValidation } =
    useVerifierStore();

  // Local state for notes and the confirmation modal
  const [notes, setNotes] = useState("");
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Find the specific task based on the URL parameter
  const task = pendingValidations.find((t) => t.id === vaultId);

  if (!task) {
    return (
      <div className="verifier-detail__not-found">
        <Text role="display" as="h2">
          Validation Not Found
        </Text>
        <Text role="body" as="p" className="verifier-page__meta">
          This validation task may have already been processed or doesn't exist.
        </Text>
        <button
          onClick={() => navigate("/verifier/queue")}
          className="verifier-page__button verifier-detail__return-button"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  // Action Handlers
  const handleOpenModal = (action: "approve" | "reject") => {
    setConfirmAction(action);
    setIsModalOpen(true);
  };

  const executeAction = (
    decision: "approve" | "reject",
    modalNotes: string,
  ) => {
    if (decision === "approve") {
      approveValidation(task.id, modalNotes);
    } else if (decision === "reject") {
      rejectValidation(task.id, modalNotes);
    }
    setIsModalOpen(false);
    navigate("/verifier/queue"); // Send them back to the list
  };

  return (
    <div className="verifier-page">
      <header>
        <button
          onClick={() => navigate("/verifier/queue")}
          className="verifier-page__link-button"
        >
          &larr; Back to Queue
        </button>
        <div className="verifier-detail__header-row">
          <div>
            <Text role="display" as="h1">
              Review Milestone
            </Text>
            <Text role="body" as="p" className="verifier-page__meta">
              Task ID: {task.id}
            </Text>
          </div>
          <div
            className={`verifier-detail__deadline-badge ${
              task.daysRemaining <= 3 ? "is-urgent" : ""
            }`}
          >
            Deadline: {task.daysRemaining} days remaining
          </div>
        </div>
      </header>

      <div className="verifier-detail__grid">
        {/* Left Column: Details & Evidence */}
        <div className="verifier-detail__main">
          <section className="verifier-detail__card">
            <Text
              role="display"
              as="h2"
              className="verifier-detail__section-title"
            >
              Vault Summary
            </Text>
            <div className="verifier-detail__summary-grid">
              <div>
                <Text
                  role="body"
                  as="p"
                  className="verifier-detail__field-label"
                >
                  Vault Name
                </Text>
                <Text
                  role="body"
                  as="p"
                  className="verifier-detail__field-value"
                >
                  {task.vaultName}
                </Text>
              </div>
              <div>
                <Text
                  role="body"
                  as="p"
                  className="verifier-detail__field-label"
                >
                  Owner Wallet
                </Text>
                <span className="verifier-detail__wallet">{task.owner}</span>
              </div>
              <div>
                <Text
                  role="body"
                  as="p"
                  className="verifier-detail__field-label"
                >
                  Amount at Stake
                </Text>
                <Text role="body" as="p" className="verifier-detail__amount">
                  {task.amount}
                </Text>
              </div>
              <div>
                <Text
                  role="body"
                  as="p"
                  className="verifier-detail__field-label"
                >
                  Deadline Date
                </Text>
                <Text
                  role="body"
                  as="p"
                  className="verifier-detail__field-value"
                >
                  {task.deadline}
                </Text>
              </div>
            </div>
          </section>

          <section className="verifier-detail__card">
            <Text
              role="display"
              as="h2"
              className="verifier-detail__section-title"
            >
              Milestone Evidence
            </Text>
            <div className="verifier-detail__evidence-box">
              <Text
                role="body"
                as="p"
                className="verifier-detail__evidence-label"
              >
                Target Milestone:
              </Text>
              <Text role="body" as="p">
                {task.milestone}
              </Text>
            </div>

            <Text
              role="body"
              as="p"
              className="verifier-detail__evidence-label"
            >
              Submitted Proof:
            </Text>
            {task.evidenceUrl ? (
              <SafeLink
                href={task.evidenceUrl}
                className="verifier-detail__evidence-link"
              >
                &#128279; View Attached Evidence
              </SafeLink>
            ) : (
              <Text role="body" as="p" className="verifier-detail__no-evidence">
                No evidence link provided.
              </Text>
            )}
          </section>
        </div>

        {/* Right Column: Verification Actions */}
        <div className="verifier-detail__side">
          <section className="verifier-detail__card verifier-detail__actions-card">
            <Text
              role="display"
              as="h2"
              className="verifier-detail__section-title"
            >
              Verification Actions
            </Text>

            <label className="verifier-detail__notes-label">
              <Text
                role="body"
                as="span"
                className="verifier-detail__field-value"
              >
                Initial Verification Notes (Optional)
              </Text>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Start adding your review notes here..."
                className="verifier-detail__textarea"
              />
            </label>

            <div className="verifier-detail__action-stack">
              <button
                onClick={() => handleOpenModal("approve")}
                className="verifier-detail__action-button verifier-detail__action-button--approve"
              >
                Approve Milestone
              </button>
              <button
                onClick={() => handleOpenModal("reject")}
                className="verifier-detail__action-button verifier-detail__action-button--reject"
              >
                Reject Milestone
              </button>
            </div>
          </section>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={executeAction}
        initialDecision={confirmAction || undefined}
        initialNotes={notes}
        evidenceUrl={task.evidenceUrl}
      />
    </div>
  );
}
