/**
 * Computes aggregate totals (count, sum amount, sum fees) from a list of
 * transaction-like objects. Pure function, no side-effects.
 */
export interface TxTotals {
  count: number;
  totalAmount: number;
  totalFees: number;
}

/**
 * Sum `amount` and `fee` across an array of transaction-like objects.
 * Returns zeroed totals for an empty array.
 */
export function computeTxTotals(
  transactions: ReadonlyArray<{ amount: number; fee: number }>,
): TxTotals {
  let totalAmount = 0;
  let totalFees = 0;

  for (let i = 0; i < transactions.length; i++) {
    totalAmount += transactions[i].amount;
    totalFees += transactions[i].fee;
  }

  return {
    count: transactions.length,
    totalAmount,
    totalFees,
  };
}
