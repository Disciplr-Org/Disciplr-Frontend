import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ThemeToggle from '../ThemeToggle';
import { ThemeProvider } from '../../context/ThemeContext';

function renderThemeToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe('ThemeToggle component', () => {
  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList));
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clicking cycles through the documented preference order (system -> light -> dark -> system)', () => {
    renderThemeToggle();
    const toggleBtn = screen.getByRole('button');

    // Initial state: default is 'system'
    expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to light mode');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'mixed');

    // Click 1: system -> light
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to dark mode');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');

    // Click 2: light -> dark
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to system mode');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');

    // Click 3: dark -> system (returns to starting preference)
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to light mode');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'mixed');
  });

  it('renders fallback safely with tampered stored preference like <b>', () => {
    localStorage.setItem('disciplr-theme', '<b>');

    renderThemeToggle();
    const toggleBtn = screen.getByRole('button');

    // Tampered value falls back gracefully without throwing
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to light mode');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'mixed');

    // Verify it can still cycle normally
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to dark mode');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('handles "evil" stored preference by showing fallback and cycling three times returns to starting preference', () => {
    localStorage.setItem('disciplr-theme', 'evil');

    renderThemeToggle();
    const toggleBtn = screen.getByRole('button');

    // Starting preference is fallback 'system'
    expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to light mode');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'mixed');

    // Clicking three times returns to the starting preference
    fireEvent.click(toggleBtn); // system -> light
    expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to dark mode');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggleBtn); // light -> dark
    expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to system mode');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(toggleBtn); // dark -> system
    expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to light mode');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'mixed');
  });

  it('supports keyboard activation via Enter and Space', async () => {
    const user = userEvent.setup();
    renderThemeToggle();
    const toggleBtn = screen.getByRole('button');

    toggleBtn.focus();
    expect(toggleBtn).toHaveFocus();

    // Activate with Space
    await user.keyboard(' ');
    expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to dark mode');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');

    // Activate with Enter
    await user.keyboard('{Enter}');
    expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to system mode');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('continues rendering when localStorage throws an error', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('localStorage is disabled');
    });

    renderThemeToggle();
    const toggleBtn = screen.getByRole('button');
    expect(toggleBtn).toBeInTheDocument();

    // Verify toggling still works with memory fallback
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('throws helpful error when rendered outside ThemeProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ThemeToggle />)).toThrow(
      /ThemeToggle must be rendered within a ThemeProvider/i
    );

    consoleError.mockRestore();
  });
});
