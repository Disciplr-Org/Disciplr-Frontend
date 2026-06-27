import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import NavLink from '../NavLink';

function renderNavLink(initialPath: string, props = {}) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NavLink to="/vaults" className="nav-item" ariaLabel="Vault navigation" {...props}>
        Vaults
      </NavLink>
    </MemoryRouter>,
  );
}

describe('NavLink', () => {
  test('marks matching routes as active and current page', () => {
    renderNavLink('/vaults');

    const link = screen.getByRole('link', { name: 'Vault navigation' });

    expect(link).toHaveAttribute('href', '/vaults');
    expect(link).toHaveClass('nav-item');
    expect(link).toHaveClass('active');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  test('omits active class and aria-current for non-matching routes', () => {
    renderNavLink('/dashboard');

    const link = screen.getByRole('link', { name: 'Vault navigation' });

    expect(link).toHaveClass('nav-item');
    expect(link).not.toHaveClass('active');
    expect(link).not.toHaveAttribute('aria-current');
  });

  test('forwards className and ariaLabel while trimming the combined class string', () => {
    renderNavLink('/dashboard', {
      className: ' px-4 text-sm ',
      ariaLabel: 'Go to vaults',
    });

    const link = screen.getByRole('link', { name: 'Go to vaults' });

    expect(link).toHaveTextContent('Vaults');
    expect(link.getAttribute('class')).toBe('px-4 text-sm');
    expect(link.getAttribute('class')).not.toMatch(/^\s|\s$/);
  });
});
