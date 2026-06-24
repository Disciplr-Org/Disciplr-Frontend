import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

vi.mock('../context/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('../context/WalletContext', () => ({
  WalletProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useWallet: () => ({
    address: null,
    network: null,
    balance: null,
    isConnecting: false,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    checkConnection: vi.fn(),
  }),
}));

vi.mock('../components/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock('../components/Skeleton', () => ({
  default: ({ className }: { className?: string }) => (
    <div className={className} data-testid="route-skeleton">
      Loading route
    </div>
  ),
}));

vi.mock('../pages/Home', () => ({ default: () => <main>Home route</main> }));
vi.mock('../pages/Dashboard', () => ({ default: () => <main>Dashboard route</main> }));
vi.mock('../pages/Vaults', () => ({ default: () => <main>Vaults route</main> }));
vi.mock('../pages/CreateVault', () => ({ default: () => <main>Create Vault route</main> }));
vi.mock('../pages/VaultDetail', () => ({ default: () => <main>Vault Detail route</main> }));
vi.mock('../pages/VaultTransactions', () => ({
  default: () => <main>Vault Transactions route</main>,
}));
vi.mock('../pages/VerifierDashboard', () => ({
  default: () => <main>Verifier Dashboard route</main>,
}));
vi.mock('../pages/PendingValidations', () => ({
  default: () => <main>Pending Validations route</main>,
}));
vi.mock('../pages/ValidationDetail', () => ({
  default: () => <main>Validation Detail route</main>,
}));
vi.mock('../pages/ValidationHistory', () => ({
  default: () => <main>Validation History route</main>,
}));
vi.mock('../pages/NotFound', () => ({ default: () => <main>Not Found route</main> }));
vi.mock('../pages/Analytics', () => ({ default: () => <main>Analytics route</main> }));
vi.mock('../pages/Notification', () => ({ default: () => <main>Notification route</main> }));

function renderAt(path: string) {
  window.history.pushState({}, '', path);
  return render(<App />);
}

describe('App routing graph', () => {
  afterEach(() => {
    cleanup();
    window.history.pushState({}, '', '/');
  });

  it.each([
    ['/', 'Home route'],
    ['/dashboard', 'Dashboard route'],
    ['/vaults', 'Vaults route'],
    ['/vaults/create', 'Create Vault route'],
    ['/vaults/alpha-vault', 'Vault Detail route'],
    ['/vaults/alpha-vault/transactions', 'Vault Transactions route'],
    ['/transactions', 'Vault Transactions route'],
    ['/verifier', 'Verifier Dashboard route'],
    ['/verifier/queue', 'Pending Validations route'],
    ['/verifier/queue/v-101', 'Validation Detail route'],
    ['/verifier/history', 'Validation History route'],
  ])('mounts %s at the expected top-level route', (path, label) => {
    renderAt(path);

    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it.each([
    ['/analytics', 'Analytics route'],
    ['/notifications', 'Notification route'],
  ])('shows the Suspense fallback before resolving %s', async (path, label) => {
    renderAt(path);

    expect(screen.getByTestId('route-skeleton')).toHaveTextContent('Loading route');
    expect(await screen.findByText(label)).toBeInTheDocument();
    expect(screen.queryByTestId('route-skeleton')).not.toBeInTheDocument();
  });

  it('renders the NotFound catch-all for unknown paths', () => {
    renderAt('/missing-route');

    expect(screen.getByText('Not Found route')).toBeInTheDocument();
  });
});
