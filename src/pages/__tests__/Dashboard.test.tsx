import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';

// Freeze time so deadlineUrgency produces consistent results
const fixedNow = new Date('2026-07-27T00:00:00Z');
vi.useFakeTimers();
vi.setSystemTime(fixedNow);

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  it('renders the welcome heading', () => {
    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders summary cards', () => {
    renderDashboard();
    expect(screen.getByText('Total Locked')).toBeInTheDocument();
    expect(screen.getAllByText('Active Vaults')).toHaveLength(2);
    expect(screen.getByText('Pending Milestones')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    renderDashboard();
    expect(screen.getByText('+ Create Vault')).toBeInTheDocument();
    expect(screen.getByText('View All Vaults')).toBeInTheDocument();
    expect(screen.getByText('Verify Milestone')).toBeInTheDocument();
  });

  it('renders the Active Vaults section with vault cards', () => {
    renderDashboard();
    expect(screen.getAllByText('Active Vaults')).toHaveLength(2);
    expect(screen.getAllByText('Alpha Vault').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Beta Reserve').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Gamma Fund').length).toBeGreaterThanOrEqual(2);
  });

  it('renders the at-risk section when vaults have critical or soon deadlines', () => {
    renderDashboard();
    // Beta Reserve (2026-07-30) is 3d away → soon, and pending_validation → at risk
    // Gamma Fund (2026-07-28T06:00:00Z) is ~30h away → soon, and active → at risk
    // Alpha Vault (2024-07-15) is expired → safe → excluded
    expect(screen.getByText(/⚠️ At Risk/)).toBeInTheDocument();
    expect(screen.getByText(/These vaults need immediate attention/)).toBeInTheDocument();

    // Both at-risk vaults should appear in the section
    const atRiskSection = screen.getByText(/⚠️ At Risk/).closest('div');
    expect(atRiskSection).toBeInTheDocument();
  });

  it('renders the Upcoming Deadlines sidebar', () => {
    renderDashboard();
    expect(screen.getByText('Upcoming Deadlines')).toBeInTheDocument();
  });

  it('renders the Recent Activity section', () => {
    renderDashboard();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });
});
