/**
 * Returns true when all criteria are checked (approve gate is open).
 * Tasks with no criteria are always open.
 */
export function isCriteriaGateOpen(
  criteria: string[] | undefined,
  checked: Set<number>,
): boolean {
  if (!criteria || criteria.length === 0) return true;
  return checked.size === criteria.length;
}
