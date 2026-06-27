import { useState } from "react";
import { Text } from "../components/Text";
import { Field } from "../components/Field";
import type { CreateVaultErrors } from "../utils/vaultValidation";
import {
  exceedsBalance,
  hasCreateVaultErrors,
  validateCreateVault,
} from "../utils/vaultValidation";
import { EvidenceUpload } from "../components/EvidenceUpload";
import { CreateVaultReview } from "../components/CreateVaultReview";
import { formatUsdcInput, parseUsdcInput } from "../utils/usdcInput";
import { logger } from "../utils/logger";
import { useWallet } from "../context/WalletContext";

export default function CreateVault() {
  const { balance, balanceStatus } = useWallet();
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [successAddress, setSuccessAddress] = useState("");
  const [failureAddress, setFailureAddress] = useState("");
  const [errors, setErrors] = useState<CreateVaultErrors>({});
  const [evidenceUrl, setEvidenceUrl] = useState<string | undefined>();
  const [showReview, setShowReview] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateCreateVault({
      amount,
      deadline,
      successAddress,
      failureAddress,
    });
    setErrors(nextErrors);
    if (hasCreateVaultErrors(nextErrors)) return;

    setShowReview(true);
  };

  const handleConfirm = () => {
    // Placeholder: will call backend / contract
    logger.debug('CreateVault confirm', {
      amount,
      deadline,
      successAddress,
      failureAddress,
      evidenceUrl,
    });
  };

  const handleBackToEdit = () => {
    setShowReview(false);
  };

  return (
    <div>
      <Text role="display" as="h1" style={{ marginBottom: "0.5rem" }}>
        Create Vault
      </Text>
      <Text
        role="body"
        as="p"
        style={{ color: "var(--muted)", marginBottom: "2rem" }}
      >
        Lock USDC with a deadline and milestone. Funds release on validation or
        redirect on failure.
      </Text>
      {showReview ? (
        <CreateVaultReview
          amount={amount}
          deadline={deadline}
          successAddress={successAddress}
          failureAddress={failureAddress}
          onBack={handleBackToEdit}
          onConfirm={handleConfirm}
        />
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            maxWidth: 400,
          }}
        >
          <Field
            label="Amount (USDC)"
            type="text"
            value={formatUsdcInput(amount)}
            onChange={(e) => {
              const raw = parseUsdcInput(e.target.value);
              setAmount(raw);
              setErrors((current) => ({ ...current, amount: undefined }));
            }}
            placeholder="1000"
            error={errors.amount}
            required
          />
          {balanceStatus === 'success' && exceedsBalance(amount, balance) && (
            <p
              role="status"
              style={{ color: 'var(--warning)', margin: 0, fontSize: '0.875rem' }}
            >
              Amount exceeds your available USDC balance ({balance}).
            </p>
          )}
          <Field
            label="Deadline (ISO date)"
            type="datetime-local"
            value={deadline}
            onChange={(e) => {
              setDeadline(e.target.value);
              setErrors((current) => ({ ...current, deadline: undefined }));
            }}
            error={errors.deadline}
            required
          />
          <Field
            label="Success destination (Stellar address)"
            type="text"
            value={successAddress}
            onChange={(e) => {
              setSuccessAddress(e.target.value);
              setErrors((current) => ({
                ...current,
                successAddress: undefined,
              }));
            }}
            placeholder="G..."
            error={errors.successAddress}
            required
          />
          <Field
            label="Failure destination (Stellar address)"
            type="text"
            value={failureAddress}
            onChange={(e) => {
              setFailureAddress(e.target.value);
              setErrors((current) => ({
                ...current,
                failureAddress: undefined,
              }));
            }}
            placeholder="G..."
            error={errors.failureAddress}
            required
          />
          <EvidenceUpload onChange={setEvidenceUrl} />
          <button
            type="submit"
            style={{
              background: "var(--accent)",
              color: "var(--bg)",
              padding: "0.75rem 1.5rem",
              borderRadius: "var(--radius)",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: "0.5rem",
              minHeight: "44px",
              minWidth: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text role="caption" as="span">
              Create Vault
            </Text>
          </button>
        </form>
      )}
    </div>
  );
}
