import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '../Switch';

function renderSwitch(props?: Partial<Parameters<typeof Switch>[0]>) {
  const onChange = vi.fn();
  const result = render(
    <Switch
      label="Test Switch"
      checked={false}
      onChange={onChange}
      {...props}
    />,
  );
  return { ...result, onChange };
}

describe('Switch', () => {
  it('renders with role="switch"', () => {
    renderSwitch();
    expect(screen.getByRole('switch', { name: 'Test Switch' })).toBeInTheDocument();
  });

  it('reflects checked=false via aria-checked', () => {
    renderSwitch({ checked: false });
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('reflects checked=true via aria-checked', () => {
    renderSwitch({ checked: true });
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with toggled value on click', async () => {
    const user = userEvent.setup();
    const { onChange } = renderSwitch({ checked: false });

    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with toggled value when checked=true', async () => {
    const user = userEvent.setup();
    const { onChange } = renderSwitch({ checked: true });

    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('toggles on Space key press', async () => {
    const user = userEvent.setup();
    const { onChange } = renderSwitch({ checked: false });

    screen.getByRole('switch').focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('toggles on Enter key press', async () => {
    const user = userEvent.setup();
    const { onChange } = renderSwitch({ checked: false });

    screen.getByRole('switch').focus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled and clicked', async () => {
    const user = userEvent.setup();
    const { onChange } = renderSwitch({ disabled: true });

    await user.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not call onChange when disabled and Space is pressed', async () => {
    const onChange = vi.fn();
    render(<Switch label="Disabled" checked={false} onChange={onChange} disabled />);

    const sw = screen.getByRole('switch');
    sw.focus();
    // Dispatch keyboard event directly since disabled button won't receive userEvent keyboard
    sw.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    renderSwitch({ disabled: true });
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('aria-checked syncs with controlled checked prop', () => {
    const { rerender } = renderSwitch({ checked: false });
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');

    rerender(<Switch label="Test Switch" checked={true} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('uses the label prop as accessible name', () => {
    renderSwitch({ label: 'My Custom Label' });
    expect(screen.getByRole('switch', { name: 'My Custom Label' })).toBeInTheDocument();
  });
});
