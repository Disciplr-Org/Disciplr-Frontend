/**
 * Exact milestone allocation on integer stroops (bigint, 1 USDC = 10^7).
 *
 * Never use Number arithmetic for amounts. All conversions and splits are done on
 * bigint stroops so that tranches reconcile exactly with the vault amount.
 */

export const STROOPS_PER_USDC = 10_000_000 as bigint; // 10^7
export const MAX_USDC_DECIMALS = 7;
export const MAX_MILESTONES = 20;

const USDC_STRING_REGEX = /^(?:0|[1-9]\d*)(?:\.\d{1,7})?$/;

/**
 * Parse a decimal USDC string into integer stroops.
 *
 * Rejects:
 * - empty strings
 * - negative numbers
 * - exponential notation (1e3)
 * - hex (0x10)
 * - leading dot (.5) or trailing dot (1.)
 * - more than 7 decimal places
 */
export function toStroops(amount: string): bigint {
  const normalized = amount.trim();
  if (!USDC_STRING_REGEX.test(normalized)) {
    throw new Error(`Invalid USDC amount: "${amount}"`);
  }

  const [whole, frac = ""] = normalized.split(".");
  const paddedFrac = frac.padEnd(MAX_USDC_DECIMALS, "0");
  return BigInt(whole) * STROOPS_PER_USDC + BigInt(paddedFrac);
}

/**
 * Format integer stroops back into a decimal USDC string with at most 7 decimals.
 * Trailing zeros are trimmed and the result is never in exponential notation.
 */
export function fromStroops(stroops: bigint): string {
  if (stroops < 0n || stroops % 1n !== 0n) {
    throw new Error(`Stroops must be a non-negative integer: ${stroops}`);
  }
  const whole = stroops / STROOPS_PER_USDC;
  const remainder = stroops % STROOPS_PER_USDC;
  const frac = remainder.toString().padStart(MAX_USDC_DECIMALS, "0").replace(/0+$/, "");
  const wholeStr = whole.toString();
  return frac ? `${wholeStr}.${frac}` : wholeStr;
}

/**
 * Distribute `total` stroops into `n` tranches such that the sum is exactly `total`.
 * The first `remainder` tranches receive one extra stroop.
 */
export function splitEvenly(total: bigint, n: number): bigint[] {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Milestone count must be a positive integer: ${n}`);
  }
  if (total < 0n) {
    throw new Error(`Total must be non-negative: ${total}`);
  }
  const count = BigInt(n);
  const base = total / count;
  const remainder = Number(total % count);
  const result: bigint[] = [];
  for (let i = 0; i < n; i++) {
    result.push(base + (i < remainder ? 1n : 0n));
  }
  return result;
}

export interface AllocationRow {
  amount?: string;
  dueDate?: string;
}

export interface AllocationRowErrors {
  amount?: string;
  dueDate?: string;
}

export interface AllocationErrors {
  form?: string;
  rows?: AllocationRowErrors[];
}

export interface ValidateAllocationOptions {
  total?: string;
  deadline?: string;
  now?: Date;
}

/**
 * Validate the per-milestone amounts and due dates against the vault total and deadline.
 *
 * Returns an object with form-level and row-level errors, or `undefined` when everything is valid.
 */
export function validateAllocation(
  rows: AllocationRow[],
  options: ValidateAllocationOptions = {},
): AllocationErrors | undefined {
  if (rows.length === 0) {
    return { form: "Add at least one milestone." };
  }

  const rowErrors: AllocationRowErrors[] = rows.map(() => ({}));
  const now = options.now ?? new Date();
  const deadlineTs = options.deadline
    ? new Date(options.deadline).getTime()
    : Number.NaN;
  const hasDeadline = Number.isFinite(deadlineTs);

  // Per-row amount parsing. Empty means "auto" and is filled at submit time.
  const parsedAmounts: (bigint | undefined)[] = [];
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i].amount?.trim() ?? "";
    if (!raw) {
      parsedAmounts.push(undefined);
      continue;
    }
    try {
      const stroops = toStroops(raw);
      if (stroops <= 0n) {
        rowErrors[i].amount = "Enter a positive amount.";
        parsedAmounts.push(undefined);
        continue;
      }
      parsedAmounts.push(stroops);
    } catch {
      rowErrors[i].amount =
        "Enter a positive USDC amount with up to 7 decimal places.";
      parsedAmounts.push(undefined);
    }
  }

  // Per-row due date parsing. Empty means "auto" and is filled at submit time.
  const parsedDates: (number | undefined)[] = [];
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i].dueDate?.trim() ?? "";
    if (!raw) {
      parsedDates.push(undefined);
      continue;
    }
    const ts = new Date(raw).getTime();
    if (!Number.isFinite(ts)) {
      rowErrors[i].dueDate = "Choose a valid due date.";
      parsedDates.push(undefined);
      continue;
    }
    if (ts <= now.getTime()) {
      rowErrors[i].dueDate = "Due date must be in the future.";
      parsedDates.push(undefined);
      continue;
    }
    if (hasDeadline && ts > deadlineTs) {
      rowErrors[i].dueDate = "Due date must be on or before the vault deadline.";
      parsedDates.push(undefined);
      continue;
    }
    parsedDates.push(ts);
  }

  // Due dates must be in ascending order.
  for (let i = 1; i < parsedDates.length; i++) {
    const prev = parsedDates[i - 1];
    const curr = parsedDates[i];
    if (prev !== undefined && curr !== undefined && curr < prev) {
      rowErrors[i].dueDate =
        "Due dates must be in ascending order.";
    }
  }

  // Sum check. Only complain when every row has a parseable amount and the total is valid.
  let formError: string | undefined;
  if (options.total !== undefined) {
    let totalStroops: bigint | undefined;
    try {
      totalStroops = toStroops(options.total);
    } catch {
      totalStroops = undefined;
    }
    if (totalStroops !== undefined && totalStroops > 0n) {
      const allParsed = parsedAmounts.every((a) => a !== undefined);
      if (allParsed) {
        const sum = parsedAmounts.reduce<bigint>((acc, a) => acc + (a as bigint), 0n);
        if (sum !== totalStroops) {
          formError = `Allocated ${fromStroops(sum)} of ${fromStroops(totalStroops)} USDC `;
        }
      }
    }
  }

  const anyRowErrors = rowErrors.some(
    (r) => r.amount !== undefined || r.dueDate !== undefined,
  );
  if (!anyRowErrors && !formError) return undefined;
  return {
    ...(formError ? { form: formError } : {}),
    ...(anyRowErrors ? { rows: rowErrors } : {}),
  };
}
