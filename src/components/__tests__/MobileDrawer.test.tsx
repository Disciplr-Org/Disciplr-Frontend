import { useState } from 'react';
import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../Layout';
import MobileDrawer from '../MobileDrawer';

const focusTrapState = vi.hoisted(() => ({
  options: [] as Array<Record<string, unknown>>,
}));

vi.mock('focus-trap-react', () => ({
  default: ({ children, focusTrapOptions }: { children: ReactNode; focusTrapOptions: Record<string, unknown> }) => {
    focusTrapState.options.push(focusTrapOptions);
    return <div data-testid="focus-trap">{children}</div>;
  },
}));

vi.mock('../Wallet/WalletConnectButton', () => ({
  WalletConnectButton: () => <button type="button">Connect wallet</button>,
}));

function renderOpenDrawer(onClose = vi.fn(), initialEntry = '/') {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <MobileDrawer isOpen onClose={onClose} />
    </MemoryRouter>,
  );

  return onClose;
}

function DrawerHarness() {
  const [isOpen, setOpen] = useState(false);

  return (
    <MemoryRouter>
      <button type="button" onClick={() => setOpen(true)}>
        Open navigation menu
      </button>
      <MobileDrawer isOpen={isOpen} onClose={() => setOpen(false)} />
    </MemoryRouter>
  );
}

describe('MobileDrawer accessibility', () => {
  beforeEach(() => {
    focusTrapState.options = [];
    document.body.style.overflow = '';
  });

  test('renders as a labelled modal dialog inside a focus trap', () => {
    renderOpenDrawer();

    const dialog = screen.getByRole('dialog', { name: /navigation/i });
    expect(screen.getByTestId('focus-trap')).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'mobile-drawer-title');
    expect(dialog).toHaveAttribute('tabindex', '-1');
    expect(screen.getByText('Navigation')).toHaveAttribute('id', 'mobile-drawer-title');

    expect(focusTrapState.options[0]).toMatchObject({
      allowOutsideClick: true,
      clickOutsideDeactivates: false,
      escapeDeactivates: false,
      returnFocusOnDeactivate: false,
    });
    expect(focusTrapState.options[0].initialFocus).toEqual(expect.any(Function));
    expect(focusTrapState.options[0].fallbackFocus).toEqual(expect.any(Function));
    expect((focusTrapState.options[0].initialFocus as () => HTMLElement)()).toBe(
      screen.getByRole('button', { name: /close navigation drawer/i }),
    );
    expect((focusTrapState.options[0].fallbackFocus as () => HTMLElement)()).toBe(dialog);
  });

  test('exposes a labelled mobile navigation landmark with the active route', () => {
    renderOpenDrawer(vi.fn(), '/analytics');

    const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
    const activeLinks = within(nav)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');

    expect(within(nav).getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /transactions/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /analytics/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /create vault/i })).toBeInTheDocument();
    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0]).toHaveAccessibleName('Analytics');
  });

  test('closes on Escape and restores focus to the trigger', async () => {
    render(<DrawerHarness />);

    const trigger = screen.getByRole('button', { name: /open navigation menu/i });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: /navigation/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  test('keeps drawer clicks contained and closes from navigation links', () => {
    const onClose = renderOpenDrawer();
    const dialog = screen.getByRole('dialog', { name: /navigation/i });

    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('link', { name: /home/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('falls back safely when focus targets are unavailable', () => {
    const activeElementDescriptor = Object.getOwnPropertyDescriptor(document, 'activeElement');

    Object.defineProperty(document, 'activeElement', {
      configurable: true,
      get: () => null,
    });

    const { unmount } = render(
      <MemoryRouter>
        <MobileDrawer isOpen onClose={vi.fn()} />
      </MemoryRouter>,
    );
    const options = focusTrapState.options[0];

    unmount();

    expect((options.initialFocus as () => HTMLElement)()).toBe(document.body);
    expect((options.fallbackFocus as () => HTMLElement)()).toBe(document.body);

    if (activeElementDescriptor) {
      Object.defineProperty(document, 'activeElement', activeElementDescriptor);
    } else {
      Reflect.deleteProperty(document, 'activeElement');
    }
  });

  test('closes from the backdrop and close button', () => {
    const onClose = renderOpenDrawer();

    fireEvent.click(screen.getByRole('button', { name: /close navigation drawer/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('dialog', { name: /navigation/i }).parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('Layout drawer integration', () => {
  beforeEach(() => {
    focusTrapState.options = [];
  });

  test('marks background content inert while the drawer is open', () => {
    render(
      <MemoryRouter>
        <Layout>
          <p>Page content</p>
        </Layout>
      </MemoryRouter>,
    );

    const trigger = screen.getByRole('button', { name: /open navigation menu/i });
    const main = screen.getByRole('main');

    expect(main).not.toHaveAttribute('aria-hidden');
    expect(main).not.toHaveAttribute('inert');

    fireEvent.click(trigger);

    const hiddenMain = screen.getByRole('main', { hidden: true });
    expect(hiddenMain).toHaveAttribute('aria-hidden', 'true');
    expect(hiddenMain).toHaveAttribute('inert');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
