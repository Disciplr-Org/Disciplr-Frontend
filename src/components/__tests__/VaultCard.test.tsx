// VaultCard component unit tests
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import VaultCard, { VaultCardProps } from '../../components/VaultCard';

// Freeze time for consistent deadline calculations
const fixedNow = new Date('2024-07-01T00:00:00Z');
vi.useFakeTimers();
vi.setSystemTime(fixedNow);

describe('VaultCard', () => {
  const baseProps: VaultCardProps = {
    id: '1',
    name: 'Alpha Vault',
    amount: 12500,
    currency: 'USDC',
    status: 'active',
    deadline: '2024-07-15T10:00:00Z',
    progressPct: 0,
  };

  const renderCard = (props = baseProps) =>
    render(
      <MemoryRouter>
        <VaultCard {...props} />
      </MemoryRouter>
    );

  it('renders vault name and amount', () => {
    renderCard();
    expect(screen.getByText('Alpha Vault')).toBeInTheDocument();
    expect(screen.getByText('12,500 USDC')).toBeInTheDocument();
  });

  it('renders live countdown deadline', () => {
    renderCard();
    expect(screen.getByLabelText(/Deadline Jul 15, 2024/)).toHaveTextContent('14d 10h remaining');
  });

  it('displays correct status badge', () => {
    renderCard();
    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
    // Badge should use the accent color variable
    expect(badge).toHaveStyle({ color: 'var(--accent)' });
  });

  it('renders an accessible vault progress bar', () => {
    renderCard({ ...baseProps, progressPct: 42 });

    expect(
      screen.getByRole('progressbar', { name: 'Alpha Vault progress' })
    ).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByText('42%')).toBeInTheDocument();
  });
});
