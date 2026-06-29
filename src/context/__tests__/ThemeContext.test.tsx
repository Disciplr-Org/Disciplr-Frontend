import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme } from '../ThemeContext';
import React from 'react';

function TestComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  );
}

describe('ThemeContext safe storage', () => {
  const originalMatchMedia = window.matchMedia;
  const originalGetItem = window.localStorage.getItem;
  const originalSetItem = window.localStorage.setItem;

  beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as unknown as MediaQueryList));
    window.localStorage.getItem = jest.fn();
    window.localStorage.setItem = jest.fn();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    window.localStorage.getItem = originalGetItem;
    window.localStorage.setItem = originalSetItem;
  });

  test('falls back to system theme when getItem throws', () => {
    (window.localStorage.getItem as jest.Mock).mockImplementation(() => {
      throw new Error('storage blocked');
    });
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    const themeSpan = screen.getByTestId('theme');
    expect(themeSpan).toHaveTextContent('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  test('toggles theme even when setItem throws', () => {
    (window.localStorage.setItem as jest.Mock).mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    fireEvent.click(screen.getByText('Toggle'));
    const themeSpan = screen.getByTestId('theme');
    expect(themeSpan).toHaveTextContent('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});
