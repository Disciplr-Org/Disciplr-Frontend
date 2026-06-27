import { Text } from "./Text";

interface CreateVaultReviewProps {
  amount: string;
  deadline: string;
  successAddress: string;
  failureAddress: string;
  verifierAddress?: string;
  milestone?: string;
  onBack?: () => void;
  onConfirm?: () => void;
}

function AddressDisplay({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <Text role="caption" as="span" style={{ color: "var(--muted)" }}>
        {label}
      </Text>
      <Text
        role="body"
        as="code"
        style={{
          padding: "0.5rem 0.75rem",
          borderRadius: "var(--radius)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--accent)",
          wordBreak: "break-all",
        }}
      >
        {value}
      </Text>
    </div>
  );
}

export function CreateVaultReview({
  amount,
  deadline,
  successAddress,
  failureAddress,
  verifierAddress,
  milestone,
  onBack,
  onConfirm,
}: CreateVaultReviewProps) {
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

        <AddressDisplay value={successAddress} label="Success destination" />
        <AddressDisplay value={failureAddress} label="Failure destination" />

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

        {milestone ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            <Text role="caption" as="span" style={{ color: "var(--muted)" }}>
              Milestone
            </Text>
            <Text role="body" as="p">
              {milestone}
            </Text>
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
