import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useWallet, type WalletNetwork } from './WalletContext';
import { explorerBaseUrl as getExplorerBaseUrl } from '../utils/explorer';
import { HORIZON_URLS, USDC_ISSUERS } from '../utils/horizon';

export interface AppConfig {
    network: WalletNetwork;
    horizonUrl: string;
    usdcIssuer: string;
    explorerBaseUrl: string;
}

const DEFAULT_NETWORK: WalletNetwork = 'TESTNET';

const AppConfigContext = createContext<AppConfig | undefined>(undefined);

// Centralizes network-aware configuration so the app can consume a single source of truth.
export function AppConfigProvider({ children }: { children: ReactNode }) {
    const { network: walletNetwork } = useWallet();
    const network = walletNetwork ?? DEFAULT_NETWORK;

    const value = useMemo<AppConfig>(
        () => ({
            network,
            horizonUrl: HORIZON_URLS[network],
            usdcIssuer: USDC_ISSUERS[network],
            explorerBaseUrl: getExplorerBaseUrl(network),
        }),
        [network],
    );

    return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
    const context = useContext(AppConfigContext);
    if (context === undefined) {
        throw new Error('useAppConfig must be used within an AppConfigProvider');
    }
    return context;
}
