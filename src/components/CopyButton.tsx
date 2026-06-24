import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import { browserClipboardAdapter, type ClipboardAdapter } from './copyClipboard';
import './CopyButton.css';

type CopyState = 'idle' | 'success' | 'error';

export interface CopyButtonProps {
  value: string;
  label: string;
  adapter?: ClipboardAdapter;
  resetMs?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  stopPropagation?: boolean;
}

export function CopyButton({
  value,
  label,
  adapter = browserClipboardAdapter,
  resetMs = 1500,
  className = '',
  style,
  children,
  stopPropagation = false,
}: CopyButtonProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const scheduleReset = () => {
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }

    resetTimer.current = setTimeout(() => {
      setCopyState('idle');
      resetTimer.current = null;
    }, resetMs);
  };

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }

    if (!value) return;

    try {
      await adapter.writeText(value);
      setCopyState('success');
    } catch {
      setCopyState('error');
    } finally {
      scheduleReset();
    }
  };

  const Icon =
    copyState === 'success' ? Check : copyState === 'error' ? AlertTriangle : Copy;
  const statusMessage =
    copyState === 'success' ? 'Copied' : copyState === 'error' ? 'Copy failed' : '';

  return (
    <button
      type="button"
      className={`copy-button ${copyState !== 'idle' ? `copy-button-${copyState}` : ''} ${className}`.trim()}
      style={style}
      aria-label={label}
      title={label}
      onClick={handleClick}
      disabled={!value}
    >
      {children && <span className="copy-button-content">{children}</span>}
      <Icon size={14} aria-hidden="true" />
      <span className="copy-button-status" aria-live="polite">
        {statusMessage}
      </span>
    </button>
  );
}
