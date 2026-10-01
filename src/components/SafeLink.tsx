import React from 'react';
import { isSafeEvidenceUrl } from '../utils/url';

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
  if (!isSafeEvidenceUrl(href)) {
    return <span title={`Rejected URL: ${href}`}>[Invalid Link]</span>;
  }

  // Spread caller props first so the enforced safety attributes below cannot
  // be overridden (e.g. a caller passing rel="" or target="_self").
  return (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
};
