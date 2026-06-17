import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import VaultProgressBar, { clampVaultProgress } from '../../components/VaultProgressBar';

describe('VaultProgressBar', () => {
  it('renders accessible progressbar semantics with a visible label', () => {
    render(<VaultProgressBar value={42} label="Vault progress" />);

    expect(screen.getByText('Vault progress')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar', { name: 'Vault progress' });
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-valuenow', '42');
    expect(progressbar.getAttribute('style')).toContain('--vault-progress-value: 42%');
    expect(progressbar.getAttribute('style')).toContain('--vault-progress-fill: var(--accent)');
  });

  it('uses a default aria label when no visible label is provided', () => {
    render(<VaultProgressBar value={15} />);

    expect(screen.queryByText('Vault progress')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Vault progress' })).toHaveAttribute(
      'aria-valuenow',
      '15'
    );
  });

  it('clamps negative, oversized, and non-finite values', () => {
    expect(clampVaultProgress(-5)).toBe(0);
    expect(clampVaultProgress(120)).toBe(100);
    expect(clampVaultProgress(Number.NaN)).toBe(0);
    expect(clampVaultProgress(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('exposes clamped values through aria and fill width', () => {
    const { rerender } = render(<VaultProgressBar value={-5} label="Negative" />);

    let progressbar = screen.getByRole('progressbar', { name: 'Negative' });
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    expect(progressbar.getAttribute('style')).toContain('--vault-progress-value: 0%');

    rerender(<VaultProgressBar value={120} label="Oversized" />);
    progressbar = screen.getByRole('progressbar', { name: 'Oversized' });
    expect(progressbar).toHaveAttribute('aria-valuenow', '100');
    expect(progressbar.getAttribute('style')).toContain('--vault-progress-value: 100%');
  });

  it('switches to the success token at full completion', () => {
    render(<VaultProgressBar value={100} label="Complete" />);

    const progressbar = screen.getByRole('progressbar', { name: 'Complete' });
    expect(progressbar.getAttribute('style')).toContain('--vault-progress-fill: var(--success)');
  });
});
