import { describe, expect, it } from 'vitest';
import { initialHistory, initialPending } from '../../fixtures/validations';
import { filterPending, type FilterOptions, type PendingTask } from '../filterPending';

const fixtures: readonly PendingTask[] = Object.freeze([
  Object.freeze({
    ...initialPending[0],
    id: 'task-1',
    vaultName: 'Alice Treasury Vault',
    owner: 'GALICE_OWNER_ADDRESS',
    milestone: 'Milestone 1',
  }),
  Object.freeze({
    ...initialPending[1],
    id: 'task-2',
    vaultName: 'Community Grant #42',
    owner: 'GBOB_ALICE_PARTNER',
    milestone: 'Milestone 2',
  }),
  Object.freeze({
    ...initialHistory[0],
    id: 'task-3',
    status: 'pending' as const,
    vaultName: 'Audit Bounty',
    owner: 'GCHARLIE_OWNER_ADDRESS',
    milestone: 'Milestone 1',
  }),
]);

describe('filterPending', () => {
  describe('table-driven filtering invariants', () => {
    const cases: Array<{
      name: string;
      options: FilterOptions | undefined;
      expectedIds: string[];
    }> = [
      {
        name: 'returns all tasks when options are omitted',
        options: undefined,
        expectedIds: ['task-1', 'task-2', 'task-3'],
      },
      {
        name: 'returns all tasks when options are empty',
        options: {},
        expectedIds: ['task-1', 'task-2', 'task-3'],
      },
      {
        name: 'treats whitespace-only query and milestone as no filter',
        options: { query: '   ', milestone: '  \t  ' },
        expectedIds: ['task-1', 'task-2', 'task-3'],
      },
      {
        name: 'matches query against vaultName or owner, trimmed and case-insensitive',
        options: { query: ' ALICE ' },
        expectedIds: ['task-1', 'task-2'],
      },
      {
        name: 'matches query against vaultName only',
        options: { query: '  bounty  ' },
        expectedIds: ['task-3'],
      },
      {
        name: 'matches query against owner only',
        options: { query: 'gcharlie' },
        expectedIds: ['task-3'],
      },
      {
        name: 'returns empty array when query matches no tasks',
        options: { query: 'nonexistent-vault' },
        expectedIds: [],
      },
      {
        name: 'matches milestone exactly',
        options: { milestone: 'Milestone 1' },
        expectedIds: ['task-1', 'task-3'],
      },
      {
        name: 'trims milestone option before exact comparison',
        options: { milestone: '  Milestone 2  ' },
        expectedIds: ['task-2'],
      },
      {
        name: 'does not match milestone by substring',
        options: { milestone: 'Mile' },
        expectedIds: [],
      },
      {
        name: 'matches milestone case-sensitively',
        options: { milestone: 'milestone 1' },
        expectedIds: [],
      },
      {
        name: 'combines query and milestone with AND',
        options: { query: ' ALICE ', milestone: 'Milestone 1' },
        expectedIds: ['task-1'],
      },
      {
        name: 'returns empty array when query matches but milestone does not',
        options: { query: 'bounty', milestone: 'Milestone 2' },
        expectedIds: [],
      },
      {
        name: 'returns empty array when milestone matches but query does not',
        options: { query: 'bob', milestone: 'Milestone 1' },
        expectedIds: [],
      },
    ];

    it.each(cases)('$name', ({ options, expectedIds }) => {
      const result = filterPending(fixtures as PendingTask[], options);
      expect(result.map((t) => t.id)).toEqual(expectedIds);
    });
  });

  describe('purity, determinism, order preservation, and immutability', () => {
    it('preserves input order, does not mutate frozen inputs, and is deterministic', () => {
      const first = filterPending(fixtures as PendingTask[], { query: 'alice' });
      const second = filterPending(fixtures as PendingTask[], { query: 'alice' });

      expect(first).toEqual(second);
      expect(first).not.toBe(fixtures);
      expect(first.map((t) => t.id)).toEqual(['task-1', 'task-2']);
      expect(fixtures.map((t) => t.id)).toEqual(['task-1', 'task-2', 'task-3']);
    });
  });

  describe('resilience to adverse and malformed inputs', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['number', 42],
      ['string', 'not-an-array'],
      ['plain object', { id: 'task-1' }],
    ])('returns [] without throwing when tasks is %s', (_label, invalidTasks) => {
      expect(() => filterPending(invalidTasks as never)).not.toThrow();
      expect(filterPending(invalidTasks as never)).toEqual([]);
    });

    it.each([
      ['null options', null],
      ['undefined options', undefined],
      ['number options', 123],
      ['null query and milestone', { query: null, milestone: null }],
      ['number query and milestone', { query: 123, milestone: 456 }],
      ['boolean and object options', { query: true, milestone: {} }],
    ])('treats %s as no filter without throwing', (_label, invalidOptions) => {
      expect(() =>
        filterPending(fixtures as PendingTask[], invalidOptions as never),
      ).not.toThrow();
      const result = filterPending(fixtures as PendingTask[], invalidOptions as never);
      expect(result.map((t) => t.id)).toEqual(['task-1', 'task-2', 'task-3']);
    });

    it('never throws on malformed task entries like [null, 5, {}]', () => {
      const malformed = Object.freeze([null, 5, {}]) as never;

      expect(() => filterPending(malformed)).not.toThrow();
      expect(filterPending(malformed)).toEqual([{}]);
      expect(filterPending(malformed, { query: 'a' })).toEqual([]);
      expect(filterPending(malformed, { milestone: 'Milestone 1' })).toEqual([]);
    });

    it('filters valid partial tasks alongside malformed entries', () => {
      const mixed = [null, { vaultName: 'a' }] as never;
      const result = filterPending(mixed, { query: 'a' });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ vaultName: 'a' });
    });
  });
});
