import { useRef, useState } from "react";
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
import { DEADLINE_PRESETS, computeFutureDeadline, getPresetLabel } from "../utils/deadlinePresets";

export default function CreateVault() {
  const { balance, balanceStatus } = useWallet();
  const amountRef = useRef<HTMLInputElement>(null);
  const deadlineRef = useRef<HTMLInputElement>(null);
  const successAddressRef = useRef<HTMLInputElement>(null);
  const failureAddressRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [successAddress, setSuccessAddress] = useState("");
  const [failureAddress, setFailureAddress] = useState("");
  const [errors, setErrors] = useState<CreateVaultErrors>({});
  const [evidenceUrl, setEvidenceUrl] = useState<string | undefined>();
  const [showReview, setShowReview] = useState(false);

  const errorFieldOrder: Array<keyof CreateVaultErrors> = [
    "amount",
    "deadline",
    "successAddress",
    "failureAddress",
  ];

  const fieldRefs = {
    amount: amountRef,
    deadline: deadlineRef,
    successAddress: successAddressRef,
    failureAddress: failureAddressRef,
  };

  const errorEntries = errorFieldOrder.flatMap((field) =>
    errors[field] ? [{ field, message: errors[field] as string }] : [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateCreateVault({
      amount,
      deadline,
      successAddress,
      failureAddress,
    });
    setErrors(nextErrors);

    if (hasCreateVaultErrors(nextErrors)) {
      const firstInvalidField = errorFieldOrder.find((field) => nextErrors[field]);
      if (firstInvalidField) {
        fieldRefs[firstInvalidField].current?.focus();
      }
      return;
    }

    setShowReview(true);
  };

  const handleConfirm = () => {
    logger.debug("CreateVault confirm", {
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
        <>
          {errorEntries.length > 0 && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                border: "1px solid var(--danger)",
                borderRadius: "var(--radius)",
                padding: "0.75rem",
                background: "color-mix(in srgb, var(--danger) 10%, var(--surface))",
                marginBottom: "1rem",
                maxWidth: 400,
              }}
            >
              <Text
                role="caption"
                as="p"
                style={{ color: "var(--danger)", marginBottom: "0.5rem" }}
              >
                Please fix the highlighted fields before creating the vault.
              </Text>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--danger)" }}>
                {errorEntries.map(({ field, message }, index) => (
                  <li key={`${field}-${index}`}>{message}</li>
                ))}
              </ul>
            </div>
          )}

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
              ref={amountRef}
              id="create-vault-amount"
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
            {balanceStatus === "success" && exceedsBalance(amount, balance) && (
              <p
                role="status"
                style={{ color: "var(--warning)", margin: 0, fontSize: "0.875rem" }}
              >
                Amount exceeds your available USDC balance ({balance}).
              </p>
            )}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {DEADLINE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    const days = parseInt(preset, 10);
                    setDeadline(computeFutureDeadline(days));
                    setErrors((current) => ({ ...current, deadline: undefined }));
                  }}
                  style={{
                    padding: "0.4rem 0.875rem",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--muted)",
                    borderRadius: "var(--radius)",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {getPresetLabel(preset)}
                </button>
              ))}
            </div>
            <Field
              ref={deadlineRef}
              id="create-vault-deadline"
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
              ref={successAddressRef}
              id="create-vault-success-address"
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
              ref={failureAddressRef}
              id="create-vault-failure-address"
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
        </>
      )}
    </div>
  );
}
