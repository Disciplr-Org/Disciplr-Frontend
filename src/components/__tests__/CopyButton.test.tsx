import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CopyButton } from '../CopyButton';
import type { ClipboardAdapter } from '../copyClipboard';

describe('CopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies through the injected clipboard adapter and announces success', async () => {
    const adapter: ClipboardAdapter = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };

    render(
      <CopyButton value="GBVZ3KQK" label="Copy address" adapter={adapter}>
        GBVZ...QK
      </CopyButton>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy address' }));
    });

    expect(adapter.writeText).toHaveBeenCalledWith('GBVZ3KQK');
    expect(screen.getByText('Copied')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByText('Copied')).not.toBeInTheDocument();
  });

  it('shows an error state when clipboard copying rejects', async () => {
    const adapter: ClipboardAdapter = {
      writeText: vi.fn().mockRejectedValue(new Error('denied')),
    };

    render(<CopyButton value="hash" label="Copy hash" adapter={adapter} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy hash' }));
    });

    expect(screen.getByText('Copy failed')).toBeInTheDocument();
    expect(adapter.writeText).toHaveBeenCalledWith('hash');
  });

  it('handles a missing browser clipboard API without throwing', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    render(<CopyButton value="hash" label="Copy hash" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy hash' }));
    });

    expect(screen.getByText('Copy failed')).toBeInTheDocument();
  });

  it('disables the button for an empty copy value', () => {
    const adapter: ClipboardAdapter = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };

    render(<CopyButton value="" label="Copy empty value" adapter={adapter} />);

    expect(screen.getByRole('button', { name: 'Copy empty value' })).toBeDisabled();
    expect(adapter.writeText).not.toHaveBeenCalled();
  });

  it('keeps the latest rapid copy confirmation timer', async () => {
    const adapter: ClipboardAdapter = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };

    render(
      <CopyButton value="hash" label="Copy hash" adapter={adapter} resetMs={1500} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy hash' }));
    });
    expect(adapter.writeText).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy hash' }));
    });
    expect(adapter.writeText).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Copied')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByText('Copied')).not.toBeInTheDocument();
  });
});
