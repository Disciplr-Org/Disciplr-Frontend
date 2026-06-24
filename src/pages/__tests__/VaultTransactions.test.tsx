import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VaultTransactions from '../VaultTransactions';

const userAddress = 'GBVZ3KQKM4XNQPBEZMXPOLKQKM4XNQPBEZMXPOLKQK7L';

describe('VaultTransactions copy actions', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('copies the full transaction hash from a truncated row hash', async () => {
    render(<VaultTransactions />);

    const copyHashButton = screen.getAllByRole('button', {
      name: 'Copy transaction hash',
    })[0];
    expect(copyHashButton).toHaveTextContent('a3f9d1c8...');

    fireEvent.click(copyHashButton);

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'a3f9d1c8e2b74056af3d9c1b2e8f0a4d7c5e9b3f1a2d4c6e8b0f2a4c6d8e0f2a',
      ),
    );
  });

  it('copies full from/to addresses from the transaction detail modal', async () => {
    render(<VaultTransactions />);

    fireEvent.click(screen.getByText('Initial deposit'));
    expect(screen.getByText('GBVZ3K...QK7L')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy from address' }));

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(userAddress),
    );
  });
});
