import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppConfigProvider, useAppConfig } from '../AppConfigContext';
import { WalletProvider, useWallet } from '../WalletContext';
import { EXPLORER_BASE_URLS, HORIZON_URLS, USDC_ISSUERS } from '../../utils/horizon';

const freighterMocks = vi.hoisted(() => ({
    isAllowed: vi.fn(),
    setAllowed: vi.fn(),
    requestAccess: vi.fn(),
    getAddress: vi.fn(),
    getNetworkDetails: vi.fn(),
}));

vi.mock('@stellar/freighter-api', () => freighterMocks);

function mockResponse(status: number, body: unknown) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: vi.fn().mockResolvedValue(body),
    } as unknown as Response;
}

function AppConfigProbe() {
    const wallet = useWallet();
    const appConfig = useAppConfig();

    return (
        <div>
            <button type="button" onClick={wallet.connect}>
                Connect
            </button>
            <button type="button" onClick={wallet.disconnect}>
                Disconnect
            </button>
            <div data-testid="network">{appConfig.network}</div>
            <div data-testid="horizonUrl">{appConfig.horizonUrl}</div>
            <div data-testid="usdcIssuer">{appConfig.usdcIssuer}</div>
            <div data-testid="explorerBaseUrl">{appConfig.explorerBaseUrl}</div>
        </div>
    );
}

function UnsafeProbe() {
    useAppConfig();
    return null;
}

function renderAppConfig() {
    return render(
        <WalletProvider>
            <AppConfigProvider>
                <AppConfigProbe />
            </AppConfigProvider>
        </WalletProvider>,
    );
}

describe('AppConfigContext', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.resetAllMocks();
        freighterMocks.isAllowed.mockResolvedValue(false);
        freighterMocks.setAllowed.mockResolvedValue(undefined);
        freighterMocks.requestAccess.mockResolvedValue(true);
        freighterMocks.getAddress.mockResolvedValue({ address: 'GCONNECTED', error: null });
        freighterMocks.getNetworkDetails.mockResolvedValue({ network: 'TESTNET' });
        globalThis.fetch = vi.fn();
    });

    afterAll(() => {
        globalThis.fetch = originalFetch;
    });

    test('defaults to TESTNET config when the wallet is disconnected', () => {
        renderAppConfig();

        expect(screen.getByTestId('network')).toHaveTextContent('TESTNET');
        expect(screen.getByTestId('horizonUrl')).toHaveTextContent(HORIZON_URLS.TESTNET);
        expect(screen.getByTestId('usdcIssuer')).toHaveTextContent(USDC_ISSUERS.TESTNET);
        expect(screen.getByTestId('explorerBaseUrl')).toHaveTextContent(EXPLORER_BASE_URLS.TESTNET);
    });

    test('updates config when the wallet network changes', async () => {
        vi.mocked(globalThis.fetch).mockResolvedValue(
            mockResponse(200, {
                balances: [
                    {
                        asset_type: 'credit_alphanum4',
                        asset_code: 'USDC',
                        asset_issuer: USDC_ISSUERS.PUBLIC,
                        balance: '10.0000000',
                    },
                ],
            }),
        );
        freighterMocks.getNetworkDetails.mockResolvedValue({ network: 'PUBLIC' });

        renderAppConfig();
        fireEvent.click(screen.getByRole('button', { name: /^connect$/i }));

        await waitFor(() => expect(screen.getByTestId('network')).toHaveTextContent('PUBLIC'));
        expect(screen.getByTestId('horizonUrl')).toHaveTextContent(HORIZON_URLS.PUBLIC);
        expect(screen.getByTestId('usdcIssuer')).toHaveTextContent(USDC_ISSUERS.PUBLIC);
        expect(screen.getByTestId('explorerBaseUrl')).toHaveTextContent(EXPLORER_BASE_URLS.PUBLIC);
    });

    test('reverts to the default TESTNET config after disconnect', async () => {
        vi.mocked(globalThis.fetch).mockResolvedValue(
            mockResponse(200, {
                balances: [
                    {
                        asset_type: 'credit_alphanum4',
                        asset_code: 'USDC',
                        asset_issuer: USDC_ISSUERS.PUBLIC,
                        balance: '10.0000000',
                    },
                ],
            }),
        );
        freighterMocks.getNetworkDetails.mockResolvedValue({ network: 'PUBLIC' });

        renderAppConfig();
        fireEvent.click(screen.getByRole('button', { name: /^connect$/i }));

        await waitFor(() => expect(screen.getByTestId('network')).toHaveTextContent('PUBLIC'));

        fireEvent.click(screen.getByRole('button', { name: /disconnect/i }));

        expect(screen.getByTestId('network')).toHaveTextContent('TESTNET');
        expect(screen.getByTestId('horizonUrl')).toHaveTextContent(HORIZON_URLS.TESTNET);
        expect(screen.getByTestId('usdcIssuer')).toHaveTextContent(USDC_ISSUERS.TESTNET);
        expect(screen.getByTestId('explorerBaseUrl')).toHaveTextContent(EXPLORER_BASE_URLS.TESTNET);
    });

    test('throws when useAppConfig is rendered outside the provider', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(() => render(<UnsafeProbe />)).toThrow('useAppConfig must be used within an AppConfigProvider');

        error.mockRestore();
    });
});
