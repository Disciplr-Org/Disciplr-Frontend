import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from '../ThemeContext';

const THEME_STORAGE_KEY = 'disciplr-theme';

function installMatchMedia(prefersDark = false) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQueryList = {
    matches: prefersDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    }),
    removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    }),
    addEventListener: vi.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        listeners.add(listener);
      }
    }),
    removeEventListener: vi.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        listeners.delete(listener);
      }
    }),
    dispatchEvent: vi.fn((event: Event) => {
      listeners.forEach((listener) => listener(event as MediaQueryListEvent));
      return true;
    }),
  } as unknown as MediaQueryList;

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue(mediaQueryList),
  });

  return {
    mediaQueryList,
    triggerChange(matches: boolean) {
      listeners.forEach((listener) => listener({ matches } as MediaQueryListEvent));
    },
  };
}

function resetThemeEnvironment() {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  vi.restoreAllMocks();
}

function ThemeProbe() {
  const { theme, setTheme, toggleTheme } = useTheme();

  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button type="button" onClick={toggleTheme}>
        Toggle
      </button>
      <button type="button" onClick={() => setTheme('dark')}>
        Set dark
      </button>
      <button type="button" onClick={() => setTheme('light')}>
        Set light
      </button>
    </div>
  );
}

function UnsafeThemeProbe() {
  useTheme();
  return null;
}

function renderThemeProvider() {
  return render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    installMatchMedia(false);
  });

  afterEach(() => {
    resetThemeEnvironment();
  });

  it('uses the stored theme before system preference and syncs it to the document', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    installMatchMedia(true);

    renderThemeProvider();

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'light'));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('falls back to the system dark preference when no stored theme exists', async () => {
    installMatchMedia(true);

    renderThemeProvider();

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'dark'));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('ignores invalid stored values and persists the resolved system theme', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'solarized');
    installMatchMedia(false);

    renderThemeProvider();

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'light'));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('toggles the theme while keeping localStorage and the document attribute in sync', async () => {
    renderThemeProvider();

    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'light'));

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));

    await waitFor(() => expect(screen.getByTestId('theme')).toHaveTextContent('dark'));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));

    await waitFor(() => expect(screen.getByTestId('theme')).toHaveTextContent('light'));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('allows callers to set an explicit theme and persists that selection', async () => {
    renderThemeProvider();

    fireEvent.click(screen.getByRole('button', { name: 'Set dark' }));

    await waitFor(() => expect(screen.getByTestId('theme')).toHaveTextContent('dark'));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: 'Set light' }));

    await waitFor(() => expect(screen.getByTestId('theme')).toHaveTextContent('light'));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('updates from a system preference change when the user has no stored selection', async () => {
    const matchMedia = installMatchMedia(false);

    renderThemeProvider();
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'light'));

    localStorage.removeItem(THEME_STORAGE_KEY);
    matchMedia.triggerChange(true);

    await waitFor(() => expect(screen.getByTestId('theme')).toHaveTextContent('dark'));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('removes the system preference listener when unmounted', () => {
    const matchMedia = installMatchMedia(false);

    const { unmount } = renderThemeProvider();
    unmount();

    expect(matchMedia.mediaQueryList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('throws when useTheme is rendered outside ThemeProvider', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<UnsafeThemeProbe />)).toThrow('useTheme must be used within a ThemeProvider');

    error.mockRestore();
  });
});
