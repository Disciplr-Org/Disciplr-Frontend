# Wallet Components API Contract

This document defines the public API, behavior guarantees, and breaking change policy for wallet-related components.

## WalletSelectionModal

### Purpose
Provides a consistent wallet connection interface for users to select and connect their Stellar wallet.

### Props

```typescript
interface WalletSelectionModalProps {
  onClose: () => void;  // Required callback invoked on successful connection or user dismissal
}
```

### Behavior Invariants

**Connection Flow:**
- Only one connection attempt can be in flight at a time (concurrent attempts are prevented)
- Modal closes automatically ONLY on successful wallet connection
- Modal remains open on connection failure to allow user retry
- Component cleans up pending operations on unmount

**Error Handling:**
- Error state is preserved until next connection attempt
- Context errors take precedence over local errors
- Failed connections do NOT invoke `onClose`
- Helpful retry guidance shown after multiple failed attempts

**State Management:**
- Component respects `isConnecting` state from WalletContext
- Mounted state is tracked to prevent state updates after unmount
- Connection pending flag prevents double-click issues

### Accessibility Guarantees

- Modal is properly labeled with `aria-labelledby` pointing to title
- Focus is trapped within modal during interaction
- Full keyboard navigation support (Tab, Enter, Space, Escape)
- Screen reader announcements for connection state changes via `aria-live` regions
- Error messages announced immediately with `aria-live="assertive"`
- Disabled wallet options clearly marked with `aria-disabled`
- All interactive elements meet WCAG 2.1 AA touch target size (44x44px minimum)
- Decorative icons hidden from screen readers with `aria-hidden="true"`

### Consumer Expectations

**When to use:**
```typescript
// User clicks "Connect Wallet" button
<WalletSelectionModal onClose={() => setShowModal(false)} />
```

**Error handling:**
Errors are displayed within the modal automatically. Consumers should NOT:
- Show external error toasts/messages
- Manually close modal on connection failure
- Retry connection outside of the modal

**Breaking changes:**
The following are considered breaking changes and will require a major version bump:
- Removing or renaming the `onClose` prop
- Changing when `onClose` is invoked (e.g., calling it on failed connection)
- Removing keyboard support for wallet selection
- Changing the component to uncontrolled (auto-showing without parent control)

**Safe changes:**
The following are NOT breaking changes:
- Adding new wallet providers to the list
- Improving error messages
- Adding new optional props
- Enhancing visual styling
- Improving accessibility beyond current guarantees

---

## NetworkMismatchBanner

### Purpose
Alerts users when their connected wallet is on a different network than the application expects, preventing transaction errors and potential fund loss.

### Props

```typescript
interface NetworkMismatchBannerProps {
  expectedNetwork?: WalletNetwork;  // Optional, defaults to APP_EXPECTED_NETWORK
}
```

### Behavior Invariants

**Visibility Rules:**
- Banner ONLY shows when wallet is connected AND network mismatches
- Banner hides immediately when mismatch is resolved
- Banner NEVER shows for disconnected wallets
- Banner NEVER shows when network is null/unknown

**Dismissal Behavior:**
- Dismissal is scoped to specific mismatch (address + wallet network + expected network combination)
- New mismatches always show banner even if previous mismatch was dismissed
- Dismissal state is cleared when mismatch resolves (not persisted across sessions)
- Different wallet addresses with same network mismatch show banner again

**State Management:**
- Component re-checks mismatch on every address/network change
- Dismissal state updates immediately on user interaction
- No external state management required by consumers

### Accessibility Guarantees

- Uses `role="alert"` for immediate screen reader announcement
- Alert has `aria-live="assertive"` for critical network warnings
- Alert has `aria-atomic="true"` for complete message reading
- Links clearly labeled for screen readers with action context
- External links properly marked with "(opens in new tab)" in labels
- Touch targets meet WCAG 2.1 AA minimum size (44x44px)
- Keyboard dismissal supported (Escape key)
- Focus and hover states clearly visible
- Reduced motion respected for animations (via prefers-reduced-motion media query)

### Consumer Expectations

**When to use:**
```typescript
// At app layout level, checks current wallet against expected network
<NetworkMismatchBanner />

// Or with custom expected network
<NetworkMismatchBanner expectedNetwork="PUBLIC" />
```

**Position in UI:**
Should be placed prominently near the top of the page, above primary content but below any critical navigation. Common placements:
- Below header/navigation
- Above main content area
- Within a page layout wrapper

**Multiple instances:**
Avoid rendering multiple instances of this component with different `expectedNetwork` values, as this creates conflicting guidance for users.

**Breaking changes:**
The following are considered breaking changes and will require a major version bump:
- Changing visibility logic (when banner shows/hides)
- Changing dismissal scoping (making it persist across sessions, for example)
- Removing keyboard dismissal support
- Changing the default for `expectedNetwork` prop

**Safe changes:**
The following are NOT breaking changes:
- Improving warning message text
- Enhancing visual styling
- Adding animation/transition effects
- Improving accessibility beyond current guarantees
- Adding optional props for customization (links, styling, etc.)

---

## WalletContext Integration

Both components depend on `WalletContext` and expect the following contract:

### Required Context Values

```typescript
interface WalletContextType {
  address: string | null;           // Current connected wallet address
  network: WalletNetwork | null;    // Current wallet network ('TESTNET' | 'PUBLIC')
  isConnecting: boolean;            // Connection in progress flag
  error: string | null;             // Connection error message
  connect: () => Promise<boolean>;  // Initiate wallet connection, returns success
}
```

### Context Behavior Requirements

- `connect()` must return `true` on successful connection, `false` otherwise
- `connect()` must set `error` state on failure
- `isConnecting` must be `true` during connection attempts
- `address` must be set only when wallet is successfully connected
- `network` must reflect the actual wallet network, not the expected network

---

## Testing Requirements

### WalletSelectionModal Tests

**Required Coverage:**
- ✅ Successful connection flow (click, Enter key, Space key)
- ✅ Failed connection with error display
- ✅ Multiple retry attempts with helpful guidance
- ✅ Concurrent connection prevention (double-click)
- ✅ Loading state during connection
- ✅ Connected state display
- ✅ Modal dismissal (click X, click overlay, NOT on failed connection)
- ✅ Cleanup on unmount (no `onClose` call if unmounted during connection)
- ✅ Accessibility: ARIA labels, roles, live regions, keyboard navigation
- ✅ Screen reader text for status changes

### NetworkMismatchBanner Tests

**Required Coverage:**
- ✅ Visibility for various wallet/network combinations
- ✅ Hidden when networks match
- ✅ Hidden when wallet disconnected
- ✅ Dismissal behavior (click, Escape key)
- ✅ Dismissal scoping to specific mismatch
- ✅ Re-showing for new mismatches after dismissal
- ✅ Different address with same mismatch shows banner
- ✅ Rapid network changes handled correctly
- ✅ Network label display (TESTNET/PUBLIC → Testnet/Mainnet)
- ✅ Accessibility: alert role, ARIA attributes, touch targets, focus states

---

## Migration Guide

### From Previous Implementation

If you're migrating from an earlier version without these guarantees:

**WalletSelectionModal:**
1. Ensure you're not manually closing the modal on connection errors
2. Remove any external error display logic (now handled internally)
3. Verify keyboard navigation works in your integration

**NetworkMismatchBanner:**
1. Remove any manual mismatch detection logic
2. Ensure banner is placed prominently in your layout
3. Avoid multiple instances with conflicting expected networks

### Version Compatibility

- **Current version:** 1.0.0 (established with this contract)
- **Breaking changes:** Will increment major version (2.0.0, 3.0.0, etc.)
- **Safe enhancements:** Will increment minor version (1.1.0, 1.2.0, etc.)

---

## Security Considerations

### WalletSelectionModal

- Never stores wallet credentials or private keys
- Uses Freighter API which handles all sensitive operations in browser extension
- Connection state is ephemeral (not persisted across sessions by modal itself)
- External links use `rel="noopener noreferrer"` for security

### NetworkMismatchBanner

- No sensitive data displayed (only network names)
- Dismissal state is client-side only (no server persistence)
- External links to documentation use secure attributes
- No transaction capabilities (purely informational)

---

## Performance Considerations

### WalletSelectionModal

- Lightweight component, no heavy computations
- Connection attempt uses async/await with proper cleanup
- Modal portal rendering is delegated to Modal component
- No polling or interval timers

### NetworkMismatchBanner

- Memo-ized mismatch key prevents unnecessary re-renders
- No network calls (uses context state only)
- Minimal re-render surface (only updates on address/network changes)
- No DOM measurements or layout thrashing

---

## Future Enhancements (Non-Breaking)

Potential improvements that maintain backward compatibility:

### WalletSelectionModal
- Add support for additional wallet providers (Albedo, WalletConnect, etc.)
- Connection retry with exponential backoff
- "Remember my choice" preference
- Wallet provider availability detection

### NetworkMismatchBanner
- Persistent dismissal across sessions (opt-in)
- Custom action callbacks
- Animation preferences
- Network switch deep linking (if wallet supports it)

---

## Support and Feedback

For issues, questions, or suggestions regarding these components:
1. Check this contract for expected behavior
2. Review test coverage for usage examples
3. Open an issue with reproduction steps
4. Reference this contract in PRs that may affect component behavior
