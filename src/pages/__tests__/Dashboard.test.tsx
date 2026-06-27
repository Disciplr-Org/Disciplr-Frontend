import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../../pages/Dashboard';

describe('Dashboard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the At Risk section when vaults are in critical or soon urgency', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-01T00:00:00Z'));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'At Risk' })).toBeInTheDocument();
    expect(screen.getAllByText(/Beta Reserve/i).length).toBeGreaterThan(0);
  });

  it('does not render the At Risk section when no vaults are at risk', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-10T00:00:00Z'));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.queryByRole('heading', { name: 'At Risk' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Active Vaults' })).toBeInTheDocument();
  });
});
