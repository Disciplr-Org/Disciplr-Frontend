import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddressDisplay } from '../AddressDisplay';

const LONG = 'GA2C5RFPE6G6KXHEIRHZXSNBR3CJRBGUPTAOOVHRF4AFPS5YUMVSWH7B';
const SHORT = 'GSHORT';
const INVALID = 'GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L'; // 44 chars

describe('AddressDisplay', () => {
    describe('truncation', () => {
        it('truncates a long address to head+tail chars', () => {
            render(<AddressDisplay address={LONG} />);
            expect(screen.getByRole('text')).toHaveTextContent('GA2C5R...WH7B');
        });

        it('does not truncate a short address', () => {
            render(<AddressDisplay address={SHORT} />);
            expect(screen.getByRole('text')).toHaveTextContent(SHORT);
        });

        it('respects custom chars and tailChars', () => {
            render(<AddressDisplay address={LONG} chars={4} tailChars={6} />);
            expect(screen.getByRole('text')).toHaveTextContent('GA2C...VSWH7B');
        });
    });

    describe('accessibility & invalid marking', () => {
        it('exposes the full address in title and aria-label for valid addresses', () => {
            render(<AddressDisplay address={LONG} />);
            const el = screen.getByRole('text');
            expect(el).toHaveAttribute('title', LONG);
            expect(el).toHaveAttribute('aria-label', `Address ${LONG}`);
            expect(el).not.toHaveStyle({ textDecoration: 'line-through' });
        });

        it('marks invalid addresses with warning labels and styles', () => {
            render(<AddressDisplay address={INVALID} />);
            const el = screen.getByRole('text');
            expect(el).toHaveAttribute('title', `Invalid address: ${INVALID}`);
            expect(el).toHaveAttribute('aria-label', `Invalid address ${INVALID}`);
            expect(el).toHaveStyle({ textDecoration: 'line-through' });
        });
    });

    describe('copy button', () => {
        beforeEach(() => {
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: vi.fn().mockResolvedValue(undefined) },
                configurable: true,
            });
        });

        it('copies the full address and announces success', async () => {
            render(<AddressDisplay address={LONG} />);
            const btn = screen.getByRole('button', { name: /copy address/i });
            fireEvent.click(btn);
            await waitFor(() =>
                expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument(),
            );
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(LONG);
        });

        it('reverts the copy label after 1.5 s', async () => {
            vi.useFakeTimers();
            render(<AddressDisplay address={LONG} />);
            fireEvent.click(screen.getByRole('button', { name: /copy address/i }));
            // flush the clipboard Promise, then advance timers
            await act(async () => { await Promise.resolve(); });
            await act(async () => { vi.advanceTimersByTime(1500); });
            expect(screen.getByRole('button', { name: /copy address/i })).toBeInTheDocument();
            vi.useRealTimers();
        });

        it('does not throw when clipboard API is unavailable', () => {
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: vi.fn().mockRejectedValue(new Error('no clipboard')) },
                configurable: true,
            });
            render(<AddressDisplay address={LONG} />);
            expect(() =>
                fireEvent.click(screen.getByRole('button', { name: /copy address/i })),
            ).not.toThrow();
        });
    });

    describe('explorer link', () => {
        it('renders a testnet explorer link when network is TESTNET', () => {
            render(<AddressDisplay address={LONG} network="TESTNET" />);
            const link = screen.getByRole('link', { name: /view.*on stellar expert/i });
            expect(link).toHaveAttribute(
                'href',
                `https://stellar.expert/explorer/testnet/account/${LONG}`,
            );
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        });

        it('renders a public explorer link when network is PUBLIC', () => {
            render(<AddressDisplay address={LONG} network="PUBLIC" />);
            expect(screen.getByRole('link', { name: /view.*on stellar expert/i })).toHaveAttribute(
                'href',
                `https://stellar.expert/explorer/public/account/${LONG}`,
            );
        });

        it('hides the explorer link when network is omitted', () => {
            render(<AddressDisplay address={LONG} />);
            expect(screen.queryByRole('link')).not.toBeInTheDocument();
        });

        it('hides the explorer link when network is null', () => {
            render(<AddressDisplay address={LONG} network={null} />);
            expect(screen.queryByRole('link')).not.toBeInTheDocument();
        });

        it('hides the explorer link when address is invalid', () => {
            render(<AddressDisplay address={INVALID} network="TESTNET" />);
            expect(screen.queryByRole('link')).not.toBeInTheDocument();
        });
    });
});
