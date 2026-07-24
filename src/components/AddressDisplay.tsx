import { useState } from 'react';
import { truncateMiddle } from '../utils/truncate';
import type { WalletNetwork } from '../context/WalletContext';
import { getExplorerAccountUrl } from '../utils/explorer';
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

    const display = truncateMiddle(address, chars, tailChars);
    const isValid = isValidStellarAddress(address);
    const explorerUrl = getExplorerAccountUrl(address, network);

    const copy = () => {
        navigator.clipboard.writeText(address).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }).catch(() => {});
    };

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
            {network != null && explorerUrl && (
                <a
                    href={explorerUrl}
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

