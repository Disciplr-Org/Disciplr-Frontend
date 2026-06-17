export interface CreateVaultForm {
  amount: string
  deadline: string
  successAddress: string
  failureAddress: string
}

export type CreateVaultErrors = Partial<Record<keyof CreateVaultForm, string>>

const STELLAR_PUBLIC_KEY_RE = /^G[A-Z2-7]{55}$/
const USDC_AMOUNT_RE = /^(?:0|[1-9]\d*)(?:\.\d{1,7})?$/

export function isValidStellarAddress(value: string): boolean {
  return STELLAR_PUBLIC_KEY_RE.test(value.trim())
}

export function isValidUsdcAmount(value: string): boolean {
  const normalized = value.trim()
  if (!USDC_AMOUNT_RE.test(normalized)) return false
  return Number(normalized) > 0
}

export function isFutureDeadline(value: string, now = new Date()): boolean {
  const deadline = new Date(value)
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() > now.getTime()
}

export function validateCreateVault(form: CreateVaultForm, now = new Date()): CreateVaultErrors {
  const errors: CreateVaultErrors = {}
  const amount = form.amount.trim()
  const deadline = form.deadline.trim()
  const successAddress = form.successAddress.trim()
  const failureAddress = form.failureAddress.trim()

  if (!isValidUsdcAmount(amount)) {
    errors.amount = 'Enter a positive USDC amount with up to 7 decimal places.'
  }

  if (!isFutureDeadline(deadline, now)) {
    errors.deadline = 'Choose a valid future deadline.'
  }

  if (!isValidStellarAddress(successAddress)) {
    errors.successAddress = 'Enter a valid Stellar public key.'
  }

  if (!isValidStellarAddress(failureAddress)) {
    errors.failureAddress = 'Enter a valid Stellar public key.'
  }

  if (
    successAddress &&
    failureAddress &&
    isValidStellarAddress(successAddress) &&
    isValidStellarAddress(failureAddress) &&
    successAddress === failureAddress
  ) {
    errors.failureAddress = 'Use a different failure destination.'
  }

  return errors
}

export function hasCreateVaultErrors(errors: CreateVaultErrors): boolean {
  return Object.keys(errors).length > 0
}
