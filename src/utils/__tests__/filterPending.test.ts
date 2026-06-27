import { describe, it, expect } from 'vitest';
import { filterPending, PendingTask } from '../filterPending';

const createTask = (overrides: Partial<PendingTask> = {}): PendingTask => ({
  id: 'v-1',
  vaultName: 'Test Vault',
  owner: '0xAAAA',
  amount: '10,000 USDC',
  deadline: '2026-07-01',
  daysRemaining: 10,
  status: 'pending' as const,
  milestone: 'Phase 1',
  ...overrides,
});

const mockTasks: PendingTask[] = [
  createTask({
    id: 'v-1',
    vaultName: 'Alpha Vault',
    owner: '0xAAAA',
    milestone: 'Phase 1',
  }),
  createTask({
    id: 'v-2',
    vaultName: 'Beta Vault',
    owner: '0xBBBB',
    milestone: 'Phase 2',
  }),
  createTask({
    id: 'v-3',
    vaultName: 'Gamma Vault',
    owner: '0xCCCC',
    milestone: 'Phase 1',
  }),
  createTask({
    id: 'v-4',
    vaultName: 'Delta Vault',
    owner: '0xDDDD',
    milestone: 'Phase 3',
  }),
];

describe('filterPending', () => {
  it('returns all tasks when no filters are provided', () => {
    const result = filterPending(mockTasks);
    expect(result).toEqual(mockTasks);
  });

  it('returns all tasks when empty filter options are provided', () => {
    const result = filterPending(mockTasks, {});
    expect(result).toEqual(mockTasks);
  });

  it('returns all tasks when empty query and empty milestone are provided', () => {
    const result = filterPending(mockTasks, { query: '', milestone: '' });
    expect(result).toEqual(mockTasks);
  });

  describe('search by vault name', () => {
    it('filters by vault name (case-insensitive)', () => {
      const result = filterPending(mockTasks, { query: 'alpha' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('v-1');
      expect(result[0].vaultName).toBe('Alpha Vault');
    });

    it('filters by partial vault name', () => {
      const result = filterPending(mockTasks, { query: 'vault' });
      expect(result).toHaveLength(4);
    });

    it('filters by vault name with uppercase query', () => {
      const result = filterPending(mockTasks, { query: 'BETA' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('v-2');
    });

    it('matches multiple vaults with same partial name', () => {
      const result = filterPending(mockTasks, { query: 'a' });
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((t) => t.id === 'v-1')).toBe(true); // Alpha
      expect(result.some((t) => t.id === 'v-3')).toBe(true); // Gamma
      expect(result.some((t) => t.id === 'v-4')).toBe(true); // Delta
    });
  });

  describe('search by owner', () => {
    it('filters by owner address (case-insensitive)', () => {
      const result = filterPending(mockTasks, { query: '0xaaaa' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('v-1');
      expect(result[0].owner).toBe('0xAAAA');
    });

    it('filters by partial owner address', () => {
      const result = filterPending(mockTasks, { query: '0x' });
      expect(result).toHaveLength(4);
    });

    it('filters by owner with uppercase query', () => {
      const result = filterPending(mockTasks, { query: '0xBBBB' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('v-2');
    });

    it('matches partial owner address', () => {
      const result = filterPending(mockTasks, { query: 'bbbb' });
      expect(result).toHaveLength(1);
      expect(result[0].owner).toBe('0xBBBB');
    });
  });

  describe('search across vault and owner', () => {
    it('matches query against vault name OR owner (union)', () => {
      const tasksWithOwner = [
        createTask({ id: 'v-1', vaultName: 'Test Vault', owner: '0xALICE' }),
        createTask({ id: 'v-2', vaultName: 'Alice Vault', owner: '0xBOB' }),
      ];
      const result = filterPending(tasksWithOwner, { query: 'alice' });
      expect(result).toHaveLength(2); // both match (vault name and owner)
    });
  });

  describe('filter by milestone', () => {
    it('filters by milestone', () => {
      const result = filterPending(mockTasks, { milestone: 'Phase 1' });
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(['v-1', 'v-3']);
    });

    it('filters by milestone Phase 2', () => {
      const result = filterPending(mockTasks, { milestone: 'Phase 2' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('v-2');
    });

    it('filters by milestone Phase 3', () => {
      const result = filterPending(mockTasks, { milestone: 'Phase 3' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('v-4');
    });

    it('returns empty array for non-existent milestone', () => {
      const result = filterPending(mockTasks, { milestone: 'Non-existent' });
      expect(result).toHaveLength(0);
    });

    it('is case-sensitive for milestone matching', () => {
      const result = filterPending(mockTasks, { milestone: 'phase 1' });
      expect(result).toHaveLength(0);
    });
  });

  describe('combined query and milestone filters', () => {
    it('filters by both query and milestone (AND logic)', () => {
      const result = filterPending(mockTasks, {
        query: 'alpha',
        milestone: 'Phase 1',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('v-1');
    });

    it('returns empty when query matches but milestone does not', () => {
      const result = filterPending(mockTasks, {
        query: 'alpha',
        milestone: 'Phase 2',
      });
      expect(result).toHaveLength(0);
    });

    it('returns empty when milestone matches but query does not', () => {
      const result = filterPending(mockTasks, {
        query: 'nonexistent',
        milestone: 'Phase 1',
      });
      expect(result).toHaveLength(0);
    });

    it('filters by milestone and owner query', () => {
      const result = filterPending(mockTasks, {
        query: '0xBBBB',
        milestone: 'Phase 2',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('v-2');
    });

    it('filters by milestone and partial vault name', () => {
      const result = filterPending(mockTasks, {
        query: 'gamma',
        milestone: 'Phase 1',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('v-3');
    });
  });

  describe('edge cases', () => {
    it('handles empty task array', () => {
      const result = filterPending([], { query: 'test' });
      expect(result).toEqual([]);
    });

    it('handles whitespace-only query', () => {
      const result = filterPending(mockTasks, { query: '   ' });
      expect(result).toEqual([]);
    });

    it('handles query with leading/trailing whitespace', () => {
      const result = filterPending(mockTasks, { query: '  alpha  ' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('v-1');
    });

    it('does not mutate input array', () => {
      const input = [...mockTasks];
      const original = JSON.stringify(input);
      filterPending(input, { query: 'test', milestone: 'Phase 1' });
      expect(JSON.stringify(input)).toBe(original);
    });

    it('returns filtered array (not a reference to original)', () => {
      const result = filterPending(mockTasks, { query: 'test' });
      expect(result).not.toBe(mockTasks);
    });
  });

  describe('special characters in search', () => {
    it('matches owner with special hex characters', () => {
      const tasksWithSpecial = [
        createTask({
          id: 'v-1',
          owner: '0xaAbBcCdDeEfF',
        }),
      ];
      const result = filterPending(tasksWithSpecial, { query: '0xaabbcc' });
      expect(result).toHaveLength(1);
    });

    it('handles vault names with special characters', () => {
      const tasksWithSpecial = [
        createTask({
          id: 'v-1',
          vaultName: 'Vault-Name (Test)',
        }),
      ];
      const result = filterPending(tasksWithSpecial, { query: 'vault-name' });
      expect(result).toHaveLength(1);
    });
  });
});
