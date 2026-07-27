import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { WalletConnectButton } from './Wallet/WalletConnectButton';

interface RequireWalletProps {
  children: ReactNode;
}

export default function RequireWallet({ children }: RequireWalletProps) {
  const { address, isConnecting } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();
  const destinationRef = useRef(location.pathname + location.search);

  useEffect(() => {
    if (address) {
      navigate(destinationRef.current, { replace: true });
    }
  }, [address, navigate]);

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
    </div>
  );
}
