import { describe, test, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '../NotFound';

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  );
}

function renderNotFoundAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <NotFound />
    </MemoryRouter>
  );
}

describe('NotFound page', () => {
  test('renders accessible h1 heading with 404 text', () => {
    renderNotFound();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('404');
  });

  test('renders "Page Not Found" h2 subheading', () => {
    renderNotFound();
    const subheading = screen.getByRole('heading', { level: 2 });
    expect(subheading).toBeInTheDocument();
    expect(subheading).toHaveTextContent(/Page Not Found/i);
  });

  test('home link points to "/" and has accessible name', () => {
    renderNotFound();
    const homeLink = screen.getByRole('link', { name: /Go to Home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  test('Go Back button is present and accessible', () => {
    renderNotFound();
    const backButton = screen.getByRole('button', { name: /Go Back/i });
    expect(backButton).toBeInTheDocument();
  });

  test('popular page links have accessible names and correct hrefs', () => {
    renderNotFound();
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    const vaultsLink = screen.getByRole('link', { name: /Vaults/i });
    const verifierLink = screen.getByRole('link', { name: /Verifier/i });

    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    expect(vaultsLink).toHaveAttribute('href', '/vaults');
    expect(verifierLink).toHaveAttribute('href', '/verifier');
  });

  test('suggests the closest known route as an accessible link', () => {
    renderNotFoundAt('/vault');
    const suggestions = screen.getByRole('list', { name: /suggested pages/i });
    const link = within(suggestions).getByRole('link', { name: 'Vaults' });
    expect(link).toHaveAttribute('href', '/vaults');
  });

  test('shows the suggested path as plain text', () => {
    renderNotFoundAt('/vault');
    const suggestions = screen.getByRole('list', { name: /suggested pages/i });
    expect(within(suggestions).getByText('/vaults')).toBeInTheDocument();
  });

  test('renders no suggestions when nothing is close to the requested path', () => {
    renderNotFoundAt('/zzzzzz');
    expect(screen.queryByRole('list', { name: /suggested pages/i })).not.toBeInTheDocument();
  });
});
