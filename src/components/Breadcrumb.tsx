import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { truncateMiddle } from '../utils/truncate';

export interface BreadcrumbSegment {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
  maxCurrentLabelLength?: number;
}

const DEFAULT_MAX_CURRENT_LABEL_LENGTH = 36;
const CURRENT_LABEL_HEAD = 20;
const CURRENT_LABEL_TAIL = 8;

function displayLabel(
  label: string,
  isCurrent: boolean,
  maxCurrentLabelLength: number,
) {
  if (!isCurrent || label.length <= maxCurrentLabelLength) {
    return label;
  }

  return truncateMiddle(label, CURRENT_LABEL_HEAD, CURRENT_LABEL_TAIL);
}

export function Breadcrumb({
  segments,
  ariaLabel = 'Breadcrumb',
  className,
  style,
  maxCurrentLabelLength = DEFAULT_MAX_CURRENT_LABEL_LENGTH,
}: BreadcrumbProps) {
  if (segments.length === 0) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className={className} style={style}>
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-2)',
          minWidth: 0,
          margin: 0,
          padding: 0,
          listStyle: 'none',
          color: 'var(--muted)',
          fontSize: 'var(--font-size-caption)',
          lineHeight: 'var(--line-height-caption)',
        }}
      >
        {segments.map((segment, index) => {
          const isCurrent = index === segments.length - 1;
          const label = displayLabel(
            segment.label,
            isCurrent,
            maxCurrentLabelLength,
          );
          const wasTruncated = label !== segment.label;

          return (
            <li
              key={`${segment.label}-${index}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minWidth: 0,
                gap: 'var(--spacing-2)',
              }}
            >
              {index > 0 && (
                <span aria-hidden="true" style={{ color: 'var(--border)' }}>
                  /
                </span>
              )}
              {isCurrent || !segment.to ? (
                <span
                  aria-current={isCurrent ? 'page' : undefined}
                  title={isCurrent ? (wasTruncated ? segment.label : undefined) : segment.label}
                  style={{
                    display: 'inline-block',
                    maxWidth: isCurrent ? '18rem' : '12rem',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: isCurrent ? 'var(--text)' : 'var(--muted)',
                    fontWeight: isCurrent ? 600 : 500,
                  }}
                >
                  {label}
                </span>
              ) : (
                <Link
                  to={segment.to}
                  title={segment.label}
                  style={{
                    display: 'inline-block',
                    maxWidth: '12rem',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--accent)',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
