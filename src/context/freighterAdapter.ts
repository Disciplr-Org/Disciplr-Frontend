/**
 * FreighterAdapter
 *
 * A thin interface over @stellar/freighter-api so the wallet provider can be
 * tested without touching the real browser extension. Swap this with a fake
 * implementation in tests or future wallet integrations.
 */

import {
  isAllowed,
  setAllowed,
  requestAccess,
  getAddress,
  getNetworkDetails,
} from '@stellar/freighter-api';

export interface FreighterAdapter {
  isAllowed(): Promise<{ isAllowed: boolean }>;
  setAllowed(): Promise<void>;
  requestAccess(): Promise<boolean>;
  getAddress(): Promise<{ address: string | null; error: string | null }>;
  getNetworkDetails(): Promise<{ network: string }>;
}

/** Production adapter — delegates directly to @stellar/freighter-api. */
export const defaultFreighterAdapter: FreighterAdapter = {
  isAllowed: () => isAllowed() as Promise<{ isAllowed: boolean }>,
  setAllowed: () => setAllowed() as Promise<void>,
  requestAccess: () => requestAccess() as Promise<boolean>,
  getAddress: () => getAddress() as Promise<{ address: string | null; error: string | null }>,
  getNetworkDetails: () => getNetworkDetails() as Promise<{ network: string }>,
};
