import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import Dashboard from '../../pages/Dashboard';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

function summaryCard(label: string) {
  const card = screen.getByText(label).parentElement;
  expect(card).not.toBeNull();
  return card as HTMLElement;
}

function sectionByHeading(name: string) {
  const heading = screen.getByRole('heading', { name });
  const section = heading.parentElement?.parentElement;
  expect(section).toBeDefined();
  return section as HTMLElement;
}

describe('Dashboard', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-01T00:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('renders the summary metrics and primary actions', () => {
    renderDashboard();

    expect(summaryCard('Total Locked')).toHaveTextContent('$25,500');
    expect(summaryCard('Total Locked')).toHaveTextContent('USDC');
    expect(summaryCard('Active Vaults')).toHaveTextContent('3');
    expect(summaryCard('Pending Milestones')).toHaveTextContent('2');
    expect(summaryCard('Completion Rate')).toHaveTextContent('67%');
    expect(summaryCard('Completion Rate')).toHaveTextContent('all time');

    expect(screen.getByRole('link', { name: '+ Create Vault' })).toHaveAttribute(
      'href',
      '/vaults/create'
    );
    expect(screen.getByRole('link', { name: 'View All Vaults' })).toHaveAttribute(
      'href',
      '/vaults'
    );
  });

  it('renders one linked vault card per dashboard vault with the expected statuses', () => {
    renderDashboard();

    const vaultsSection = sectionByHeading('Active Vaults');
    const vaultLinks = within(vaultsSection)
      .getAllByRole('link')
      .filter((link) => /^\/vaults\/\d+$/.test(link.getAttribute('href') ?? ''));

    expect(vaultLinks).toHaveLength(3);
    expect(vaultLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/vaults/1',
      '/vaults/2',
      '/vaults/3',
    ]);

    expect(within(vaultsSection).getByText('Alpha Vault')).toBeInTheDocument();
    expect(within(vaultsSection).getByText('Beta Reserve')).toBeInTheDocument();
    expect(within(vaultsSection).getByText('Gamma Fund')).toBeInTheDocument();
    expect(within(vaultsSection).getAllByText('Active')).toHaveLength(2);
    expect(within(vaultsSection).getByText('Pending')).toBeInTheDocument();
  });

  it('renders upcoming deadlines with deterministic urgency labels', () => {
    renderDashboard();

    const deadlinesSection = sectionByHeading('Upcoming Deadlines');

    expect(within(deadlinesSection).getByText('Beta Reserve')).toBeInTheDocument();
    expect(within(deadlinesSection).getByText('Alpha Vault')).toBeInTheDocument();
    expect(within(deadlinesSection).getByText('20d')).toBeInTheDocument();
    expect(within(deadlinesSection).getByText('76d')).toBeInTheDocument();
    expect(within(deadlinesSection).getByText(/8,800 USDC.*May 20/)).toBeInTheDocument();
    expect(within(deadlinesSection).getByText(/12,500 USDC.*Jul 15/)).toBeInTheDocument();
  });

  it('maps every activity type to its dashboard label and amount metadata', () => {
    renderDashboard();

    const activitySection = sectionByHeading('Recent Activity');

    expect(within(activitySection).getByText(/Milestone validated/)).toHaveTextContent(
      'Alpha Vault'
    );
    expect(within(activitySection).getByText(/Vault created/)).toHaveTextContent('Gamma Fund');
    expect(within(activitySection).getByText(/Funds released/)).toHaveTextContent('Delta Safe');
    expect(within(activitySection).getByText(/Funds redirected/)).toHaveTextContent(
      'Epsilon Pool'
    );

    expect(within(activitySection).getByText('4,200 USDC')).toBeInTheDocument();
    expect(within(activitySection).getByText('15,000 USDC')).toBeInTheDocument();
    expect(within(activitySection).getByText('3,300 USDC')).toBeInTheDocument();
    expect(within(activitySection).getByText('2d ago')).toBeInTheDocument();
    expect(within(activitySection).getByText('3d ago')).toBeInTheDocument();
    expect(within(activitySection).getByText('5d ago')).toBeInTheDocument();
    expect(within(activitySection).getByText('6d ago')).toBeInTheDocument();
  });
});
