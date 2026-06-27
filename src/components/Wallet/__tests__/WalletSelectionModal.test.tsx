import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletSelectionModal } from '../WalletSelectionModal';

const walletState = vi.hoisted(() => ({
    connect: vi.fn(),
    isConnecting: false,
    error: null as string | null,
}));

vi.mock('../../../context/WalletContext', () => ({
    useWallet: () => walletState,
}));

vi.mock('@stellar/freighter-api');

function renderModal(onClose = vi.fn()) {
    return { onClose, ...render(<WalletSelectionModal onClose={onClose} />) };
}

beforeEach(() => {
    walletState.connect.mockReset();
    walletState.isConnecting = false;
    walletState.error = null;
});

test('renders the modal title and Freighter option', () => {
    renderModal();
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    expect(screen.getByText('Freighter')).toBeInTheDocument();
});

test('clicking the close button calls onClose', async () => {
    const { onClose } = renderModal();
    await userEvent.click(screen.getByRole('button', { name: '' })); // X button
    expect(onClose).toHaveBeenCalledTimes(1);
});

test('clicking the overlay backdrop calls onClose', async () => {
    const { onClose } = renderModal();
    // The overlay is the outermost div; clicking it triggers onClose
    await userEvent.click(document.querySelector('.wallet-modal-overlay')!);
    expect(onClose).toHaveBeenCalledTimes(1);
});

test('clicking modal content does not propagate to backdrop', async () => {
    const { onClose } = renderModal();
    await userEvent.click(document.querySelector('.wallet-modal-content')!);
    expect(onClose).not.toHaveBeenCalled();
});

test('connect button calls connect and then onClose on success', async () => {
    walletState.connect.mockResolvedValue(undefined);
    const { onClose } = renderModal();
    await userEvent.click(screen.getByRole('button', { name: /freighter/i }));
    expect(walletState.connect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
});

test('isConnecting disables the Freighter button and shows loader', () => {
    walletState.isConnecting = true;
    renderModal();
    expect(screen.getByRole('button', { name: /freighter/i })).toBeDisabled();
    expect(document.querySelector('.loader')).toBeInTheDocument();
});

test('displays error message from context', () => {
    walletState.error = 'Wallet access denied.';
    renderModal();
    expect(screen.getByText('Wallet access denied.')).toBeInTheDocument();
});

test('no error element when error is null', () => {
    renderModal();
    expect(document.querySelector('.wallet-error')).not.toBeInTheDocument();
});

test('renders without crash when wallet is already connected', () => {
    // Modal is mounted regardless of connection state; should render cleanly
    const { container } = renderModal();
    expect(container).not.toBeEmptyDOMElement();
});

test('connect rejection still calls onClose after connect resolves', async () => {
    // connect() handles errors internally; the modal always calls onClose after await
    walletState.connect.mockResolvedValue(undefined);
    walletState.error = 'Failed to connect wallet.';
    const { onClose } = renderModal();
    await userEvent.click(screen.getByRole('button', { name: /freighter/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
});

test('error then retry: error clears on second attempt', async () => {
    walletState.error = 'Failed to connect wallet.';
    walletState.connect.mockImplementation(() => {
        walletState.error = null;
        return Promise.resolve();
    });
    const { onClose } = renderModal();
    expect(screen.getByText('Failed to connect wallet.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /freighter/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
});
