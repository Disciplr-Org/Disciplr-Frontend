import { useState } from 'react'

export default function CreateVault() {
  const [amount, setAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [successAddress, setSuccessAddress] = useState('')
  const [failureAddress, setFailureAddress] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Placeholder: will call backend / contract
    console.log({ amount, deadline, successAddress, failureAddress })
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Vault</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Lock USDC with a deadline and milestone. Funds release on validation or redirect on failure.
      </p>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          maxWidth: 400,
        }}
      >
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
            Amount (USDC)
          </span>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
            Deadline (ISO date)
          </span>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
            Success destination (Stellar address)
          </span>
          <input
            type="text"
            value={successAddress}
            onChange={(e) => setSuccessAddress(e.target.value)}
            placeholder="G..."
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
            Failure destination (Stellar address)
          </span>
          <input
            type="text"
            value={failureAddress}
            onChange={(e) => setFailureAddress(e.target.value)}
            placeholder="G..."
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          />
        </label>
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
          }}
        >
          Create Vault
        </button>
      </form>
    </div>
  )
}
