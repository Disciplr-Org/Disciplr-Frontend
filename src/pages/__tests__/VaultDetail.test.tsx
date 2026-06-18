import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VaultDetail from '../VaultDetail';

const mockUseWallet = vi.fn();

vi.mock('../../context/WalletContext', () => ({
  useWallet: () => mockUseWallet(),
}));

function renderVault(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/vaults/${id}`]}>
      <Routes>
        <Route path="/vaults/:id" element={<VaultDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('VaultDetail settlement status', () => {
  beforeEach(() => {
    mockUseWallet.mockReturnValue({ network: 'PUBLIC' });
  });

  it('shows released funds for completed vaults', () => {
    renderVault('2');

    expect(screen.getByRole('heading', { name: 'Funds released' })).toBeInTheDocument();
    expect(screen.getByLabelText('Destination address GSUCC3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View transaction c5f1d3e0a4b96278ch5f1e3d4a0b6f9c/i })).toHaveAttribute(
      'href',
      'https://stellar.expert/explorer/public/tx/c5f1d3e0a4b96278ch5f1e3d4a0b6f9c',
    );
  });

  it('shows redirected funds for failed vaults', () => {
    renderVault('3');

    expect(screen.getByRole('heading', { name: 'Funds redirected' })).toBeInTheDocument();
    expect(screen.getByLabelText('Destination address GFAIL3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK')).toBeInTheDocument();
  });

  it('shows pending settlement for active vaults', () => {
    renderVault('1');

    expect(screen.getByRole('heading', { name: 'Settlement pending' })).toBeInTheDocument();
    expect(screen.getByText('Awaiting transaction hash')).toBeInTheDocument();
  });
});
