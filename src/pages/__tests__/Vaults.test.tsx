import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Vaults from '../Vaults';

function renderVaults() {
  return render(
    <MemoryRouter>
      <Vaults />
    </MemoryRouter>,
  );
}

function vaultRowNames() {
  return screen.getAllByTestId('vault-row').map((row) => {
    const heading = within(row).getByText(/Alpha Vault|Beta Reserve|Gamma Fund/);
    return heading.textContent;
  });
}

describe('Vaults', () => {
  it('renders vault rows sorted by soonest deadline by default and preserves row links', () => {
    renderVaults();

    expect(vaultRowNames()).toEqual(['Gamma Fund', 'Beta Reserve', 'Alpha Vault']);
    expect(screen.getByRole('link', { name: /Alpha Vault/i })).toHaveAttribute('href', '/vaults/1');
  });

  it('filters vaults with keyboard-operable status chips', () => {
    renderVaults();

    const completed = screen.getByRole('button', { name: 'Completed' });
    fireEvent.click(completed);

    expect(completed).toHaveAttribute('aria-pressed', 'true');
    expect(vaultRowNames()).toEqual(['Beta Reserve']);
    expect(screen.queryByText('Alpha Vault')).not.toBeInTheDocument();
  });

  it('searches vault names case-insensitively', () => {
    renderVaults();

    fireEvent.change(screen.getByLabelText('Search vaults by name'), {
      target: { value: 'gamma' },
    });

    expect(vaultRowNames()).toEqual(['Gamma Fund']);
    expect(screen.queryByText('Alpha Vault')).not.toBeInTheDocument();
  });

  it('sorts vaults by highest amount', () => {
    renderVaults();

    fireEvent.change(screen.getByLabelText('Sort vaults'), {
      target: { value: 'amount-desc' },
    });

    expect(vaultRowNames()).toEqual(['Alpha Vault', 'Gamma Fund', 'Beta Reserve']);
  });

  it('shows a token-styled empty state when filters match no vaults', () => {
    renderVaults();

    fireEvent.click(screen.getByRole('button', { name: 'Pending Validation' }));

    expect(screen.getByRole('status')).toHaveTextContent('No vaults match your filters.');
    expect(screen.queryByTestId('vault-row')).not.toBeInTheDocument();
  });
});
