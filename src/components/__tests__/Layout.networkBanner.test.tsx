import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WalletNetwork } from '../../context/WalletContext';

// Wallet state is a shared mutable object so individual tests can switch the
// reported Freighter network without remounting anything.
const walletState = vi.hoisted(() => ({
  status: 'connected' as string,
  isDemo: false,
  isConnecting: false,
  address: null as string | null,
  network: null as WalletNetwork | null,
}));

vi.mock('../../context/WalletContext', () => ({
  useOptionalWallet: () => walletState,
  useWallet: () => walletState,
}));

// Keep the Layout chrome light: none of these surfaces are relevant to
// whether the mismatch banner is mounted.
vi.mock('../../notifications/usePushDelivery', () => ({ usePushDelivery: () => {} }));
vi.mock('../Notification/NotificationBell', () => ({ default: () => null }));
vi.mock('../CommandPalette', () => ({ default: () => null }));
vi.mock('../ThemeToggle', () => ({ default: () => null }));
vi.mock('../ToastViewport', () => ({ ToastViewport: () => null }));
vi.mock('../ShortcutsHelp', () => ({ ShortcutsHelp: () => null }));
vi.mock('../Wallet/WalletConnectButton', () => ({ WalletConnectButton: () => null }));
vi.mock('../hooks/useScrollRestoration', () => ({ useScrollRestoration: () => {} }));

import Layout from '../Layout';

function renderLayout() {
  return render(
    <MemoryRouter>
      <Layout>
        <div>page content</div>
      </Layout>
    </MemoryRouter>,
  );
}

function setWallet(address: string | null, network: WalletNetwork | null) {
  walletState.address = address;
  walletState.network = network;
}

describe('Layout network-mismatch banner', () => {
  beforeEach(() => {
    setWallet(null, null);
    walletState.isDemo = false;
    walletState.status = 'connected';
    walletState.isConnecting = false;
  });

  it('renders the mismatch alert before <main> when the wallet is on the wrong network', () => {
    setWallet('GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ', 'PUBLIC');

    const { container } = renderLayout();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Wrong wallet network');
    // The region is mounted by Layout (outside the routed page content) so it
    // shows on every route, and sits before <main> in the document order.
    const main = container.querySelector('main');
    expect(main).not.toContainElement(alert);
    expect(
      main?.compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
  });

  it('shows no mismatch alert when the wallet matches the expected network', () => {
    setWallet('GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ', 'TESTNET');

    renderLayout();

    expect(screen.queryByText(/Wrong wallet network/i)).not.toBeInTheDocument();
  });

  it('shows no mismatch alert while the wallet is disconnected', () => {
    setWallet(null, 'PUBLIC');

    renderLayout();

    expect(screen.queryByText(/Wrong wallet network/i)).not.toBeInTheDocument();
  });
});
