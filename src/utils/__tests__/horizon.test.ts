import { fetchUsdcBalance, horizonUrl, HorizonBalanceError, USDC_ISSUERS } from '../horizon';

function mockResponse(status: number, body: unknown) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: vi.fn().mockResolvedValue(body),
    } as unknown as Response;
}

const malformedBalanceCases: Array<[string, unknown]> = [
    ['non-numeric text', 'not-a-balance'],
    ['NaN-like text', 'NaN'],
    ['infinite text', 'Infinity'],
    ['exponent notation', '1e4'],
    ['missing field', undefined],
];

describe('horizon wallet balance helpers', () => {
    test('returns the Horizon URL for each supported network', () => {
        expect(horizonUrl('TESTNET')).toBe('https://horizon-testnet.stellar.org');
        expect(horizonUrl('PUBLIC')).toBe('https://horizon.stellar.org');
    });

    test('fetches the matching testnet USDC trustline balance', async () => {
        const fetcher = vi.fn().mockResolvedValue(
            mockResponse(200, {
                balances: [
                    { asset_type: 'native', balance: '12.0000000' },
                    {
                        asset_type: 'credit_alphanum4',
                        asset_code: 'USDC',
                        asset_issuer: USDC_ISSUERS.TESTNET,
                        balance: '25.5000000',
                    },
                ],
            }),
        );

        await expect(fetchUsdcBalance('GTEST ACCOUNT', 'TESTNET', fetcher)).resolves.toEqual({
            balance: '25.5000000',
            hasTrustline: true,
            issuer: USDC_ISSUERS.TESTNET,
            network: 'TESTNET',
        });
        expect(fetcher).toHaveBeenCalledWith('https://horizon-testnet.stellar.org/accounts/GTEST%20ACCOUNT');
    });

    test('returns zero with no trustline when Horizon has no matching USDC issuer', async () => {
        const fetcher = vi.fn().mockResolvedValue(
            mockResponse(200, {
                balances: [
                    {
                        asset_type: 'credit_alphanum4',
                        asset_code: 'USDC',
                        asset_issuer: 'GDifferentIssuer',
                        balance: '99.0000000',
                    },
                ],
            }),
        );

        await expect(fetchUsdcBalance('GPUBLIC', 'PUBLIC', fetcher)).resolves.toEqual({
            balance: '0.00',
            hasTrustline: false,
            issuer: USDC_ISSUERS.PUBLIC,
            network: 'PUBLIC',
        });
    });

    test('throws an account-not-found error for Horizon 404 responses', async () => {
        const fetcher = vi.fn().mockResolvedValue(mockResponse(404, {}));

        await expect(fetchUsdcBalance('GMISSING', 'TESTNET', fetcher)).rejects.toMatchObject({
            name: 'HorizonBalanceError',
            code: 'ACCOUNT_NOT_FOUND',
        } satisfies Partial<HorizonBalanceError>);
    });

    test('throws a request error for non-OK Horizon responses', async () => {
        const fetcher = vi.fn().mockResolvedValue(mockResponse(500, {}));

        await expect(fetchUsdcBalance('GFAIL', 'PUBLIC', fetcher)).rejects.toMatchObject({
            code: 'REQUEST_FAILED',
            message: 'Horizon balance request failed with status 500.',
        });
    });

    test('throws an invalid-response error when balances are missing', async () => {
        const fetcher = vi.fn().mockResolvedValue(mockResponse(200, { id: 'GNO_BALANCES' }));

        await expect(fetchUsdcBalance('GNO_BALANCES', 'PUBLIC', fetcher)).rejects.toMatchObject({
            code: 'INVALID_RESPONSE',
        });
    });

    test.each(malformedBalanceCases)(
        'throws an invalid-response error for %s USDC balance values',
        async (_caseName: string, malformedBalance: unknown) => {
            const fetcher = vi.fn().mockResolvedValue(
                mockResponse(200, {
                    balances: [
                        {
                            asset_type: 'credit_alphanum4',
                            asset_code: 'USDC',
                            asset_issuer: USDC_ISSUERS.PUBLIC,
                            balance: malformedBalance,
                        },
                    ],
                }),
            );

            await expect(fetchUsdcBalance('GBAD_BALANCE', 'PUBLIC', fetcher)).rejects.toMatchObject({
                code: 'INVALID_RESPONSE',
                message: 'Horizon USDC balance was not a finite numeric string.',
            });
        },
    );
});
