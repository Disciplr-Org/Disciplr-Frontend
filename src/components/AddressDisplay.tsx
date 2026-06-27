import { useState } from 'react';
import type { WalletNetwork } from '../context/WalletContext';

interface AddressDisplayProps {
    address: string;
    /** Controls the explorer network path. Omit to hide the explorer link. */
    network?: WalletNetwork | null;
    /** Characters to keep at the head of the truncated display. Default 6. */
    chars?: number;
    /** Characters to keep at the tail of the truncated display. Default 4. */
    tailChars?: number;
}

function truncate(addr: string, head: number, tail: number): string {
    if (addr.length <= head + tail + 3) return addr;
    return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

export function AddressDisplay({
    address,
    network,
    chars = 6,
    tailChars = 4,
}: AddressDisplayProps) {
    const [copied, setCopied] = useState(false);

    const display = truncate(address, chars, tailChars);

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
                title={address}
                aria-label={`Address ${address}`}
                style={{ fontFamily: 'monospace', fontSize: 'inherit' }}
            >
                {display}
            </span>

            <button
                type="button"
                onClick={copy}
                title="Copy address"
                aria-label={copied ? 'Copied' : 'Copy address'}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: copied ? 'var(--success)' : 'var(--muted)',
                    padding: '0 2px',
                    fontSize: 13,
                    lineHeight: 1,
                }}
            >
                {copied ? '✓' : '⎘'}
            </button>

            {network != null && (
                <a
                    href={`${explorerBase}/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on Stellar Expert"
                    aria-label={`View ${address} on Stellar Expert`}
                    style={{ color: 'var(--accent)', fontSize: 12, lineHeight: 1 }}
                >
                    ↗
                </a>
            )}
        </span>
    );
}
