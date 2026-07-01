import { vi, describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock WalletContext to avoid real Freighter dependencies in tests
vi.mock('../../context/WalletContext', () => ({
  WalletProvider: ({ children }: any) => <>{children}</>,
  useWallet: () => ({
    address: null,
    network: null,
    balance: null,
    isConnecting: false,
    error: null,
    connect: async () => {},
    disconnect: () => {},
    checkConnection: async () => {},
  }),
}));

import Home from '../../pages/Home';

describe('Home page hero', () => {
  test('renders headline and subheadline', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const headline = screen.getByRole('heading', { level: 1, name: /Secure Time‑Locked Capital Vaults on Stellar/i });
    expect(headline).toBeInTheDocument();
    const subheadline = screen.getByText(/Time‑locked capital vaults on Stellar that release on validation or redirect on failure\./i);
    expect(subheadline).toBeInTheDocument();
  });

  test('has primary CTA linking to /vaults/create', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const cta = screen.getByRole('link', { name: /Create Your First Vault/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/vaults/create');
  });

  test('has secondary links to dashboard and vaults', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    const vaultsLink = screen.getByRole('link', { name: /My Vaults/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(vaultsLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    expect(vaultsLink).toHaveAttribute('href', '/vaults');
  });

  test('hero heading is rendered as an h1 element', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1.tagName).toBe('H1');
  });

  test('primary CTA has accessible link text and is not a button', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const cta = screen.getByRole('link', { name: /Create Your First Vault/i });
    expect(cta.tagName).toBe('A');
    // The accessible name must be non-empty so screen readers announce it correctly
    expect(cta).toHaveAccessibleName(/Create Your First Vault/i);
  });

  test('secondary nav links expose accessible names for screen readers', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    const vaultsLink = screen.getByRole('link', { name: /My Vaults/i });
    expect(dashboardLink).toHaveAccessibleName(/Dashboard/i);
    expect(vaultsLink).toHaveAccessibleName(/My Vaults/i);
  });

  test('hero value proposition copy is visible in the document', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    // Value proposition text should be present as body copy
    expect(
      screen.getByText(/Time‑locked capital vaults on Stellar that release on validation or redirect on failure\./i)
    ).toBeVisible();
  });
});
