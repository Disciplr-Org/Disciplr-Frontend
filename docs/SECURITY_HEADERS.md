# Security headers

Disciplr currently ships the CSP as
`Content-Security-Policy-Report-Only` from `vercel.json`. Report-only rollout
lets the deployment collect violations while the wallet, vault creation,
lazy-loaded Analytics, and PDF export flows are exercised before enforcement.

The policy allows:

- same-origin documents and the external `public/theme-boot.js` script
- Horizon testnet and public endpoints plus the production API in `connect-src`
- same-origin and data URLs for images
- inline styles, which remain a known compromise because the application uses
  existing inline `style` attributes extensively
- no framing (`frame-ancestors 'none'`) and no plugin content (`object-src` is
  omitted because the default is same-origin and the app does not embed plugins)
- only same-origin scripts; Freighter is an extension API and does not require
  an external script origin in this policy

When a new browser origin is introduced, add its origin to the narrowest
directive that needs it, exercise the affected flow on a preview, and confirm
the browser console reports no unexpected violations. Once the preview logs
are clean, change the header name to `Content-Security-Policy` in a follow-up
and keep this document synchronized.
