import '@testing-library/jest-dom/vitest';
import { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WalletSelectionModal } from '../WalletSelectionModal';

const walletState = vi.hoisted(() => ({
  connect: vi.fn<() => Promise<void>>(),
  isConnecting: false,
  error: null as string | null,
}));

vi.mock('../../../context/WalletContext', () => ({
  useWallet: () => walletState,
}));

function renderModal() {
  const onClose = vi.fn();

  return {
    onClose,
    ...render(<WalletSelectionModal onClose={onClose} />),
  };
}

describe('WalletSelectionModal', () => {
  beforeEach(() => {
    walletState.connect.mockReset();
    walletState.connect.mockResolvedValue(undefined);
    walletState.isConnecting = false;
    walletState.error = null;
  });

  it('calls connect and closes after selecting Freighter', async () => {
    const { onClose } = renderModal();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /freighter connected/i }));
      await Promise.resolve();
    });

    expect(walletState.connect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables the Freighter action while connecting', () => {
    walletState.isConnecting = true;
    const { onClose } = renderModal();

    const freighterOption = screen.getByRole('button', { name: /freighter/i });

    expect(freighterOption).toBeDisabled();
    expect(screen.queryByText('Connected')).not.toBeInTheDocument();

    fireEvent.click(freighterOption);

    expect(walletState.connect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders the error block only when an error is present', () => {
    const { rerender } = renderModal();

    expect(screen.queryByText('Freighter is locked')).not.toBeInTheDocument();

    walletState.error = 'Freighter is locked';
    rerender(<WalletSelectionModal onClose={vi.fn()} />);

    expect(screen.getByText('Freighter is locked')).toBeInTheDocument();
  });

  it('closes when the overlay is clicked', () => {
    const { container, onClose } = renderModal();
    const overlay = container.querySelector('.wallet-modal-overlay');
    expect(overlay).toBeInTheDocument();

    fireEvent.click(overlay as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when the modal content is clicked', () => {
    const { container, onClose } = renderModal();
    const content = container.querySelector('.wallet-modal-content');
    expect(content).toBeInTheDocument();

    fireEvent.click(content as Element);

    expect(onClose).not.toHaveBeenCalled();
  });
});
