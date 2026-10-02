/**
 * Authorization and validation regression coverage for Layout — issue #1316.
 *
 * Layout has no authorization logic of its own: there are no roles, and the
 * navigation is static. Wallet state is read only by the children it mounts
 * (WalletConnectButton, TrustlineBanner, MobileDrawer) and route protection is
 * delegated to RequireWallet, which App.tsx renders as Layout's children.
 * These tests therefore pin the delegation contract:
 *
 *   - the nav is identical for every wallet state (a link is never a grant);
 *   - protected children never mount before a wallet address is known, and are
 *     removed as soon as it is lost;
 *   - wallet data owned by the delegated children never goes stale or leaks
 *     into the DOM or the logs;
 *   - Layout's own input validation (pathname, children) is deterministic.
 *
 * The real WalletConnectButton, TrustlineBanner, MobileDrawer and
 * RequireWallet are rendered; only the wallet source is mocked.
 */
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Layout from '../Layout';
import RequireWallet from '../RequireWallet';
import { useWallet } from '../../context/WalletContext';

// The only auth source in the app. No Freighter, no Horizon, no network.
vi.mock('../../context/WalletContext', () => ({ useWallet: vi.fn() }));

// ThemeToggle is unrelated to authorization; stubbed so this suite does not
// depend on that module.
vi.mock('../ThemeToggle', () => ({
  default: () => <button type="button">Toggle theme</button>,
}));

type WalletValue = ReturnType<typeof useWallet>;
const mockUseWallet = vi.mocked(useWallet);

const ADDRESS = 'GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ';
const TRUNCATED_ADDRESS = 'GA7Q...VSGZ';

function wallet(overrides: Partial<WalletValue> = {}): WalletValue {
  return {
    status: 'disconnected',
    address: null,
    network: null,
    balance: null,
    balanceStatus: 'idle',
    balanceError: null,
    error: null,
    isConnecting: false,
    connect: vi.fn().mockResolvedValue(false),
    disconnect: vi.fn(),
    checkConnection: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const disconnected = () => wallet();
const restoring = () => wallet({ status: 'restoring', isConnecting: true });
const connecting = () => wallet({ status: 'connecting', isConnecting: true });
const failed = (error = 'Wallet access denied.') => wallet({ status: 'error', error });
const connected = (overrides: Partial<WalletValue> = {}) =>
  wallet({
    status: 'connected',
    address: ADDRESS,
    network: 'TESTNET',
    balance: '10.0000000',
    balanceStatus: 'success',
    ...overrides,
  });
const noTrustline = () => connected({ balance: null, balanceStatus: 'no_trustline' });

const DESKTOP_NAV_LINKS = [
  '/',
  '/dashboard',
  '/vaults',
  '/verifier',
  '/analytics',
  '/help',
  '/vaults/create',
  '/notifications',
];
const BRAND_LINKS = ['/', '/transactions'];
const DRAWER_LINKS = [
  '/',
  '/transactions',
  '/dashboard',
  '/vaults',
  '/verifier',
  '/analytics',
  '/vaults/create',
];

const PROTECTED_TEXT = 'Protected vault form';
const protectedRendered = vi.fn();

function ProtectedPage() {
  protectedRendered();
  return <div>{PROTECTED_TEXT}</div>;
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

// Mirrors App.tsx: one wallet-gated route, everything else public. Built per
// render so a wallet change re-renders the routes, as a context update would.
const appRoutes = () => (
  <>
    <LocationProbe />
    <Routes>
      <Route
        path="/vaults/create"
        element={
          <RequireWallet>
            <ProtectedPage />
          </RequireWallet>
        }
      />
      <Route path="*" element={<div>Public page</div>} />
    </Routes>
  </>
);

function tree(path: string, children: ReactNode = appRoutes()) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <Layout>{children}</Layout>
    </MemoryRouter>
  );
}

function renderLayout(path: string, state: WalletValue, children?: ReactNode) {
  mockUseWallet.mockReturnValue(state);
  const utils = render(tree(path, children));
  return {
    ...utils,
    // Same tree, new wallet state — what a WalletProvider update looks like.
    setWallet(next: WalletValue) {
      mockUseWallet.mockReturnValue(next);
      utils.rerender(tree(path, children));
    },
  };
}

function hrefs(root: Element) {
  return Array.from(root.querySelectorAll('a')).map((link) => link.getAttribute('href'));
}

const desktopNav = () => screen.getByRole('navigation', { name: /main navigation/i });
const hamburger = () => screen.getByRole('button', { name: /open navigation menu/i });
// RequireWallet's fallback also carries role="main", so Layout's own <main>
// is selected by tag rather than by role.
const layoutMain = (container: HTMLElement) => container.querySelector('main') as HTMLElement;

function expectStaticNav(container: HTMLElement) {
  expect(hrefs(desktopNav())).toEqual(DESKTOP_NAV_LINKS);
  expect(hrefs(container.querySelector('.header-brand') as HTMLElement)).toEqual(BRAND_LINKS);
}

function expectRejected() {
  expect(screen.queryByText(PROTECTED_TEXT)).not.toBeInTheDocument();
  expect(protectedRendered).not.toHaveBeenCalled();
  expect(screen.getByRole('heading', { name: /connect your wallet/i })).toBeInTheDocument();
}

beforeEach(() => {
  mockUseWallet.mockReset();
  protectedRendered.mockReset();
  document.body.style.overflow = '';
});

// ---------------------------------------------------------------------------
// Success — every wallet state sees exactly the expected nav and wallet control
// ---------------------------------------------------------------------------
describe('Layout navigation is independent of wallet state', () => {
  test.each([
    ['disconnected', disconnected],
    ['restoring', restoring],
    ['connecting', connecting],
    ['failed', failed],
    ['connected on testnet', connected],
    ['connected on mainnet', () => connected({ network: 'PUBLIC' })],
    ['connected without a trustline', noTrustline],
  ])('%s: renders exactly the static nav and brand links', (_name, state) => {
    const { container } = renderLayout('/dashboard', state());
    expectStaticNav(container);
    expect(screen.getByText('Public page')).toBeInTheDocument();
  });

  test('disconnected: offers Connect Wallet and shows no wallet data', () => {
    const { container } = renderLayout('/dashboard', disconnected());
    expect(within(desktopNav()).getByRole('button', { name: /^connect wallet$/i })).toBeEnabled();
    expect(container.innerHTML).not.toContain(TRUNCATED_ADDRESS);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test.each([
    ['restoring', restoring],
    ['connecting', connecting],
  ])('%s: wallet control is a disabled progress state', (_name, state) => {
    renderLayout('/dashboard', state());
    expect(within(desktopNav()).getByRole('button', { name: /connecting/i })).toBeDisabled();
    expect(within(desktopNav()).queryByRole('button', { name: /^connect wallet$/i })).not.toBeInTheDocument();
  });

  test.each([
    ['TESTNET', 'Testnet'],
    ['PUBLIC', 'Mainnet'],
  ] as const)('connected on %s: shows the truncated address and network only', (network, label) => {
    const { container } = renderLayout('/dashboard', connected({ network }));
    const control = within(desktopNav()).getByRole('button', { name: new RegExp(label, 'i') });
    expect(control).toHaveTextContent(TRUNCATED_ADDRESS);
    // The full address is never written into markup, text or attributes.
    expect(container.innerHTML).not.toContain(ADDRESS);
    expect(within(desktopNav()).queryByRole('button', { name: /^connect wallet$/i })).not.toBeInTheDocument();
  });

  test('connected wallet reaches the protected route through Layout', () => {
    renderLayout('/vaults/create', connected());
    expect(screen.getByText(PROTECTED_TEXT)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /connect your wallet/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Rejection — no address, no protected content; the nav link is not a grant
// ---------------------------------------------------------------------------
describe('Layout never mounts protected children for an unauthorized wallet', () => {
  test.each([
    ['disconnected', disconnected],
    ['failed connection', failed],
    ['expired session', () => failed('Session expired')],
  ])('%s: shows the connect fallback inside main and stays on the route', (_name, state) => {
    const { container } = renderLayout('/vaults/create?draft=1', state());
    expectRejected();
    expect(layoutMain(container)).toContainElement(
      screen.getByRole('heading', { name: /connect your wallet/i }),
    );
    // No redirect: the destination is preserved for after the connect.
    expect(screen.getByTestId('location')).toHaveTextContent('/vaults/create?draft=1');
    // The link to the protected route stays visible — the route guard, not
    // link visibility, is the access control.
    expect(within(desktopNav()).getByRole('link', { name: /^create vault$/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test.each([
    ['empty string', ''],
    ['whitespace only', '   '],
    ['null', null],
    ['undefined', undefined],
  ])('malformed address (%s) with a "connected" status is still rejected', (_name, address) => {
    const state = wallet({ status: 'connected', address: address as WalletValue['address'] });
    const { container } = renderLayout('/vaults/create', state);
    expectRejected();
    expectStaticNav(container);
  });

  // There is no role concept in the app. A role-like field on the wallet
  // source must not change what Layout renders or unlock anything.
  test.each([
    ['unknown role', { role: 'superuser' }],
    ['admin flag', { isAdmin: true, role: 'admin' }],
    ['empty role list', { roles: [] }],
    ['duplicate roles', { roles: ['admin', 'admin', 'verifier'] }],
  ])('%s on the wallet source grants nothing', (_name, extra) => {
    const state = { ...disconnected(), ...extra } as WalletValue;
    const { container } = renderLayout('/vaults/create', state);
    expectRejected();
    expectStaticNav(container);
  });
});

// ---------------------------------------------------------------------------
// Transitions and timing
// ---------------------------------------------------------------------------
describe('Layout wallet state transitions', () => {
  test('loading → connected → logged out never flashes or keeps protected content', () => {
    const { container, setWallet } = renderLayout('/vaults/create?draft=1', restoring());

    // Resolving: nothing protected has rendered, not even once.
    expectRejected();
    expect(screen.getByText('Connecting…')).toBeInTheDocument();

    setWallet(connected());
    expect(screen.getByText(PROTECTED_TEXT)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /connect your wallet/i })).not.toBeInTheDocument();
    expect(within(desktopNav()).getByText(TRUNCATED_ADDRESS)).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/vaults/create?draft=1');

    setWallet(disconnected());
    expect(screen.queryByText(PROTECTED_TEXT)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /connect your wallet/i })).toBeInTheDocument();
    // No stale wallet data anywhere in the chrome.
    expect(container.innerHTML).not.toContain(TRUNCATED_ADDRESS);
    expect(within(desktopNav()).getByRole('button', { name: /^connect wallet$/i })).toBeInTheDocument();
    expectStaticNav(container);
  });

  test('a session that expires while on a protected route removes the content', () => {
    const { container, setWallet } = renderLayout('/vaults/create', connected());
    expect(screen.getByText(PROTECTED_TEXT)).toBeInTheDocument();

    setWallet(failed('Session expired'));
    expect(screen.queryByText(PROTECTED_TEXT)).not.toBeInTheDocument();
    expect(within(desktopNav()).getByRole('button', { name: /connection failed/i })).toBeInTheDocument();
    expect(container.innerHTML).not.toContain(TRUNCATED_ADDRESS);
  });

  test('switching account replaces the displayed address with no stale copy', () => {
    const other = 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';
    const { container, setWallet } = renderLayout('/dashboard', connected());
    expect(within(desktopNav()).getByText(TRUNCATED_ADDRESS)).toBeInTheDocument();

    setWallet(connected({ address: other }));
    expect(within(desktopNav()).getByText('GBZX...MADI')).toBeInTheDocument();
    expect(container.innerHTML).not.toContain(TRUNCATED_ADDRESS);
  });

  test('wallet changes while the drawer is open keep the drawer and its state consistent', () => {
    const { container, setWallet } = renderLayout('/dashboard', disconnected());
    fireEvent.click(hamburger());
    const drawer = () => screen.getByRole('dialog', { name: /navigation/i });
    expect(within(drawer()).getByRole('button', { name: /^connect wallet$/i })).toBeInTheDocument();

    setWallet(connected());
    expect(hamburger()).toHaveAttribute('aria-expanded', 'true');
    expect(within(drawer()).getByText(TRUNCATED_ADDRESS)).toBeInTheDocument();
    expect(hrefs(drawer())).toEqual(DRAWER_LINKS);

    setWallet(disconnected());
    expect(hamburger()).toHaveAttribute('aria-expanded', 'true');
    expect(within(drawer()).getByRole('button', { name: /^connect wallet$/i })).toBeInTheDocument();
    expect(container.innerHTML).not.toContain(TRUNCATED_ADDRESS);
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('the same final wallet state renders the same DOM whatever the history', () => {
    const replayed = renderLayout('/dashboard', disconnected());
    for (const next of [connecting(), connected(), disconnected(), failed(), connecting(), connected()]) {
      replayed.setWallet(next);
    }
    const replayedHtml = replayed.container.innerHTML;
    replayed.unmount();

    const fresh = renderLayout('/dashboard', connected());
    expect(fresh.container.innerHTML).toBe(replayedHtml);
  });
});

// ---------------------------------------------------------------------------
// Failure and recovery
// ---------------------------------------------------------------------------
describe('Layout failure and recovery', () => {
  test('a failed connect followed by a successful retry unlocks the route exactly then', () => {
    const { container, setWallet } = renderLayout('/vaults/create', failed());
    expectRejected();
    expect(within(desktopNav()).getByRole('button', { name: /connection failed/i })).toBeInTheDocument();

    setWallet(connecting());
    expectRejected();
    expectStaticNav(container);

    setWallet(connected());
    expect(screen.getByText(PROTECTED_TEXT)).toBeInTheDocument();
    expect(within(desktopNav()).queryByRole('button', { name: /connection failed/i })).not.toBeInTheDocument();
    expectStaticNav(container);
  });

  test('a balance fetch failure does not affect navigation or authorization', () => {
    const { container, setWallet } = renderLayout(
      '/vaults/create',
      connected({ balance: null, balanceStatus: 'error', balanceError: 'Horizon unavailable' }),
    );
    expect(screen.getByText(PROTECTED_TEXT)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain('Horizon unavailable');

    setWallet(connected());
    expect(screen.getByText(PROTECTED_TEXT)).toBeInTheDocument();
    expectStaticNav(container);
  });

  test('a child that throws is contained in main; chrome stays usable and nothing sensitive is rendered', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    function CrashingPage(): never {
      throw new Error(`render failed for ${ADDRESS}`);
    }

    try {
      const { container } = renderLayout('/dashboard', connected(), <CrashingPage />);

      expect(layoutMain(container)).toContainElement(screen.getByText(/something went wrong/i));
      expect(screen.getByText('Reference ID')).toBeInTheDocument();
      // The error message (which may carry user data) is not shown to the user.
      expect(container.innerHTML).not.toContain(ADDRESS);
      expect(container.innerHTML).not.toContain('render failed');

      expectStaticNav(container);
      const analytics = within(desktopNav()).getByRole('link', { name: /^analytics$/i });
      fireEvent.click(analytics);
      expect(analytics).toHaveAttribute('aria-current', 'page');
    } finally {
      consoleError.mockRestore();
    }
  });

  test('wallet failures are logged with diagnostics but never with the address', () => {
    const methods = ['log', 'info', 'debug', 'warn', 'error'] as const;
    const spies = methods.map((method) => vi.spyOn(console, method).mockImplementation(() => {}));

    try {
      const { setWallet } = renderLayout('/vaults/create', disconnected());
      setWallet(connecting());
      setWallet(connected());
      setWallet(connected({ status: 'error', error: 'Network changed' }));
      setWallet(disconnected());

      const logged = spies
        .flatMap((spy) => spy.mock.calls.flat())
        .map((arg) => {
          try {
            return typeof arg === 'string' ? arg : JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        })
        .join('\n');

      expect(logged).toContain('Network changed');
      expect(logged).toContain('"hasAddress":true');
      expect(logged).not.toContain(ADDRESS);
      expect(logged).not.toContain(TRUNCATED_ADDRESS);
    } finally {
      spies.forEach((spy) => spy.mockRestore());
    }
  });
});

// ---------------------------------------------------------------------------
// Validation and boundaries on Layout's own inputs
// ---------------------------------------------------------------------------
describe('Layout input boundaries', () => {
  test.each([
    ['null', null],
    ['undefined', undefined],
    ['false', false],
    ['empty string', ''],
    ['empty array', []],
    ['empty fragment', <></>],
  ])('children = %s renders the chrome around an empty main', (_name, children) => {
    mockUseWallet.mockReturnValue(disconnected());
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Layout>{children}</Layout>
      </MemoryRouter>,
    );
    expect(layoutMain(container)).toBeEmptyDOMElement();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expectStaticNav(container);
  });

  test('nav entries are not duplicated within the desktop nav or the drawer', () => {
    renderLayout('/', connected());
    expect(new Set(hrefs(desktopNav())).size).toBe(DESKTOP_NAV_LINKS.length);

    fireEvent.click(hamburger());
    const drawerLinks = hrefs(screen.getByRole('dialog', { name: /navigation/i }));
    expect(drawerLinks).toEqual(DRAWER_LINKS);
    expect(new Set(drawerLinks).size).toBe(DRAWER_LINKS.length);
  });

  test('re-rendering with identical state and props is a no-op on the DOM', () => {
    const { container, setWallet } = renderLayout('/vaults/create', connected());
    const before = container.innerHTML;
    setWallet(connected());
    setWallet(connected());
    expect(container.innerHTML).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// Regression — bugs fixed with this coverage
// ---------------------------------------------------------------------------
describe('Layout regressions (issue #1316)', () => {
  const vaultsLink = () => within(desktopNav()).getByRole('link', { name: /^vaults$/i });
  const helpLink = () => within(desktopNav()).getByRole('link', { name: /^help$/i });

  // Before the fix a raw prefix match marked Vaults/Help as the current page on
  // any route that merely started with the same characters.
  test.each(['/vaults-archive', '/vaultsX', '/vaults.json'])(
    'Vaults is not the current page on the unrelated route %s',
    (path) => {
      renderLayout(path, disconnected());
      expect(vaultsLink()).not.toHaveAttribute('aria-current');
    },
  );

  test.each(['/helpdesk', '/help-center'])(
    'Help is not the current page on the unrelated route %s',
    (path) => {
      renderLayout(path, disconnected());
      expect(helpLink()).not.toHaveAttribute('aria-current');
    },
  );

  test.each(['/vaults', '/vaults/', '/vaults/abc', '/vaults/abc/transactions'])(
    'Vaults is still the current page on %s',
    (path) => {
      renderLayout(path, disconnected());
      expect(vaultsLink()).toHaveAttribute('aria-current', 'page');
    },
  );

  test.each(['/help', '/help/', '/help/search'])('Help is still the current page on %s', (path) => {
    renderLayout(path, disconnected());
    expect(helpLink()).toHaveAttribute('aria-current', 'page');
  });

  test('Create Vault, not Vaults, is the current page on /vaults/create', () => {
    renderLayout('/vaults/create', disconnected());
    expect(vaultsLink()).not.toHaveAttribute('aria-current');
    expect(within(desktopNav()).getByRole('link', { name: /^create vault$/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  // Before the fix the trustline banner was the one piece of background
  // content left interactive and exposed while the modal drawer was open.
  test('the trustline banner is inert and hidden while the drawer is open', () => {
    const { setWallet } = renderLayout('/dashboard', noTrustline());
    const dismiss = () =>
      screen.getByRole('button', { name: /dismiss trustline banner/i, hidden: true });

    expect(screen.getByRole('alert')).toHaveTextContent(/no USDC trustline/i);
    expect(dismiss().closest('[inert]')).toBeNull();
    expect(dismiss().closest('[aria-hidden="true"]')).toBeNull();

    fireEvent.click(hamburger());
    expect(dismiss().closest('[inert]')).not.toBeNull();
    expect(dismiss().closest('[aria-hidden="true"]')).not.toBeNull();

    fireEvent.click(hamburger());
    expect(dismiss().closest('[inert]')).toBeNull();
    expect(dismiss().closest('[aria-hidden="true"]')).toBeNull();

    // Logging out removes the wallet-scoped banner with no stale render.
    setWallet(disconnected());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
