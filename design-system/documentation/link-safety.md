# Link Safety Policy

All external URLs provided by users (such as `evidenceUrl` in validation tasks) must be sanitized before being rendered to verifiers.

## Policy
1.  **Strict Scheme Allowlist:** Only `http:` and `https:` schemes are permitted. All others (e.g., `javascript:`, `data:`, `file:`) are rejected.
2.  **No Embedded Credentials:** URLs with `username` or `password` userinfo before `@` are rejected because they can hide the real destination host.
3.  **No Ambiguous Hosts:** Punycode/IDN hosts (`xn--` labels) and IP-literal hosts are rejected. Evidence links should use clear domain names that verifiers can inspect without Unicode or address-encoding ambiguity.
4.  **Default Ports Only:** Explicit non-default ports are rejected. Default `http:80` and `https:443` normalize as safe; unusual ports are treated as ambiguous evidence destinations.
5.  **Safe Attributes:** Any rendered external link MUST include `target="_blank"` and `rel="noopener noreferrer"` to prevent security vulnerabilities like reverse tabnabbing.
6.  **Inert Fallback:** If a URL fails sanitization, it must be rendered as inert text (`[Invalid Link]`) with an optional `title` attribute explaining the rejection.

## Implementation
Use the `isSafeEvidenceUrl` utility from `src/utils/url.ts` for boolean checks, `getEvidenceUrlSafety` when the UI needs a rejection reason, and the `SafeLink` component from `src/components/SafeLink.tsx` to render evidence links.

## Threat Model
Evidence URLs are externally sourced and shown to verifiers as clickable links. The URL layer rejects inputs that can mislead the verifier about the real destination: non-web schemes, userinfo, IDN/punycode hostnames, IP literals, and non-default ports. Punycode/IDN hosts are rejected rather than warning-only because the UI cannot reliably prove the visual hostname is safe for every verifier locale and font.
