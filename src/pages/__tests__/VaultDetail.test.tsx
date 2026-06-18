import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VaultDetail from '../VaultDetail';

function renderVaultDetail(path = '/vaults/1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/vaults/:id" element={<VaultDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('VaultDetail', () => {
  it('renders milestones through the reusable tracker', () => {
    renderVaultDetail();

    expect(screen.getByText('Milestones')).toBeInTheDocument();
    expect(screen.getByText('1. Phase 1 Complete')).toBeInTheDocument();
    expect(screen.getByText('2. Beta Launch')).toBeInTheDocument();
    expect(screen.getByText('2. Beta Launch').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    );
    expect(screen.getByRole('link', { name: 'View evidence ↗' })).toHaveAttribute(
      'href',
      'https://github.com/org/repo/pull/42',
    );
  });

  it('renders the not-found state for unknown vault ids', () => {
    renderVaultDetail('/vaults/missing');

    expect(screen.getByText('Vault not found')).toBeInTheDocument();
  });
});
