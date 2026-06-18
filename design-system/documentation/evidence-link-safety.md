# Evidence Link Safety

Verifier surfaces that render externally provided evidence URLs must treat the URL as untrusted input.

Rules:

- Accept only `http:` and `https:` URLs.
- Reject scheme-relative, relative, or whitespace-padded URLs.
- Render rejected URLs as inert text with a clear rejection label.
- External links must open with `target="_blank"` and `rel="noopener noreferrer"`.

Shared components:

- `src/utils/evidenceUrl.ts` exposes `isSafeEvidenceUrl()`.
- `src/components/SafeLink.tsx` renders safe external anchors and rejected inert text.

Current call sites:

- `src/pages/ValidationDetail.tsx`
- `src/components/ConfirmationModal.tsx`
