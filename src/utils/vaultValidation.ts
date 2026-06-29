export interface CreateVaultFormValues {
  amount: string;
  deadline: string;
  successAddress: string;
  failureAddress: string;
  milestones?: CreateVaultMilestoneInput[];
}

export interface CreateVaultMilestoneInput {
  title: string;
  criteria: string;
}

export interface CreateVaultMilestoneRowErrors {
  title?: string;
  criteria?: string;
}

export interface CreateVaultMilestoneErrors {
  form?: string;
  rows?: CreateVaultMilestoneRowErrors[];
}

type CreateVaultFieldName = Exclude<keyof CreateVaultFormValues, "milestones">;

export type CreateVaultErrors = Partial<
  Record<CreateVaultFieldName, string>
> & {
  milestones?: CreateVaultMilestoneErrors;
};

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
    errors.amount = "Enter a positive USDC amount with up to 7 decimal places.";
  }

  if (!isFutureDeadline(values.deadline, now)) {
    errors.deadline = "Choose a future deadline.";
  }

  if (!isValidStellarAddress(successAddress)) {
    errors.successAddress = "Enter a valid Stellar public key starting with G.";
  }

  if (!isValidStellarAddress(failureAddress)) {
    errors.failureAddress = "Enter a valid Stellar public key starting with G.";
  } else if (successAddress === failureAddress) {
    errors.failureAddress =
      "Failure destination must be different from success destination.";
  }

  const milestoneErrors = validateMilestones(values.milestones);
  if (milestoneErrors) {
    errors.milestones = milestoneErrors;
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

export function validateMilestones(
  milestones: CreateVaultMilestoneInput[] | undefined,
): CreateVaultMilestoneErrors | undefined {
  if (!milestones || milestones.length === 0) {
    return { form: "Add at least one milestone." };
  }

  const rows: CreateVaultMilestoneRowErrors[] = [];
  const titleCounts = new Map<string, number>();

  milestones.forEach((milestone) => {
    const normalizedTitle = milestone.title.trim().toLowerCase();
    if (normalizedTitle) {
      titleCounts.set(
        normalizedTitle,
        (titleCounts.get(normalizedTitle) ?? 0) + 1,
      );
    }
  });

  milestones.forEach((milestone, index) => {
    const row: CreateVaultMilestoneRowErrors = {};
    const title = milestone.title.trim();
    const criteria = milestone.criteria.trim();

    if (!title) {
      row.title = "Enter a milestone title.";
    } else if ((titleCounts.get(title.toLowerCase()) ?? 0) > 1) {
      row.title = "Milestone titles must be unique.";
    }

    if (!criteria) {
      row.criteria = "Enter milestone criteria.";
    }

    if (row.title || row.criteria) {
      rows[index] = row;
    }
  });

  return rows.length > 0 ? { rows } : undefined;
}

/**
 * Returns true when amount is a valid positive number that strictly exceeds the
 * available balance. Returns false when either value is not a finite number so
 * the caller can treat an unknown balance as non-blocking.
 */
export function exceedsBalance(
  amount: string,
  balance: string | null,
): boolean {
  if (balance === null) return false;
  const a = Number(amount);
  const b = Number(balance);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return a > b;
}
