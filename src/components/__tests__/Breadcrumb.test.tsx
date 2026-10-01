import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Breadcrumb from '../Breadcrumb';
import { truncateMiddle } from '../../utils/truncate';

function renderBreadcrumb(segments: Array<{ label: string; to?: string }>) {
  return render(
    <MemoryRouter>
      <Breadcrumb segments={segments} />
    </MemoryRouter>,
  );
}

describe('Breadcrumb', () => {
  it('renders linked ancestors and marks the final segment as current', () => {
    renderBreadcrumb([
      { label: 'Home', to: '/' },
      { label: 'Vaults', to: '/vaults' },
      { label: 'Alpha Vault' },
    ]);

    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: 'Vaults' })).toHaveAttribute(
      'href',
      '/vaults',
    );

    const current = screen.getByText('Alpha Vault');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(
      screen.queryByRole('link', { name: 'Alpha Vault' }),
    ).not.toBeInTheDocument();
  });

  it('supports a single current segment without rendering links', () => {
    renderBreadcrumb([{ label: 'Transactions' }]);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Transactions')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('renders a missing ancestor destination as text', () => {
    renderBreadcrumb([
      { label: 'Home' },
      { label: 'Current Vault' },
    ]);

    expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument();
    expect(screen.getByText('Home')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Current Vault')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('truncates very long current labels with the shared helper', () => {
    const longLabel =
      'Extremely Long Vault Name That Needs Middle Truncation For Breadcrumbs';
    const expected = truncateMiddle(longLabel, 20, 8);

    renderBreadcrumb([
      { label: 'Home', to: '/' },
      { label: longLabel },
    ]);

    const current = screen.getByText(expected);
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveAttribute('title', longLabel);
  });

  it('sets aria-current only on the final segment', () => {
    renderBreadcrumb([
      { label: 'Home', to: '/' },
      { label: 'Vaults', to: '/vaults' },
      { label: 'Alpha Vault' },
    ]);

    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });
});
