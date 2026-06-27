import { describe, it, expect } from 'vitest';
import {
  VAULT_STATUS_ORDER,
  type VaultStatus,
  type MilestoneStatus,
  type TxType,
  type TxStatus,
} from '../vault';
import type { ChipStatus } from '../../components/StatusChip';

describe('shared vault status types', () => {
  describe('VAULT_STATUS_ORDER', () => {
    it('lists every VaultStatus member', () => {
      const expected: VaultStatus[] = [
        'active',
        'pending_validation',
        'completed',
        'failed',
        'cancelled',
      ];
      expect([...VAULT_STATUS_ORDER].sort()).toEqual([...expected].sort());
    });

    it('has no duplicate entries', () => {
      expect(new Set(VAULT_STATUS_ORDER).size).toBe(VAULT_STATUS_ORDER.length);
    });

    it('is ordered from most to least active', () => {
      expect(VAULT_STATUS_ORDER).toEqual([
        'active',
        'pending_validation',
        'completed',
        'failed',
        'cancelled',
      ]);
    });

    it('can be used as a stable sort key', () => {
      const shuffled: VaultStatus[] = ['cancelled', 'active', 'failed', 'pending_validation', 'completed'];
      const sorted = [...shuffled].sort(
        (a, b) => VAULT_STATUS_ORDER.indexOf(a) - VAULT_STATUS_ORDER.indexOf(b),
      );
      expect(sorted).toEqual([...VAULT_STATUS_ORDER]);
    });
  });

  describe('VaultStatus / ChipStatus alignment', () => {
    it('treats every VaultStatus as a valid ChipStatus', () => {
      // Compile-time guarantee (VaultStatus must extend ChipStatus), exercised
      // at runtime over the canonical order array. If a VaultStatus member were
      // not assignable to ChipStatus, this assignment would fail to type-check.
      const asChipStatuses: ChipStatus[] = VAULT_STATUS_ORDER.map((status) => status);
      expect(asChipStatuses).toEqual([...VAULT_STATUS_ORDER]);
    });
  });

  describe('union members', () => {
    it('exposes the expected MilestoneStatus members', () => {
      const milestoneStatuses: MilestoneStatus[] = ['pending', 'validated', 'failed'];
      expect(new Set(milestoneStatuses).size).toBe(milestoneStatuses.length);
    });

    it('exposes the expected TxType members', () => {
      const txTypes: TxType[] = ['create', 'validate', 'release', 'redirect'];
      expect(new Set(txTypes).size).toBe(txTypes.length);
    });

    it('exposes the expected TxStatus members', () => {
      const txStatuses: TxStatus[] = ['confirmed', 'pending', 'failed'];
      expect(new Set(txStatuses).size).toBe(txStatuses.length);
    });
  });
});
