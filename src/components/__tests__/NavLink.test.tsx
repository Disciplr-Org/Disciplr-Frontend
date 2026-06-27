import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import NavLink from '../NavLink';

function renderNav(to: string, currentPath: string, className = '', ariaLabel?: string) {
  return render(
    <MemoryRouter initialEntries={[currentPath]}>
      <NavLink to={to} className={className} ariaLabel={ariaLabel}>
        Link
      </NavLink>
    </MemoryRouter>,
  );
}

describe('NavLink', () => {
  it('is active with aria-current="page" when to matches the current path', () => {
    renderNav('/dashboard', '/dashboard');
    const link = screen.getByRole('link');
    expect(link).toHaveClass('active');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('is active when current path starts with to (non-root)', () => {
    renderNav('/vaults', '/vaults/123');
    const link = screen.getByRole('link');
    expect(link).toHaveClass('active');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('is inactive when to does not match the current path', () => {
    renderNav('/dashboard', '/vaults');
    const link = screen.getByRole('link');
    expect(link).not.toHaveClass('active');
    expect(link).not.toHaveAttribute('aria-current');
  });

  it('root "/" is active only on exact "/" path', () => {
    renderNav('/', '/');
    expect(screen.getByRole('link')).toHaveClass('active');
  });

  it('root "/" is inactive on a non-root path', () => {
    renderNav('/', '/dashboard');
    const link = screen.getByRole('link');
    expect(link).not.toHaveClass('active');
    expect(link).not.toHaveAttribute('aria-current');
  });

  it('forwards className and combines it with active class', () => {
    renderNav('/vaults', '/vaults', 'nav-item');
    const link = screen.getByRole('link');
    expect(link).toHaveClass('nav-item');
    expect(link).toHaveClass('active');
    expect(link.className).toBe('nav-item active');
  });

  it('forwards ariaLabel prop', () => {
    renderNav('/vaults', '/vaults', '', 'Go to vaults');
    expect(screen.getByRole('link')).toHaveAttribute('aria-label', 'Go to vaults');
  });

  it('produces no leading/trailing spaces when className is empty and inactive', () => {
    renderNav('/dashboard', '/vaults');
    expect(screen.getByRole('link').className).toBe('');
  });

  it('produces no leading/trailing spaces when className is empty and active', () => {
    renderNav('/vaults', '/vaults');
    expect(screen.getByRole('link').className).toBe('active');
  });

  it('partial prefix of to does NOT make to active (to is the prefix, not the path)', () => {
    // current path "/vault" does not start with "/vaults"
    renderNav('/vaults', '/vault');
    expect(screen.getByRole('link')).not.toHaveClass('active');
  });
});
