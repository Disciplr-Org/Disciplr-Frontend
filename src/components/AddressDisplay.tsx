import { useState } from 'react';
import { truncateMiddle } from '../utils/truncate';
import type { WalletNetwork } from '../context/WalletContext';
import { isValidStellarAddress } from '../utils/stellarAddress';

interface AddressDisplayProps {
    address: string;
    network?: WalletNetwork | null;
    chars?: number;
    tailChars?: number;
}

export function AddressDisplay({
    address,
    network,
    chars = 6,
    tailChars = 4,
}: AddressDisplayProps) {
    const [copied, setCopied] = useState(false);
    const isValid = isValidStellarAddress(address);
    const display = truncateMiddle(address, chars, tailChars);

    const copy = () => {
        navigator.clipboard.writeText(address).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }).catch(() => {});
    };

    const explorerBase =
        network === 'PUBLIC'
            ? 'https://stellar.expert/explorer/public/account'
            : 'https://stellar.expert/explorer/testnet/account';

    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span
                role="text"
                title={isValid ? address : `Invalid address: ${address}`}
                aria-label={isValid ? `Address ${address}` : `Invalid address ${address}`}
                style={{ 
                    fontFamily: 'monospace', 
                    fontSize: 'inherit',
                    color: isValid ? 'inherit' : 'var(--error)',
                    textDecoration: isValid ? 'none' : 'line-through' 
                }}
            >
                {display}
            </span>
            <button
                type="button"
                onClick={copy}
                title="Copy address"
                aria-label={copied ? 'Copied' : 'Copy address'}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: copied ? 'var(--success)' : 'var(--muted)',
                    padding: '0 2px', fontSize: 13, lineHeight: 1,
                }}
            >
                {copied ? 'âœ“' : 'âŽ˜'}
            </button>

            {network != null && isValid && (
                <a
                    href={`${explorerBase}/${address}`}
                    target="_blank" rel="noopener noreferrer"
                    title="View on Stellar Expert"
                    aria-label={`View ${address} on Stellar Expert`}
                    style={{ color: 'var(--accent)', fontSize: 12, lineHeight: 1 }}
                >
                    â†—
                </a>
            )}
        </span>
    );
}
