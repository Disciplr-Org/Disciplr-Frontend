import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WalletNetwork } from '../../context/WalletContext';
import { ExplorerLink } from '../ExplorerLink';

let mockNetwork: WalletNetwork | null = 'TESTNET';

vi.mock('../../context/WalletContext', () => ({
  useWallet: () => ({ network: mockNetwork }),
}));

describe('ExplorerLink', () => {
  beforeEach(() => {
    mockNetwork = 'TESTNET';
  });

  it('renders a SafeLink with TESTNET as the default connected network', () => {
    render(
      <ExplorerLink kind="account" id="GACCOUNT">
        GACC...OUNT
      </ExplorerLink>,
    );

    const link = screen.getByRole('link', { name: /view account gaccount/i });
    expect(link).toHaveAttribute(
      'href',
      'https://stellar.expert/explorer/testnet/account/GACCOUNT',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('reflects the connected PUBLIC network from WalletContext', () => {
    mockNetwork = 'PUBLIC';

    render(
      <ExplorerLink kind="tx" id="abc123">
        Explorer
      </ExplorerLink>,
    );

    expect(screen.getByRole('link', { name: /view tx abc123/i })).toHaveAttribute(
      'href',
      'https://stellar.expert/explorer/public/tx/abc123',
    );
  });

  it('allows an explicit network override and renders inert content for empty ids', () => {
    const { rerender } = render(
      <ExplorerLink kind="contract" id="CCONTRACT" network="PUBLIC">
        Contract
      </ExplorerLink>,
    );

    expect(screen.getByRole('link', { name: /view contract ccontract/i })).toHaveAttribute(
      'href',
      'https://stellar.expert/explorer/public/contract/CCONTRACT',
    );

    rerender(
      <ExplorerLink kind="tx" id="   ">
        Missing hash
      </ExplorerLink>,
    );

    expect(screen.queryByRole('link', { name: /missing hash/i })).not.toBeInTheDocument();
    expect(screen.getByText('Missing hash')).toHaveAttribute('aria-disabled', 'true');
  });
});
