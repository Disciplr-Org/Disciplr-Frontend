import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import VaultDetail from '../VaultDetail';

function renderVaultDetail(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/vaults/${id}`]}>
      <Routes>
        <Route path="/vaults/:id" element={<VaultDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

function section(name: string) {
  return screen.getByText(name).parentElement as HTMLElement;
}

describe('VaultDetail', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-01T00:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('renders active vault status, deadlines, milestones, and transactions', () => {
    renderVaultDetail('1');

    expect(screen.getByRole('heading', { name: 'Alpha Vault' })).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('12,500')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();

    expect(screen.getByText('Created Jan 15, 2024')).toBeInTheDocument();
    expect(screen.getByText('Deadline Jul 15, 2024')).toBeInTheDocument();
    expect(screen.getByText('14d 10h remaining')).toBeInTheDocument();

    const milestones = section('Milestones');
    expect(within(milestones).getByText('1. Phase 1 Complete')).toBeInTheDocument();
    expect(within(milestones).getByText('Complete initial development phase')).toBeInTheDocument();
    expect(within(milestones).getByText('2. Beta Launch')).toBeInTheDocument();
    expect(within(milestones).getByText('Launch beta version to 100 users')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View evidence/i })).toHaveAttribute(
      'href',
      'https://github.com/org/repo/pull/42'
    );

    const transactions = section('Transaction History');
    expect(within(transactions).getByText('Vault Created')).toBeInTheDocument();
    expect(within(transactions).getByText('Milestone Validated')).toBeInTheDocument();
    expect(within(transactions).getByText('a3f9d1c8...8f0a4d')).toBeInTheDocument();
    expect(within(transactions).getByText('b4e0c2d9...9a5e8b')).toBeInTheDocument();
  });

  it('renders truncated addresses including optional verifier address', () => {
    renderVaultDetail('1');

    const addresses = section('Addresses');

    expect(within(addresses).getByText('Creator')).toBeInTheDocument();
    expect(within(addresses).getByText('GBVZ3K...QK7L')).toBeInTheDocument();
    expect(within(addresses).getByText('Verifier')).toBeInTheDocument();
    expect(within(addresses).getByText('GVERIF...LKQK')).toBeInTheDocument();
    expect(within(addresses).getByText('Success destination')).toBeInTheDocument();
    expect(within(addresses).getByText('GSUCC3...LKQK')).toBeInTheDocument();
    expect(within(addresses).getByText('Failure destination')).toBeInTheDocument();
    expect(within(addresses).getByText('GFAIL3...LKQK')).toBeInTheDocument();
    expect(within(addresses).getByText('Contract')).toBeInTheDocument();
    expect(within(addresses).getByText('GCONT3...LKQK')).toBeInTheDocument();
  });

  it('renders completed vault status and release transactions without verifier address', () => {
    renderVaultDetail('2');

    expect(screen.getByRole('heading', { name: 'Beta Reserve' })).toBeInTheDocument();
    expect(screen.getAllByText('Completed')[0]).toBeInTheDocument();
    expect(within(section('Milestones')).getByText('1. Project Delivery')).toBeInTheDocument();

    const transactions = section('Transaction History');
    expect(within(transactions).getByText('Funds Released')).toBeInTheDocument();
    expect(within(transactions).getAllByText('4,200.5 USDC')).toHaveLength(2);
    expect(within(transactions).getByText('c5f1d3e0...0b6f9c')).toBeInTheDocument();
    expect(screen.queryByText('Verifier')).not.toBeInTheDocument();
  });

  it('renders failed vault status, failed milestones, and redirect transactions', () => {
    renderVaultDetail('3');

    expect(screen.getByRole('heading', { name: 'Gamma Fund' })).toBeInTheDocument();
    expect(screen.getAllByText('Failed')[0]).toBeInTheDocument();

    const milestones = section('Milestones');
    expect(within(milestones).getByText('1. Milestone 1')).toBeInTheDocument();
    expect(within(milestones).getByText('Criteria not met')).toBeInTheDocument();

    const transactions = section('Transaction History');
    expect(within(transactions).getByText('Funds Redirected')).toBeInTheDocument();
    expect(within(transactions).getAllByText('8,800 USDC')).toHaveLength(2);
    expect(within(transactions).getByText('d6a2e4f1...1c7a0d')).toBeInTheDocument();
  });

  it('renders a not-found state for unknown vault ids', () => {
    renderVaultDetail('999');

    expect(screen.getByRole('heading', { name: 'Vault not found' })).toBeInTheDocument();
    expect(screen.getByText('No vault with ID "999" exists.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Vaults/i })).toHaveAttribute('href', '/vaults');
  });
});
