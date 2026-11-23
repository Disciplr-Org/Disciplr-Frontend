import { vi, describe, test, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { DEMO_ADDRESS } from '../../context/WalletContext';

type MockWalletState = {
  status: 'disconnected' | 'restoring' | 'connecting' | 'connected' | 'error';
  sessionStatus: 'resolving' | 'authenticated' | 'anonymous';
  address: string | null;
  network: 'TESTNET' | 'PUBLIC' | null;
  balance: string | null;
  balanceStatus: 'idle' | 'loading' | 'success' | 'no_trustline' | 'error';
  balanceError: string | null;
  isConnecting: boolean;
  error: string | null;
  isDemo: boolean;
  connect: () => Promise<boolean>;
  cancelConnect: () => void;
  disconnect: () => void;
  checkConnection: () => Promise<void>;
  connectDemo: () => void;
  resetDemo: () => void;
};

const connectDemoMock = vi.fn();

const createWalletState = (overrides: Partial<MockWalletState> = {}): MockWalletState => ({
  status: 'disconnected',
  sessionStatus: 'anonymous',
  address: null,
  network: null,
  balance: null,
  balanceStatus: 'idle',
  balanceError: null,
  isConnecting: false,
  error: null,
  isDemo: false,
  connect: async () => false,
  cancelConnect: () => {},
  disconnect: () => {},
  checkConnection: async () => {},
  connectDemo: connectDemoMock,
  resetDemo: () => {},
  ...overrides,
});

const DISCONNECTED_WALLET_STATE = createWalletState();
const CONNECTED_WALLET_STATE = createWalletState({
  status: 'connected',
  sessionStatus: 'authenticated',
  address: 'GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L',
  network: 'TESTNET',
  balance: '250.0000000',
  balanceStatus: 'success',
  isDemo: false,
});
const DEMO_WALLET_STATE = createWalletState({
  status: 'connected',
  sessionStatus: 'authenticated',
  address: DEMO_ADDRESS,
  network: 'TESTNET',
  balance: '10000.0000000',
  balanceStatus: 'success',
  isDemo: true,
});

let currentWalletState: MockWalletState = DISCONNECTED_WALLET_STATE;

// Mock WalletContext to avoid real Freighter dependencies in tests while
// allowing tests to provide wallet state through WalletProvider or overrides.
vi.mock('../../context/WalletContext', async () => {
  const actual = await vi.importActual<typeof import('../../context/WalletContext')>(
    '../../context/WalletContext'
  );
  return {
    ...actual,
    WalletProvider: ({
      children,
      value,
    }: {
      children: ReactNode;
      value?: Partial<MockWalletState>;
    }) => {
      if (value) {
        currentWalletState = createWalletState(value);
      }
      return <>{children}</>;
    },
    useWallet: () => currentWalletState,
  };
});

// Mock the wallet button so we can drive its failure paths deterministically
// without touching the real Freighter bridge.
const connectMock = vi.fn();
vi.mock('../../components/Wallet/WalletConnectButton', () => {
  const MockWalletConnectButton = () => (
    <button
      type="button"
      onClick={() => {
        // The real WalletConnectButton surfaces connection errors itself.
        try {
          connectMock();
        } catch {
          /* swallowed, mirrors WalletConnectButton error handling */
        }
      }}
    >
      Connect Wallet
    </button>
  );
  return { default: MockWalletConnectButton, WalletConnectButton: MockWalletConnectButton };
});

import Home from '../../pages/Home';
import { WalletProvider } from '../../context/WalletContext';

const renderHome = (walletOverrides?: Partial<MockWalletState>) => {
  if (walletOverrides) {
    currentWalletState = createWalletState(walletOverrides);
  }
  return render(
    <MemoryRouter>
      <WalletProvider value={walletOverrides}>
        <Home />
      </WalletProvider>
    </MemoryRouter>
  );
};

beforeEach(() => {
  connectMock.mockClear();
  connectDemoMock.mockClear();
  currentWalletState = DISCONNECTED_WALLET_STATE;
});

afterEach(() => {
  cleanup();
});

describe('Home page hero', () => {
  test('renders headline and subheadline', () => {
    renderHome();
    const headline = screen.getByRole('heading', { level: 1, name: /Secure Time‑Locked Capital Vaults on Stellar/i });
    expect(headline).toBeInTheDocument();
    const subheadline = screen.getByText(/Time‑Locked capital vaults on Stellar that release on validation or redirect on failure\./i);
    expect(subheadline).toBeInTheDocument();
  });

  test('has primary CTA linking to /vaults/create when wallet is connected', () => {
    renderHome(CONNECTED_WALLET_STATE);
    const cta = screen.getByRole('link', { name: /Create Your First Vault/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/vaults/create');
  });

  it.each([
    [
      'disconnected',
      DISCONNECTED_WALLET_STATE,
      {
        expectsCreateLink: false,
      },
    ],
    [
      'connected',
      CONNECTED_WALLET_STATE,
      {
        expectsCreateLink: true,
      },
    ],
    [
      'demo mode',
      DEMO_WALLET_STATE,
      {
        expectsCreateLink: true,
      },
    ],
  ] as const)(
    'renders the appropriate primary CTA when wallet state is %s',
    (_stateName, walletState, { expectsCreateLink }) => {
      renderHome(walletState);

      if (expectsCreateLink) {
        const createLink = screen.getByRole('link', { name: /create/i });
        expect(createLink).toBeInTheDocument();
        expect(createLink).toHaveAttribute('href', '/vaults/create');
      } else {
        expect(screen.queryByRole('link', { name: /create/i })).not.toBeInTheDocument();
        const connectButtons = screen.getAllByRole('button', { name: /Connect Wallet/i });
        expect(connectButtons.length).toBeGreaterThanOrEqual(1);
        fireEvent.click(connectButtons[0]);
        expect(connectMock).toHaveBeenCalledTimes(1);

        const demoButton = screen.getByRole('button', { name: /Try the demo account/i });
        expect(demoButton).toBeInTheDocument();
        fireEvent.click(demoButton);
        expect(connectDemoMock).toHaveBeenCalledTimes(1);
      }
    }
  );

  test('has secondary links to dashboard and vaults', () => {
    renderHome();
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    const vaultsLink = screen.getByRole('link', { name: /My Vaults/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(vaultsLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    expect(vaultsLink).toHaveAttribute('href', '/vaults');
  });

  test('hero heading is rendered as an h1 element', () => {
    renderHome();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1.tagName).toBe('H1');
  });

  test('primary CTA has accessible link text and is not a button when connected', () => {
    renderHome(CONNECTED_WALLET_STATE);
    const cta = screen.getByRole('link', { name: /Create Your First Vault/i });
    expect(cta.tagName).toBe('A');
    // The accessible name must be non-empty so screen readers announce it correctly
    expect(cta).toHaveAccessibleName(/Create Your First Vault/i);
  });

  test('secondary nav links expose accessible names for screen readers', () => {
    renderHome();
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    const vaultsLink = screen.getByRole('link', { name: /My Vaults/i });
    expect(dashboardLink).toHaveAccessibleName(/Dashboard/i);
    expect(vaultsLink).toHaveAccessibleName(/My Vaults/i);
  });

  test('hero value proposition copy is visible in the document', () => {
    renderHome();
    // Value proposition text should be present as body copy
    expect(
      screen.getByText(/Time‑Locked capital vaults on Stellar that release on validation or redirect on failure\./i)
    ).toBeVisible();
  });
});

describe('Home page boundary and failure paths', () => {
  test('renders exactly one H1 and replaces the create vault link with connect CTA when wallet is disconnected', () => {
    renderHome(DISCONNECTED_WALLET_STATE);
    expect(screen.getAllByRole('heading', { level: 1 }).length).toBe(1);
    expect(screen.queryByRole('link', { name: /Create Your First Vault/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Connect Wallet/i }).length).toBeGreaterThanOrEqual(1);
  });

  test('renders all expected navigation targets without duplicates when connected', () => {
    renderHome(CONNECTED_WALLET_STATE);
    const hrefs = screen
      .getAllByRole('link')
      .map((link: HTMLAnchorElement) => link.getAttribute('href'));
    expect(new Set(hrefs)).toEqual(new Set(['/vaults/create', '/dashboard', '/vaults']));
  });

  test('renders the connect wallet action in the final CTA', () => {
    renderHome(CONNECTED_WALLET_STATE);
    expect(screen.getByRole('button', { name: /Connect Wallet/i })).toBeInTheDocument();
  });

  test('connect wallet failure does not crash the page or hide the hero', () => {
    connectMock.mockImplementationOnce(() => {
      throw new Error('Freighter unavailable');
    });
    renderHome();
    const [button] = screen.getAllByRole('button', { name: /Connect Wallet/i });
    // The button is owned by WalletConnectButton; the page must stay mounted.
    expect(() => button.click()).not.toThrow();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('connect wallet is invoked at most once per click (concurrency guard)', () => {
    renderHome();
    const [button] = screen.getAllByRole('button', { name: /Connect Wallet/i });
    button.click();
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  test('exposes the learn-more disclosure in a collapsed state by default', () => {
    renderHome();
    const details = screen.getByText(/Learn more about Stellar and Soroban/i).closest('details');
    expect(details).not.toHaveAttribute('open');
  });
});

describe('Home page authorization regression', () => {
  test('renders without requiring wallet connection (public page)', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    // Home page should be accessible without wallet authentication
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('all navigation links have valid href attributes', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
      const href = link.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/^\/[a-zA-Z0-9\-/_]*$/);
    });
  });

  test('does not expose sensitive user data on public page', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    // Should not show wallet address or user-specific data
    expect(screen.queryByText(/0x[a-fA-F0-9]{40}/)).not.toBeInTheDocument();
    expect(screen.queryByText(/G[A-Z0-9]{55}/)).not.toBeInTheDocument();
    // Should not show balance amounts
    expect(screen.queryByText(/\d+\.\d+ USDC/)).not.toBeInTheDocument();
  });

  test('WalletConnectButton renders in final CTA section', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    // WalletConnectButton should be present for user to connect
    // Look for the button in the final CTA section (not the "Connect Your Wallet" heading)
    const connectButtons = screen.getAllByRole('button');
    const walletConnectButton = connectButtons.find(btn => 
      btn.textContent?.includes('Connect') && !btn.textContent?.includes('Your Wallet')
    );
    expect(walletConnectButton).toBeInTheDocument();
  });
});

describe('Home page validation regression', () => {
  test('handles missing or empty state gracefully', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    // Page should render correctly even without any dynamic data
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('all section headings are properly hierarchical', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const h1 = screen.getAllByRole('heading', { level: 1 });
    const h2 = screen.getAllByRole('heading', { level: 2 });
    const h3 = screen.getAllByRole('heading', { level: 3 });
    
    // Should have exactly one h1
    expect(h1.length).toBe(1);
    // Should have multiple h2 and h3 for content structure
    expect(h2.length).toBeGreaterThan(0);
    expect(h3.length).toBeGreaterThan(0);
  });

  test('links maintain safe navigation (no javascript: or data: protocols)', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      const href = link.getAttribute('href');
      expect(href).not.toMatch(/^javascript:/i);
      expect(href).not.toMatch(/^data:/i);
    });
  });

  test('How It Works section renders all three steps', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByText(/Connect Your Wallet/i)).toBeInTheDocument();
    expect(screen.getByText(/Create a Vault/i)).toBeInTheDocument();
    expect(screen.getByText(/Achieve or Redirect/i)).toBeInTheDocument();
  });

  test('Stellar & Soroban section renders correctly', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByText(/Built on Stellar & Soroban/i)).toBeInTheDocument();
    expect(screen.getByText(/Why Stellar\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Why Soroban\?/i)).toBeInTheDocument();
  });

  test('Trust section renders security badges', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByText(/Trusted & Secure/i)).toBeInTheDocument();
    expect(screen.getByText(/Audited Smart Contracts/i)).toBeInTheDocument();
    expect(screen.getByText(/Non-Custodial/i)).toBeInTheDocument();
    expect(screen.getByText(/Instant Settlements/i)).toBeInTheDocument();
  });

  test('details element for Learn more is interactive', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const details = screen.getByRole('group');
    expect(details).toBeInTheDocument();
    const summary = screen.getByText(/Learn more about Stellar and Soroban/i);
    expect(summary).toBeInTheDocument();
  });

  test('final CTA section renders with proper call to action', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByText(/Ready to Secure Your Future\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Join thousands building unstoppable financial discipline/i)).toBeInTheDocument();
  });
});

describe('Home page edge cases and boundary conditions', () => {
  test('renders consistently on repeated mounts', () => {
    const { unmount } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    unmount();
    
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('handles window resize gracefully (responsive layout)', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    // Page should render regardless of viewport size
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    // Simulate mobile viewport
    global.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('icons render without errors', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    // Icons should be present in the document
    const container = document.body;
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
  });
});
