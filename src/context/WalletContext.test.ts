import { describe, it, expect } from 'vitest';
import { walletReducer, type WalletState } from './WalletContext';

const initialState: WalletState = {
    status: 'disconnected',
    address: null,
    network: null,
    balance: null,
    balanceStatus: 'idle',
    balanceError: null,
    error: null,
};

describe('walletReducer', () => {
    describe('RESTORE_START', () => {
        it('transitions from disconnected to restoring', () => {
            const result = walletReducer(initialState, { type: 'RESTORE_START' });
            expect(result.status).toBe('restoring');
            expect(result.error).toBeNull();
        });

        it('transitions from error to restoring', () => {
            const state: WalletState = { ...initialState, status: 'error', error: 'old error' };
            const result = walletReducer(state, { type: 'RESTORE_START' });
            expect(result.status).toBe('restoring');
            expect(result.error).toBeNull();
        });

        it('ignores RESTORE_START when already restoring', () => {
            const state: WalletState = { ...initialState, status: 'restoring' };
            const result = walletReducer(state, { type: 'RESTORE_START' });
            expect(result.status).toBe('restoring');
        });

        it('ignores RESTORE_START when connected', () => {
            const state: WalletState = { ...initialState, status: 'connected', address: 'addr' };
            const result = walletReducer(state, { type: 'RESTORE_START' });
            expect(result.status).toBe('connected');
        });
    });

    describe('RESTORE_ABORT', () => {
        it('transitions from restoring to disconnected', () => {
            const state: WalletState = { ...initialState, status: 'restoring' };
            const result = walletReducer(state, { type: 'RESTORE_ABORT' });
            expect(result.status).toBe('disconnected');
        });

        it('ignores when not restoring', () => {
            const result = walletReducer(initialState, { type: 'RESTORE_ABORT' });
            expect(result.status).toBe('disconnected');
        });
    });

    describe('CONNECT_START', () => {
        it('transitions to connecting and clears error', () => {
            const state: WalletState = { ...initialState, status: 'error', error: 'old' };
            const result = walletReducer(state, { type: 'CONNECT_START' });
            expect(result.status).toBe('connecting');
            expect(result.error).toBeNull();
        });

        it('always transitions regardless of current status', () => {
            const state: WalletState = { ...initialState, status: 'connected', address: 'addr' };
            const result = walletReducer(state, { type: 'CONNECT_START' });
            expect(result.status).toBe('connecting');
        });
    });

    describe('CONNECT_SUCCESS', () => {
        it('sets address, network, and clears error', () => {
            const state: WalletState = { ...initialState, status: 'connecting' };
            const result = walletReducer(state, {
                type: 'CONNECT_SUCCESS',
                payload: { address: 'GBD...', network: 'TESTNET' },
            });
            expect(result.status).toBe('connected');
            expect(result.address).toBe('GBD...');
            expect(result.network).toBe('TESTNET');
            expect(result.error).toBeNull();
        });
    });

    describe('CONNECT_ERROR', () => {
        it('sets error state', () => {
            const state: WalletState = { ...initialState, status: 'connecting' };
            const result = walletReducer(state, {
                type: 'CONNECT_ERROR',
                payload: { error: 'Connection failed' },
            });
            expect(result.status).toBe('error');
            expect(result.error).toBe('Connection failed');
        });
    });

    describe('DISCONNECT', () => {
        it('returns to initial state', () => {
            const state: WalletState = {
                ...initialState,
                status: 'connected',
                address: 'G...',
                network: 'PUBLIC',
                balance: '100',
                balanceStatus: 'success',
                error: null,
            };
            const result = walletReducer(state, { type: 'DISCONNECT' });
            expect(result).toEqual(initialState);
        });
    });

    describe('BALANCE_FETCH_START', () => {
        it('sets loading and clears balanceError', () => {
            const state: WalletState = { ...initialState, balanceError: 'old error' };
            const result = walletReducer(state, { type: 'BALANCE_FETCH_START' });
            expect(result.balanceStatus).toBe('loading');
            expect(result.balanceError).toBeNull();
        });
    });

    describe('BALANCE_FETCH_SUCCESS', () => {
        it('updates balance, status, and network', () => {
            const state: WalletState = { ...initialState, balanceStatus: 'loading' };
            const result = walletReducer(state, {
                type: 'BALANCE_FETCH_SUCCESS',
                payload: { balance: '25.5', status: 'success', network: 'TESTNET' },
            });
            expect(result.balance).toBe('25.5');
            expect(result.balanceStatus).toBe('success');
            expect(result.network).toBe('TESTNET');
        });

        it('handles no_trustline status', () => {
            const result = walletReducer(initialState, {
                type: 'BALANCE_FETCH_SUCCESS',
                payload: { balance: null, status: 'no_trustline', network: 'PUBLIC' },
            });
            expect(result.balance).toBeNull();
            expect(result.balanceStatus).toBe('no_trustline');
        });
    });

    describe('BALANCE_FETCH_ERROR', () => {
        it('clears balance and sets error', () => {
            const state: WalletState = { ...initialState, balance: '10', balanceStatus: 'success' };
            const result = walletReducer(state, {
                type: 'BALANCE_FETCH_ERROR',
                payload: { error: 'Horizon down' },
            });
            expect(result.balance).toBeNull();
            expect(result.balanceStatus).toBe('error');
            expect(result.balanceError).toBe('Horizon down');
        });
    });

    describe('UPDATE_NETWORK', () => {
        it('updates the network', () => {
            const result = walletReducer(initialState, {
                type: 'UPDATE_NETWORK',
                payload: { network: 'PUBLIC' },
            });
            expect(result.network).toBe('PUBLIC');
        });
    });

    describe('UPDATE_ADDRESS', () => {
        it('updates the address', () => {
            const result = walletReducer(initialState, {
                type: 'UPDATE_ADDRESS',
                payload: { address: 'GNEW' },
            });
            expect(result.address).toBe('GNEW');
        });
    });

    describe('default case', () => {
        it('returns state unchanged for unknown action', () => {
            const result = walletReducer(initialState, { type: 'UNKNOWN_ACTION' } as never);
            expect(result).toBe(initialState);
        });
    });
});
