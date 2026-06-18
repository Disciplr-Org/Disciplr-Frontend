import React from 'react'
import { isSafeEvidenceUrl } from '../utils/evidenceUrl'

interface SafeLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'rel' | 'target'> {
  href: string
  rejectedLabel?: string
}

export function SafeLink({ href, children, className, style, rejectedLabel = 'Rejected unsafe evidence URL', ...props }: SafeLinkProps) {
  if (!isSafeEvidenceUrl(href)) {
    return (
      <span className={className} style={style} data-rejected-evidence-url="true">
        <span>{children}</span>
        <span className="ml-2 text-xs font-semibold text-red-600">{rejectedLabel}</span>
      </span>
    )
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style} {...props}>
      {children}
    </a>
  )
}
