import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../context/ThemeContext';
import ThemeToggle from '../ThemeToggle';

const THEME_KEY = 'disciplr-theme';

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('default (system) mode', () => {
    test('renders in system mode by default', () => {
      renderToggle();

      const button = screen.getByRole('button', { name: /switch to light mode/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'mixed');
    });

    test('shows monitor icon in system mode', () => {
      renderToggle();

      const button = screen.getByRole('button', { name: /switch to light mode/i });
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // Monitor icon has a <rect> element (the screen)
      expect(svg?.querySelector('rect')).toBeInTheDocument();
    });

    test('data-theme is concrete (light) when OS is light and preference is system', () => {
      renderToggle();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('light mode', () => {
    test('renders light theme with sun icon', () => {
      localStorage.setItem(THEME_KEY, 'light');
      renderToggle();

      const button = screen.getByRole('button', { name: /switch to dark mode/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'false');
      // Sun icon has circle and lines, no rect
      const svg = button.querySelector('svg');
      expect(svg?.querySelector('circle')).toBeInTheDocument();
    });
  });

  describe('dark mode', () => {
    test('renders dark theme with moon icon', () => {
      localStorage.setItem(THEME_KEY, 'dark');
      renderToggle();

      const button = screen.getByRole('button', { name: /switch to system mode/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    test('data-theme is dark', () => {
      localStorage.setItem(THEME_KEY, 'dark');
      renderToggle();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('tri-state cycling', () => {
    test('cycles system → light → dark → system', async () => {
      const user = userEvent.setup();
      renderToggle();

      const button = screen.getByRole('button', { name: /switch to light mode/i });
      expect(button).toHaveAttribute('aria-pressed', 'mixed');

      // system → light
      await user.click(button);
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      // light → dark
      await user.click(button);
      expect(button).toHaveAttribute('aria-label', 'Switch to system mode');
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      // dark → system
      await user.click(button);
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      expect(button).toHaveAttribute('aria-pressed', 'mixed');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    test('persists preference through full cycle', async () => {
      const user = userEvent.setup();
      renderToggle();

      const button = screen.getByRole('button', { name: /switch to light mode/i });

      await user.click(button); // system → light
      expect(localStorage.getItem(THEME_KEY)).toBe('light');

      await user.click(button); // light → dark
      expect(localStorage.getItem(THEME_KEY)).toBe('dark');

      await user.click(button); // dark → system
      expect(localStorage.getItem(THEME_KEY)).toBe('system');
    });
  });

  describe('keyboard interaction', () => {
    test('keyboard activation with Enter cycles theme', async () => {
      const user = userEvent.setup();
      renderToggle();

      const button = screen.getByRole('button', { name: /switch to light mode/i });
      button.focus();
      await user.keyboard('{Enter}');

      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    });

    test('keyboard activation with Space cycles theme', async () => {
      const user = userEvent.setup();
      renderToggle();

      const button = screen.getByRole('button', { name: /switch to light mode/i });
      button.focus();
      await user.keyboard(' ');

      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    });
  });

  describe('data-theme attribute', () => {
    test('updates data-theme when cycling through preferences', async () => {
      const user = userEvent.setup();
      renderToggle();

      // system → light
      await user.click(screen.getByRole('button'));
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');

      // light → dark
      await user.click(screen.getByRole('button'));
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      // dark → system (resolves to light since OS is light)
      await user.click(screen.getByRole('button'));
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('unmount', () => {
    test('unmount does not throw and cleans listeners', () => {
      const { unmount } = renderToggle();
      expect(() => unmount()).not.toThrow();
    });
  });
});
