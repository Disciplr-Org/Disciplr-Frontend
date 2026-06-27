import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ThemeToggle from '../ThemeToggle';
import { ThemeProvider } from '../../context/ThemeContext';

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

describe('ThemeToggle', () => {
  test('starts in light theme with a dark-mode label and moon icon', () => {
    renderToggle();

    const button = screen.getByRole('button', { name: 'Switch to dark mode' });

    expect(button).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(button.querySelector('path[d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"]')).not.toBeNull();
  });

  test('clicking toggles to dark theme with a light-mode label and sun icon', () => {
    renderToggle();

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));

    const button = screen.getByRole('button', { name: 'Switch to light mode' });
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(button.querySelector('circle[cx="12"][cy="12"][r="5"]')).not.toBeNull();
    expect(button.querySelectorAll('line')).toHaveLength(8);
  });

  test('uses a stored dark theme and toggles back to light', () => {
    localStorage.setItem('disciplr-theme', 'dark');

    renderToggle();

    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));

    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });
});
