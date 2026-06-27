/**
 * Filters pending validation tasks by search query and milestone.
 * 
 * @param tasks - Array of pending validation tasks
 * @param query - Search query to match against vaultName and owner (case-insensitive)
 * @param milestone - Milestone to filter by; undefined or empty string returns all milestones
 * @returns Filtered array of tasks
 */
export interface FilterOptions {
  query?: string;
  milestone?: string;
}

export interface PendingTask {
  id: string;
  vaultName: string;
  owner: string;
  amount: string;
  deadline: string;
  daysRemaining: number;
  status: 'pending';
  milestone: string;
}

export function filterPending(
  tasks: PendingTask[],
  options: FilterOptions = {},
): PendingTask[] {
  const { query = '', milestone = '' } = options;
  const normalizedQuery = query.trim().toLowerCase();

  if (query && !normalizedQuery) {
    return [];
  }

  return tasks.filter((task) => {
    // Filter by milestone if provided
    if (milestone && task.milestone !== milestone) {
      return false;
    }

    // Filter by search query if provided (case-insensitive match on vaultName or owner)
    if (normalizedQuery) {
      const vaultNameMatch = task.vaultName.toLowerCase().includes(normalizedQuery);
      const ownerMatch = task.owner.toLowerCase().includes(normalizedQuery);

      if (!vaultNameMatch && !ownerMatch) {
        return false;
      }
    }

    return true;
  });
}
