import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Shared mock function — referenced by both factory and tests ─────

const mockUseWalletFn = vi.fn(() => ({
    address: null as string | null,
    network: null as string | null,
}));

vi.mock('../context/WalletContext', () => ({
    useWallet: (...args: unknown[]) => mockUseWalletFn(...args),
}));

vi.mock('../utils/walletTelemetry', () => ({
    recordWalletTelemetry: vi.fn(),
}));

// Import after mocks
import { NetworkMismatchBanner } from './NetworkMismatchBanner';
import { recordWalletTelemetry } from '../utils/walletTelemetry';

const mockRecordTelemetry = vi.mocked(recordWalletTelemetry);

// ── Helpers ────────────────────────────────────────────────────────

const VALID_ADDR = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const ADDR2 = 'CAAFBFRSQV5A3YQJYBIKWNODW4Y7RZIH2FP3VK2WJCSCFUXNIQW3C7OY';

function renderBanner(overrides: { address?: string | null; network?: string | null } = {}) {
    mockUseWalletFn.mockReturnValue({
        address: overrides.address ?? null,
        network: overrides.network ?? null,
    } as ReturnType<typeof mockUseWalletFn>);

    return render(<NetworkMismatchBanner />);
}

function renderBannerWithExpected(
    expectedNetwork: string,
    walletOverrides: { address?: string | null; network?: string | null } = {},
) {
    mockUseWalletFn.mockReturnValue({
        address: walletOverrides.address ?? null,
        network: walletOverrides.network ?? null,
    } as ReturnType<typeof mockUseWalletFn>);

    return render(
        <NetworkMismatchBanner expectedNetwork={expectedNetwork as 'TESTNET' | 'PUBLIC'} />,
    );
}

// ── Tests ──────────────────────────────────────────────────────────

describe('NetworkMismatchBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Happy path: no mismatch ──────────────────────────────────

    it('renders nothing when wallet address is not set', () => {
        const { container } = renderBanner();
        expect(container.innerHTML).toBe('');
    });

    it('renders nothing when wallet network matches expected (TESTNET = TESTNET)', () => {
        const { container } = renderBanner({ address: VALID_ADDR, network: 'TESTNET' });
        expect(container.innerHTML).toBe('');
    });

    it('renders nothing when wallet network matches expected (PUBLIC = PUBLIC)', () => {
        const { container } = renderBannerWithExpected('PUBLIC', {
            address: VALID_ADDR,
            network: 'PUBLIC',
        });
        expect(container.innerHTML).toBe('');
    });

    // ── Mismatch detected ────────────────────────────────────────

    it('shows banner when wallet is on PUBLIC but app expects TESTNET', () => {
        renderBanner({ address: VALID_ADDR, network: 'PUBLIC' });
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/wrong wallet network/i)).toBeInTheDocument();
    });

    it('shows banner when wallet is on TESTNET but app expects PUBLIC', () => {
        renderBannerWithExpected('PUBLIC', {
            address: VALID_ADDR,
            network: 'TESTNET',
        });
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('displays the wallet network label in the banner text', () => {
        renderBanner({ address: VALID_ADDR, network: 'PUBLIC' });
        expect(screen.getByText(/mainnet/i)).toBeInTheDocument();
    });

    it('displays the expected network label in the banner text', () => {
        renderBanner({ address: VALID_ADDR, network: 'PUBLIC' });
        expect(screen.getByText(/testnet/i)).toBeInTheDocument();
    });

    it('renders the "Switch network" link pointing to Freighter docs', () => {
        renderBanner({ address: VALID_ADDR, network: 'PUBLIC' });
        const link = screen.getByText(/switch network/i);
        expect(link).toHaveAttribute('href', 'https://docs.freighter.app/');
        expect(link).toHaveAttribute('target', '_blank');
    });

    // ── Dismiss behavior ─────────────────────────────────────────

    it('dismisses the banner when the dismiss button is clicked', () => {
        renderBanner({ address: VALID_ADDR, network: 'PUBLIC' });
        expect(screen.getByRole('alert')).toBeInTheDocument();

        const dismissBtn = screen.getByLabelText(/dismiss network mismatch/i);
        fireEvent.click(dismissBtn);

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows banner again after dismiss if wallet network changes (different mismatch key)', () => {
        const { rerender } = renderBanner({ address: VALID_ADDR, network: 'PUBLIC' });

        fireEvent.click(screen.getByLabelText(/dismiss network mismatch/i));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();

        // Change to different mismatch — should show again
        mockUseWalletFn.mockReturnValue({
            address: VALID_ADDR,
            network: 'TESTNET',
        } as ReturnType<typeof mockUseWalletFn>);
        rerender(<NetworkMismatchBanner expectedNetwork="PUBLIC" />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('records telemetry when banner is dismissed', () => {
        renderBanner({ address: VALID_ADDR, network: 'PUBLIC' });
        fireEvent.click(screen.getByLabelText(/dismiss network mismatch/i));

        expect(mockRecordTelemetry).toHaveBeenCalledWith(
            expect.objectContaining({ event: 'wallet.network.dismissed' }),
        );
    });

    // ── Recovery ─────────────────────────────────────────────────

    it('hides banner when network mismatch resolves', () => {
        const { rerender } = renderBanner({ address: VALID_ADDR, network: 'PUBLIC' });
        expect(screen.getByRole('alert')).toBeInTheDocument();

        mockUseWalletFn.mockReturnValue({
            address: VALID_ADDR,
            network: 'TESTNET',
        } as ReturnType<typeof mockUseWalletFn>);
        rerender(<NetworkMismatchBanner />);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('records telemetry when mismatch resolves', () => {
        const { rerender } = renderBanner({ address: VALID_ADDR, network: 'PUBLIC' });

        mockUseWalletFn.mockReturnValue({
            address: VALID_ADDR,
            network: 'TESTNET',
        } as ReturnType<typeof mockUseWalletFn>);
        rerender(<NetworkMismatchBanner />);

        expect(mockRecordTelemetry).toHaveBeenCalledWith(
            expect.objectContaining({ event: 'wallet.network.recovered' }),
        );
    });

    // ── Hostile input / validation boundary ──────────────────────

    it('does not show banner when address is an invalid string', () => {
        renderBanner({ address: 'not-a-valid-stellar-address', network: 'PUBLIC' });
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not show banner when network is an unknown string', () => {
        renderBanner({ address: VALID_ADDR, network: 'STANDALONE' });
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not show banner when network is null even with valid address', () => {
        renderBanner({ address: VALID_ADDR, network: null });
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not show banner when address is null even with mismatching network', () => {
        renderBanner({ address: null, network: 'PUBLIC' });
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not crash with empty string address', () => {
        expect(() => renderBanner({ address: '', network: 'PUBLIC' })).not.toThrow();
    });

    it('does not crash with empty string network', () => {
        expect(() => renderBanner({ address: VALID_ADDR, network: '' })).not.toThrow();
    });

    it('does not show banner for lowercase network variant (not in known set)', () => {
        renderBanner({ address: VALID_ADDR, network: 'public' });
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // ── Dismiss state is tamper-resistant ────────────────────────

    it('does not carry dismiss state across different address+network combinations', () => {
        const { rerender } = renderBanner({ address: VALID_ADDR, network: 'PUBLIC' });
        fireEvent.click(screen.getByLabelText(/dismiss network mismatch/i));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();

        mockUseWalletFn.mockReturnValue({
            address: ADDR2,
            network: 'PUBLIC',
        } as ReturnType<typeof mockUseWalletFn>);
        rerender(<NetworkMismatchBanner />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // ── Telemetry ────────────────────────────────────────────────

    it('records telemetry when mismatch banner first appears', () => {
        renderBanner({ address: VALID_ADDR, network: 'PUBLIC' });

        expect(mockRecordTelemetry).toHaveBeenCalledWith(
            expect.objectContaining({ event: 'wallet.network.mismatch_shown' }),
        );
    });
});
