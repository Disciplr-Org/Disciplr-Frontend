import { useState } from 'react'
import { Text } from '../components/Text'
import { Field } from '../components/Field'
import type { CreateVaultErrors } from '../utils/vaultValidation'
import {
  hasCreateVaultErrors,
  validateCreateVault,
} from '../utils/vaultValidation'
import { EvidenceUpload } from '../components/EvidenceUpload'

export default function CreateVault() {
  const [amount, setAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [successAddress, setSuccessAddress] = useState('')
  const [failureAddress, setFailureAddress] = useState('')
  const [verifierAddress, setVerifierAddress] = useState('')
  const [errors, setErrors] = useState<CreateVaultErrors>({})
  const [evidenceUrl, setEvidenceUrl] = useState<string | undefined>()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
      <Text role="display" as="h1" style={{ marginBottom: '0.5rem' }}>
        Create Vault
      </Text>
      <Text role="body" as="p" style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Lock USDC with a deadline and milestone. Funds release on validation or redirect on failure.
      </Text>
      <form
        onSubmit={handleSubmit}
        noValidate
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          maxWidth: 400,
        }}
      >
        <Field
          label="Amount (USDC)"
          type="text"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            setErrors((current) => ({ ...current, amount: undefined }))
          }}
          placeholder="1000"
          error={errors.amount}
          required
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
  )
}
