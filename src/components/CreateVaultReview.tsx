import { Text } from "./Text";
import { AddressDisplay } from "./AddressDisplay";

export interface CreateVaultReviewMilestone {
  title: string;
  criteria: string;
}

interface CreateVaultReviewProps {
  amount: string;
  deadline: string;
  successAddress: string;
  failureAddress: string;
  verifierAddress?: string;
  milestone?: string;
  milestones?: CreateVaultReviewMilestone[];
  onBack?: () => void;
  onConfirm?: () => void;
}

export function CreateVaultReview({
  amount,
  deadline,
  successAddress,
  failureAddress,
  verifierAddress,
  milestone,
  milestones,
  onBack,
  onConfirm,
}: CreateVaultReviewProps) {
  const reviewMilestones =
    milestones && milestones.length > 0
      ? milestones
      : milestone
        ? [{ title: milestone, criteria: "" }]
        : [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxWidth: 480,
        padding: "1.25rem",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        background: "var(--surface)",
      }}
    >
      <Text role="display" as="h2" style={{ marginBottom: "0.25rem" }}>
        Review Vault Details
      </Text>
      <Text role="body" as="p" style={{ color: "var(--muted)" }}>
        Confirm the vault details before creating it. This action is
        irreversible once submitted.
      </Text>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <Text role="caption" as="span" style={{ color: "var(--muted)" }}>
            Amount (USDC)
          </Text>
          <Text role="body" as="p">
            {amount}
          </Text>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <Text role="caption" as="span" style={{ color: "var(--muted)" }}>
            Deadline
          </Text>
          <Text role="body" as="p">
            {deadline}
          </Text>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <Text role="caption" as="span" style={{ color: "var(--muted)" }}>
            Success destination
          </Text>
          <AddressDisplay address={successAddress} />
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <Text role="caption" as="span" style={{ color: "var(--muted)" }}>
            Failure destination
          </Text>
          <AddressDisplay address={failureAddress} />
        </div>

        {verifierAddress ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            <Text role="caption" as="span" style={{ color: "var(--muted)" }}>
              Verifier address
            </Text>
            <Text role="body" as="p">
              {verifierAddress}
            </Text>
          </div>
        ) : null}

        {reviewMilestones.length > 0 ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <Text role="caption" as="span" style={{ color: "var(--muted)" }}>
              Milestones
            </Text>
            <ol
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                margin: 0,
                paddingLeft: "1.25rem",
              }}
            >
              {reviewMilestones.map((item, index) => (
                <li key={`${item.title}-${index}`}>
                  <Text role="body" as="p" style={{ fontWeight: 700 }}>
                    {item.title}
                  </Text>
                  {item.criteria ? (
                    <Text
                      role="caption"
                      as="p"
                      style={{ color: "var(--muted)" }}
                    >
                      {item.criteria}
                    </Text>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "transparent",
            color: "var(--text)",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            cursor: "pointer",
          }}
        >
          <Text role="caption" as="span">
            Back to edit
          </Text>
        </button>
        <button
          type="button"
          onClick={onConfirm}
          style={{
            background: "var(--accent)",
            color: "var(--bg)",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius)",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          <Text role="caption" as="span">
            Confirm Vault
          </Text>
        </button>
      </div>
    </div>
  );
}
