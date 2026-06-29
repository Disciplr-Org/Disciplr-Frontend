# Link Safety Policy

All external URLs provided by users (such as `evidenceUrl` in validation tasks) must be sanitized before being rendered to verifiers.

## Policy
1.  **Strict Scheme Allowlist:** Only `http:` and `https:` schemes are permitted. All others (e.g., `javascript:`, `data:`, `file:`) are rejected.
2.  **Reject Credentials:** URLs containing userinfo (username or password), whether raw or percent-encoded (e.g., `https://user:pass@host` or `https://%61:%62@host`), are rejected to avoid credential/phishing vectors.
3.  **Control Characters:** Reject raw control characters (including newlines and tabs) embedded in a URL after trimming; percent-encoded control bytes (e.g., `%0A`) are allowed.
4.  **Safe Attributes:** Any rendered external link MUST include `target="_blank"` and `rel="noopener noreferrer"` to prevent security vulnerabilities like reverse tabnabbing.
5.  **Inert Fallback:** If a URL fails sanitization, it must be rendered as inert text (`[Invalid Link]`) with an optional `title` attribute explaining the rejection.

## Implementation
Use the `isSafeEvidenceUrl` utility from `src/utils/url.ts` to validate links, and the `SafeLink` component from `src/components/SafeLink.tsx` to render them.
