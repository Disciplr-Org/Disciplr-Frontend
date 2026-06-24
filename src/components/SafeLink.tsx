import React from 'react';
import { getEvidenceUrlRejectionLabel, getEvidenceUrlSafety } from '../utils/url';

interface SafeLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

/**
 * SafeLink component that sanitizes the provided URL.
 * If the URL is unsafe, it renders as inert text.
 * If safe, it enforces target="_blank" and rel="noopener noreferrer".
 */
export const SafeLink: React.FC<SafeLinkProps> = ({ href, children, ...props }) => {
  const safety = getEvidenceUrlSafety(href);

  if (!safety.safe) {
    const reasonLabel = getEvidenceUrlRejectionLabel(safety.reason);
    return <span title={`Rejected URL (${reasonLabel}): ${href}`}>[Invalid Link]</span>;
  }

  return (
    <a
      href={safety.normalizedUrl}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
};
