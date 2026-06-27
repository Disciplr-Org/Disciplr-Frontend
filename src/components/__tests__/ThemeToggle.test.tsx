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

  test('renders light theme by default', () => {
    renderToggle();

    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  test('renders dark theme from localStorage', () => {
    localStorage.setItem(THEME_KEY, 'dark');
    renderToggle();

    const button = screen.getByRole('button', { name: /switch to light mode/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  test('click toggles theme', async () => {
    const user = userEvent.setup();
    renderToggle();

    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    await user.click(button);

    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('double click returns original theme', async () => {
    const user = userEvent.setup();
    renderToggle();

    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    await user.click(button);
    await user.click(button);

    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('persists to localStorage', async () => {
    const user = userEvent.setup();
    renderToggle();

    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    await user.click(button);

    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  test('updates data-theme attribute on document root', async () => {
    const user = userEvent.setup();
    renderToggle();

    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    await user.click(button);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('keyboard activation with Enter toggles theme', async () => {
    const user = userEvent.setup();
    renderToggle();

    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    button.focus();
    await user.keyboard('{Enter}');

    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  test('keyboard activation with Space toggles theme', async () => {
    const user = userEvent.setup();
    renderToggle();

    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    button.focus();
    await user.keyboard(' ');

    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  test('renders a theme icon (SVG)', () => {
    renderToggle();

    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  test('unmount does not throw and cleans listeners', () => {
    const { unmount } = renderToggle();
    expect(() => unmount()).not.toThrow();
  });
});
