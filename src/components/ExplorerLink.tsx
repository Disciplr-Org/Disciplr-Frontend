import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { useWallet, type WalletNetwork } from '../context/WalletContext';
import { explorerUrl, type ExplorerKind } from '../utils/explorer';
import { SafeLink } from './SafeLink';

interface ExplorerLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  kind: ExplorerKind;
  id: string;
  network?: WalletNetwork | null;
  children: ReactNode;
}

export function ExplorerLink({
  kind,
  id,
  network,
  children,
  className,
  style,
  title,
  ...linkProps
}: ExplorerLinkProps) {
  const { network: connectedNetwork } = useWallet();
  const href = explorerUrl(network ?? connectedNetwork, kind, id);

  if (!href) {
    return (
      <span
        aria-disabled="true"
        className={className}
        style={style}
        title={title ?? 'Explorer link unavailable'}
      >
        {children}
      </span>
    );
  }

  const ariaLabel = linkProps['aria-label'] ?? `View ${kind} ${id} on Stellar Expert`;

  return (
    <SafeLink
      href={href}
      className={className}
      style={style}
      title={title}
      {...linkProps}
      aria-label={ariaLabel}
    >
      {children}
    </SafeLink>
  );
}
