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
  const [amount, setAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [successAddress, setSuccessAddress] = useState('')
  const [failureAddress, setFailureAddress] = useState('')
  const [verifierAddress, setVerifierAddress] = useState('')
  const [errors, setErrors] = useState<CreateVaultErrors>({})
  const [evidenceUrl, setEvidenceUrl] = useState<string | undefined>()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateCreateVault({
      amount,
      deadline,
      successAddress,
      failureAddress,
      verifierAddress,
    })
    setErrors(nextErrors)
    if (hasCreateVaultErrors(nextErrors)) return

    // Placeholder: will call backend / contract
    console.log({ amount, deadline, successAddress, failureAddress, verifierAddress, evidenceUrl })
  }

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
        <Field
          label="Deadline (ISO date)"
          type="datetime-local"
          value={deadline}
          onChange={(e) => {
            setDeadline(e.target.value)
            setErrors((current) => ({ ...current, deadline: undefined }))
          }}
          error={errors.deadline}
          required
        />
        <Field
          label="Success destination (Stellar address)"
          type="text"
          value={successAddress}
          onChange={(e) => {
            setSuccessAddress(e.target.value)
            setErrors((current) => ({ ...current, successAddress: undefined }))
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
            setFailureAddress(e.target.value)
            setErrors((current) => ({ ...current, failureAddress: undefined }))
          }}
          placeholder="G..."
          error={errors.failureAddress}
          required
        />
        <Field
          label="Verifier (Stellar address, optional)"
          type="text"
          value={verifierAddress}
          onChange={(e) => {
            setVerifierAddress(e.target.value)
            setErrors((current) => ({ ...current, verifierAddress: undefined }))
          }}
          placeholder="G..."
          error={errors.verifierAddress}
        />
        <EvidenceUpload onChange={setEvidenceUrl} />
        <button
          type="submit"
          style={{
            background: 'var(--accent)',
            color: 'var(--bg)',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius)',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '0.5rem',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text role="caption" as="span">
            Create Vault
          </Text>
        </button>
      </form>
    </div>
  );
}
