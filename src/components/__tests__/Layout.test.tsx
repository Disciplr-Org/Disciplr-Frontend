import { render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../Layout';

vi.mock('../Wallet/WalletConnectButton', () => ({
  WalletConnectButton: () => <button type="button">Connect wallet</button>,
}));

function renderLayout(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Layout>
        <div>Content</div>
      </Layout>
    </MemoryRouter>,
  );
}

const activeRouteCases = [
  { path: '/', name: 'Home' },
  { path: '/transactions', name: 'Transactions' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/vaults/create', name: 'Create Vault' },
];

describe('Layout component navigation', () => {
  test('exposes a named primary navigation landmark and named header controls', () => {
    renderLayout('/');

    const nav = screen.getByRole('navigation', { name: /primary navigation/i });

    expect(within(nav).getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /analytics/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /create vault/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /transactions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toBeInTheDocument();
  });

  test.each(activeRouteCases)('marks only the active header link for $path with aria-current', ({ path, name }) => {
    renderLayout(path);

    const activeLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');

    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0]).toHaveAccessibleName(name);
  });

  test('transactions link receives active class and aria-current when on /transactions', () => {
    renderLayout('/transactions');

    const link = screen.getByRole('link', { name: /transactions/i });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveClass('active');
  });

  test('transactions link is not active on other routes', () => {
    renderLayout('/');

    const link = screen.getByRole('link', { name: /transactions/i });
    expect(link).not.toHaveAttribute('aria-current');
    expect(link).not.toHaveClass('active');
  });
});
