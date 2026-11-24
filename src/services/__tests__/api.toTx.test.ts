/**
 * Unit tests for the toTx mapping path: normalizeActivityType and the amount
 * fallback used by toVault / toTx.
 *
 * Run with:
 *   pnpm exec vitest run src/services/__tests__/api.toTx.test.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  normalizeActivityType,
  FALLBACK_ACTIVITY_TYPE,
  _resetLoggedUnknownTypes,
  toVault,
  type ApiVault,
} from '../api';
import { resetLogger, configureLogger } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeApiVault(overrides: Partial<ApiVault> = {}): ApiVault {
  return {
    id: 'vault-1',
    creator: 'GCREATOR',
    amount: '1000',
    status: 'active',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    verifier: 'GVERIF',
    successDestination: 'GSUCC',
    failureDestination: 'GFAIL',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '',
    milestones: [],
    ...overrides,
  };
}

function makeActivity(type: string, amount = '500') {
  return {
    id: 'act-1',
    type,
    vaultId: 'vault-1',
    amount,
    status: 'confirmed',
    hash: '0xabc',
    memo: '',
    createdAt: '2026-01-02T00:00:00.000Z',
  };
}

// ---------------------------------------------------------------------------
// normalizeActivityType
// ---------------------------------------------------------------------------

describe('normalizeActivityType', () => {
  beforeEach(() => {
    _resetLoggedUnknownTypes();
    resetLogger();
  });

  it.each(['create', 'validate', 'release', 'redirect'] as const)(
    'passes known type "%s" through unchanged',
    (type) => {
      expect(normalizeActivityType(type)).toBe(type);
    },
  );

  it('maps an unknown string to the fallback', () => {
    expect(normalizeActivityType('weird')).toBe(FALLBACK_ACTIVITY_TYPE);
    expect(FALLBACK_ACTIVITY_TYPE).toBe('unknown');
  });

  it('maps undefined to the fallback', () => {
    expect(normalizeActivityType(undefined)).toBe('unknown');
  });

  it('maps null to the fallback', () => {
    expect(normalizeActivityType(null)).toBe('unknown');
  });

  it('maps an empty string to the fallback', () => {
    expect(normalizeActivityType('')).toBe('unknown');
  });

  it('logs a warning the first time an unknown type is seen', () => {
    const warnSpy = vi.fn();
    configureLogger({ sink: { warn: warnSpy } });

    normalizeActivityType('weird');
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toMatch(/unrecognised transaction type/i);
  });

  it('logs only once for repeated occurrences of the same unknown type', () => {
    const warnSpy = vi.fn();
    configureLogger({ sink: { warn: warnSpy } });

    normalizeActivityType('weird');
    normalizeActivityType('weird');
    normalizeActivityType('weird');

    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('logs once per distinct unknown type', () => {
    const warnSpy = vi.fn();
    configureLogger({ sink: { warn: warnSpy } });

    normalizeActivityType('type_a');
    normalizeActivityType('type_b');
    normalizeActivityType('type_a'); // duplicate — must not re-log

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('does not log for known types', () => {
    const warnSpy = vi.fn();
    configureLogger({ sink: { warn: warnSpy } });

    normalizeActivityType('create');
    normalizeActivityType('validate');
    normalizeActivityType('release');
    normalizeActivityType('redirect');

    expect(warnSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// toVault / toTx amount handling
// ---------------------------------------------------------------------------

describe('toVault activity amount mapping', () => {
  it('preserves a valid numeric amount', () => {
    const vault = toVault(
      makeApiVault({ activity: [makeActivity('create', '750')] }),
    );
    expect(vault.transactions[0].amount).toBe(750);
  });

  it('maps a NaN-producing amount string to 0', () => {
    const vault = toVault(
      makeApiVault({ activity: [makeActivity('create', 'not-a-number')] }),
    );
    expect(vault.transactions[0].amount).toBe(0);
  });

  it('maps an unknown type to the fallback and transaction is included', () => {
    _resetLoggedUnknownTypes();
    const vault = toVault(
      makeApiVault({ activity: [makeActivity('weird', '100')] }),
    );
    expect(vault.transactions).toHaveLength(1);
    expect(vault.transactions[0].type).toBe('unknown');
    expect(vault.transactions[0].amount).toBe(100);
  });

  it('known types are preserved correctly through toVault', () => {
    const activity = (['create', 'validate', 'release', 'redirect'] as const).map(
      (type, i) => makeActivity(type, String((i + 1) * 100)),
    );
    // activity items need unique ids
    const withIds = activity.map((a, i) => ({ ...a, id: `act-${i}` }));
    const vault = toVault(makeApiVault({ activity: withIds }));
    expect(vault.transactions.map((t) => t.type)).toEqual([
      'create',
      'validate',
      'release',
      'redirect',
    ]);
  });
});
