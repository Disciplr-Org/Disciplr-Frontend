export interface CreateVaultFormValues {
  amount: string;
  deadline: string;
  successAddress: string;
  failureAddress: string;
  milestoneTitle: string;
  milestoneCriteria: string;
}

const MILESTONE_TITLE_MAX = 100;
const MILESTONE_CRITERIA_MAX = 500;

export type CreateVaultErrors = Partial<Record<keyof CreateVaultFormValues, string>>;

const STELLAR_PUBLIC_KEY = /^G[A-Z2-7]{55}$/;
const USDC_AMOUNT = /^(?:0|[1-9]\d*)(?:\.\d{1,7})?$/;

export function isValidStellarAddress(address: string): boolean {
  return STELLAR_PUBLIC_KEY.test(address.trim());
}

export function isValidUsdcAmount(amount: string): boolean {
  const normalized = amount.trim();
  if (!USDC_AMOUNT.test(normalized)) return false;
  return Number(normalized) > 0;
}

export function isFutureDeadline(deadline: string, now = new Date()): boolean {
  const timestamp = new Date(deadline).getTime();
  return Number.isFinite(timestamp) && timestamp > now.getTime();
}

export function validateCreateVault(
  values: CreateVaultFormValues,
  now = new Date(),
): CreateVaultErrors {
  const errors: CreateVaultErrors = {};
  const successAddress = values.successAddress.trim();
  const failureAddress = values.failureAddress.trim();
  const verifierAddress = values.verifierAddress.trim();

  if (!isValidUsdcAmount(values.amount)) {
    errors.amount = 'Enter a positive USDC amount with up to 7 decimal places.';
  }

  if (!isFutureDeadline(values.deadline, now)) {
    errors.deadline = 'Choose a future deadline.';
  }

  if (!isValidStellarAddress(successAddress)) {
    errors.successAddress = 'Enter a valid Stellar public key starting with G.';
  }

  if (!isValidStellarAddress(failureAddress)) {
    errors.failureAddress = 'Enter a valid Stellar public key starting with G.';
  } else if (successAddress === failureAddress) {
    errors.failureAddress = 'Failure destination must be different from success destination.';
  }

  const title = values.milestoneTitle.trim();
  if (!title) {
    errors.milestoneTitle = 'Enter a milestone title.';
  } else if (title.length > MILESTONE_TITLE_MAX) {
    errors.milestoneTitle = `Milestone title must be ${MILESTONE_TITLE_MAX} characters or fewer.`;
  }

  const criteria = values.milestoneCriteria.trim();
  if (!criteria) {
    errors.milestoneCriteria = 'Enter the milestone criteria.';
  } else if (criteria.length > MILESTONE_CRITERIA_MAX) {
    errors.milestoneCriteria = `Milestone criteria must be ${MILESTONE_CRITERIA_MAX} characters or fewer.`;
  }

  return errors;
}

export function hasCreateVaultErrors(errors: CreateVaultErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Returns true when amount is a valid positive number that strictly exceeds the
 * available balance. Returns false when either value is not a finite number so
 * the caller can treat an unknown balance as non-blocking.
 */
export function exceedsBalance(amount: string, balance: string | null): boolean {
  if (balance === null) return false;
  const a = Number(amount);
  const b = Number(balance);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return a > b;
}
