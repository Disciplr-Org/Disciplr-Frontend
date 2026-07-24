import { useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { WalletConnectButton } from './Wallet/WalletConnectButton';

interface RequireWalletProps {
  children: React.ReactNode;
}

export default function RequireWallet({ children }: RequireWalletProps) {
  const { address, isConnecting } = useWallet();
  const location = useLocation();

  if (address) return <>{children}</>;

  return (
    <div
      role="main"
      aria-labelledby="connect-wallet-heading"
      style={{ textAlign: 'center', padding: '4rem 1rem' }}
    >
      <h1 id="connect-wallet-heading">Connect your wallet</h1>
      <p>You need a connected wallet to access this page.</p>
      {isConnecting && <p aria-live="polite">Connecting…</p>}
      <WalletConnectButton />
      {/* Preserve destination so redirect can happen after connecting */}
      <input type="hidden" value={location.pathname + location.search} />
    </div>
  );
}
