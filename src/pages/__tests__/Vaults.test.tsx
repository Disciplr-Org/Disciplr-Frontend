import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Vaults from '../Vaults';

function renderVaults() {
  return render(
    <MemoryRouter>
      <Vaults />
    </MemoryRouter>,
  );
}

describe('Vaults page', () => {
  it('renders the vault listing and its statuses', () => {
    renderVaults();

    expect(screen.getByRole('heading', { name: 'Your Vaults' })).toBeInTheDocument();
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.getByText('Beta Reserve')).toBeInTheDocument();
    expect(screen.getByText('Gamma Fund')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('links to vault creation and each vault detail page', () => {
    renderVaults();

    expect(screen.getByRole('link', { name: /Create Vault/i })).toHaveAttribute(
      'href',
      '/vaults/create',
    );
    expect(screen.getByRole('link', { name: /Alpha Vault/ })).toHaveAttribute(
      'href',
      '/vaults/1',
    );
    expect(screen.getByRole('link', { name: /Beta Reserve/ })).toHaveAttribute(
      'href',
      '/vaults/2',
    );
    expect(screen.getByRole('link', { name: /Gamma Fund/ })).toHaveAttribute(
      'href',
      '/vaults/3',
    );
  });
});
