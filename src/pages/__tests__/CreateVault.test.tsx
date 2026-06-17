import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import CreateVault from '../CreateVault'

const VALID_ADDRESS = `G${'A'.repeat(55)}`
const OTHER_VALID_ADDRESS = `G${'B'.repeat(55)}`

describe('CreateVault validation', () => {
  test('blocks submit and shows inline errors for invalid values', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    render(<CreateVault />)

    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText(/Deadline/i), { target: { value: '2020-01-01T00:00' } })
    fireEvent.change(screen.getByLabelText(/Success destination/i), { target: { value: 'invalid' } })
    fireEvent.change(screen.getByLabelText(/Failure destination/i), { target: { value: 'invalid' } })
    fireEvent.click(screen.getByRole('button', { name: /Create Vault/i }))

    expect(screen.getByText(/positive USDC amount/i)).toBeInTheDocument()
    expect(screen.getByText(/future deadline/i)).toBeInTheDocument()
    expect(screen.getAllByText(/valid Stellar public key/i)).toHaveLength(2)
    expect(screen.getByLabelText(/Amount/i)).toHaveAttribute('aria-invalid', 'true')
    expect(consoleSpy).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  test('submits valid values and rejects identical destinations', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    render(<CreateVault />)

    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '10.1234567' } })
    fireEvent.change(screen.getByLabelText(/Deadline/i), { target: { value: '2999-01-01T00:00' } })
    fireEvent.change(screen.getByLabelText(/Success destination/i), { target: { value: VALID_ADDRESS } })
    fireEvent.change(screen.getByLabelText(/Failure destination/i), { target: { value: VALID_ADDRESS } })
    fireEvent.click(screen.getByRole('button', { name: /Create Vault/i }))

    expect(screen.getByText(/different failure destination/i)).toBeInTheDocument()
    expect(consoleSpy).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/Failure destination/i), { target: { value: OTHER_VALID_ADDRESS } })
    fireEvent.click(screen.getByRole('button', { name: /Create Vault/i }))

    expect(consoleSpy).toHaveBeenCalledWith({
      amount: '10.1234567',
      deadline: '2999-01-01T00:00',
      successAddress: VALID_ADDRESS,
      failureAddress: OTHER_VALID_ADDRESS,
    })

    consoleSpy.mockRestore()
  })
})
