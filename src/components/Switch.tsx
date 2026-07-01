import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

export type SwitchProps = {
  /** Whether the switch is on */
  checked: boolean;
  /** Called when the user toggles the switch */
  onChange: (checked: boolean) => void;
  /** Accessible label for the switch */
  label: string;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Optional id for the underlying button */
  id?: string;
};

/**
 * Accessible Switch / Toggle primitive.
 *
 * Implements WAI-ARIA switch role with full keyboard support (Space & Enter)
 * and design-token styling.
 */
export function Switch({ checked, onChange, label, disabled = false, id }: SwitchProps) {
  function handleKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  }

  function handleClick() {
    if (!disabled) {
      onChange(!checked);
    }
  }

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '2.75rem',
        height: '1.5rem',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border)',
        background: checked ? 'var(--accent)' : 'var(--surface-raised)',
        borderColor: checked ? 'var(--accent)' : 'var(--border)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 150ms ease, border-color 150ms ease',
        padding: 0,
        outline: 'none',
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 4px var(--accent-transparent)';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          transform: checked
            ? 'translateX(1.375rem) translateY(-50%)'
            : 'translateX(0.125rem) translateY(-50%)',
          width: '1.125rem',
          height: '1.125rem',
          borderRadius: 'var(--radius-full)',
          background: checked ? 'var(--surface)' : 'var(--bg)',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
          transition: 'transform 150ms ease, background 150ms ease',
        }}
      />
    </button>
  );
}

export default Switch;
