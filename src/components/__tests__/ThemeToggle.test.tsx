import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../../context/ThemeContext';
import ThemeToggle from '../ThemeToggle';

const THEME_STORAGE_KEY = 'disciplr-theme';

function installMatchMedia(prefersDark = false) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue({
      matches: prefersDark,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

function resetThemeEnvironment() {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  vi.restoreAllMocks();
}

function renderThemeToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe('ThemeToggle', () => {
  afterEach(() => {
    resetThemeEnvironment();
  });

  it('labels the button with the next light/dark action and updates after toggling', async () => {
    installMatchMedia(false);

    renderThemeToggle();

    const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'light'));

    fireEvent.click(toggle);

    await waitFor(() => expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument());
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('uses a persisted dark theme and then labels the next action after toggling back', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    installMatchMedia(false);

    renderThemeToggle();

    const toggle = screen.getByRole('button', { name: /switch to light mode/i });
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'dark'));

    fireEvent.click(toggle);

    await waitFor(() => expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument());
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});
