# Wallet Selection & Network Mismatch Validation Guide

This guide provides commands and procedures to validate the improvements made to wallet selection and network mismatch handling.

## Overview of Changes

### Components Updated
1. **WalletSelectionModal** (`src/components/Wallet/WalletSelectionModal.tsx`)
   - Enhanced error handling with local error state
   - Improved accessibility (ARIA labels, keyboard navigation, screen reader support)
   - Better connection state management with retry counter
   - Defensive error boundaries for unexpected errors
   - Visual improvements with icons and better messaging

2. **NetworkMismatchBanner** (`src/components/NetworkMismatchBanner.tsx`)
   - Enhanced accessibility (ARIA attributes, keyboard dismissal)
   - Improved visual hierarchy with icons
   - Better focus management and touch targets
   - Enhanced messaging about transaction failure risks
   - Keyboard escape handling

### Test Coverage Added
1. **WalletSelectionModal.test.tsx** - Expanded from 11 to 30+ test cases
2. **NetworkMismatchBanner.test.tsx** - Expanded from 3 to 25+ test cases

### Documentation Added
1. **WALLET_COMPONENTS_CONTRACT.md** - Complete API contract and breaking change policy
2. **WALLET_VALIDATION_GUIDE.md** - This validation guide

---

## Validation Commands

### 1. Run Unit Tests

```bash
# Run all tests
npm test

# Run only wallet-related tests
npm test -- WalletSelectionModal
npm test -- NetworkMismatchBanner

# Run with coverage
npm test -- --coverage --coverage.include="src/components/Wallet/WalletSelectionModal.tsx" --coverage.include="src/components/NetworkMismatchBanner.tsx"

# Run in watch mode for development
npm test -- --watch
```

### 2. Type Checking

```bash
# Run TypeScript compiler
npm run type-check
# or
tsc --noEmit
```

### 3. Linting

```bash
# Run ESLint
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### 4. Build Verification

```bash
# Production build
npm run build

# Check for build errors
npm run build -- --mode production
```

---

## Manual Testing Checklist

### WalletSelectionModal

#### Basic Functionality
- [ ] Click "Connect Wallet" button opens modal
- [ ] Clicking Freighter option initiates connection
- [ ] Successful connection closes modal automatically
- [ ] Failed connection keeps modal open with error message
- [ ] Clicking X button closes modal
- [ ] Clicking overlay background closes modal
- [ ] Clicking modal content does NOT close modal

#### Error Handling
- [ ] Connection error displays in red banner with icon
- [ ] After 2+ failed attempts, helpful tip appears
- [ ] Error message is screen-reader accessible
- [ ] Error clears when starting new connection attempt
- [ ] Freighter not installed shows appropriate error
- [ ] Freighter locked shows appropriate error
- [ ] User denies access shows appropriate error

#### Loading States
- [ ] During connection, button shows loading spinner
- [ ] During connection, button text shows "Connecting..."
- [ ] During connection, button is disabled
- [ ] Connected wallet shows "Connected" status
- [ ] Disconnected wallet shows "Available" status

#### Keyboard Accessibility
- [ ] Tab key cycles through interactive elements
- [ ] Enter key on Freighter button initiates connection
- [ ] Space key on Freighter button initiates connection
- [ ] Escape key closes modal
- [ ] Focus visible with outline on all interactive elements
- [ ] Focus trapped within modal (doesn't escape to background)

#### Screen Reader Testing
- [ ] Modal announces "Connect Wallet" heading on open
- [ ] Connection status changes are announced
- [ ] Error messages are announced immediately
- [ ] "Available wallets" group is announced
- [ ] Disabled Albedo option announces "coming soon"
- [ ] External link announces "opens in new tab"

#### Edge Cases
- [ ] Double-clicking Freighter doesn't create duplicate connections
- [ ] Rapid clicking doesn't cause issues
- [ ] Unmounting modal during connection doesn't crash
- [ ] Already connected wallet doesn't prevent modal from working

### NetworkMismatchBanner

#### Basic Functionality
- [ ] Banner shows when wallet on PUBLIC, app expects TESTNET
- [ ] Banner shows when wallet on TESTNET, app expects PUBLIC
- [ ] Banner hidden when networks match
- [ ] Banner hidden when wallet disconnected
- [ ] Banner hidden when network is null/unknown
- [ ] Switching to correct network hides banner immediately

#### Dismissal Behavior
- [ ] Clicking X button dismisses banner
- [ ] Pressing Escape key dismisses banner
- [ ] Dismissed banner stays hidden for same mismatch
- [ ] Banner shows again for new mismatch after resolution
- [ ] Different wallet address shows banner again
- [ ] Dismissal doesn't persist across page reload

#### Content and Messaging
- [ ] Displays correct current network label (Mainnet/Testnet)
- [ ] Displays correct expected network label
- [ ] Warning mentions "transaction failures"
- [ ] Warning mentions "creating or validating vaults"
- [ ] "Switch network" link points to Freighter docs
- [ ] Warning icon appears next to message

#### Keyboard Accessibility
- [ ] Tab key reaches dismiss button
- [ ] Tab key reaches "Switch network" link
- [ ] Enter key on dismiss button closes banner
- [ ] Escape key anywhere in banner dismisses it
- [ ] Focus outline visible on dismiss button
- [ ] Focus outline visible on link

#### Screen Reader Testing
- [ ] Banner announces immediately when appearing (assertive)
- [ ] Alert role is present
- [ ] Message read completely (atomic)
- [ ] Dismiss button labeled "Dismiss network mismatch warning"
- [ ] Link labeled with action and "opens in new tab"
- [ ] Icon marked as decorative (aria-hidden)

#### Touch Target Size
- [ ] Dismiss button at least 44x44px
- [ ] "Switch network" link has adequate padding
- [ ] Touch targets don't overlap

#### Visual Feedback
- [ ] Dismiss button changes background on hover
- [ ] Dismiss button shows focus outline
- [ ] Link is underlined on hover
- [ ] Banner has danger color scheme (red/orange)

---

## Accessibility Testing Tools

### Automated Tools

1. **axe DevTools** (Browser Extension)
   ```
   - Install axe DevTools for Chrome/Firefox
   - Open component in browser
   - Run "Scan All of My Page"
   - Verify 0 violations
   ```

2. **WAVE** (Browser Extension)
   ```
   - Install WAVE extension
   - Open component in browser
   - Check for errors and contrast issues
   - Verify ARIA implementation
   ```

3. **Lighthouse** (Chrome DevTools)
   ```
   - Open DevTools > Lighthouse
   - Select "Accessibility" category
   - Run audit
   - Target: 100 accessibility score
   ```

### Manual Testing

1. **Keyboard Only**
   ```
   - Unplug mouse or disable trackpad
   - Navigate entire flow using only keyboard
   - Tab, Enter, Space, Escape should be sufficient
   - No keyboard traps should exist
   ```

2. **Screen Reader Testing**

   **macOS (VoiceOver):**
   ```bash
   # Enable VoiceOver: Cmd + F5
   # Navigate: VO keys (Control + Option) + arrow keys
   # Interact: VO + Space
   ```

   **Windows (NVDA - Free):**
   ```
   1. Download NVDA from https://www.nvaccess.org/
   2. Install and launch
   3. Navigate with Tab and arrow keys
   4. NVDA will read content automatically
   ```

   **Linux (Orca):**
   ```bash
   sudo apt install orca
   orca --enable speech
   ```

3. **Zoom Testing**
   ```
   - Browser zoom to 200%
   - Verify layout doesn't break
   - Verify text remains readable
   - Verify touch targets remain accessible
   ```

4. **High Contrast Mode**
   ```
   - Windows: Alt + Left Shift + Print Screen
   - Verify component remains visible
   - Verify focus indicators are clear
   ```

---

## Performance Benchmarking

### Component Render Performance

```typescript
// Add to test file for benchmarking
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';

test('WalletSelectionModal renders within performance budget', () => {
  const start = performance.now();
  render(<WalletSelectionModal onClose={() => {}} />);
  const end = performance.now();
  
  expect(end - start).toBeLessThan(50); // 50ms budget
});
```

### Re-render Count

```typescript
// Use React DevTools Profiler
// 1. Open React DevTools
// 2. Switch to Profiler tab
// 3. Click record
// 4. Interact with component
// 5. Stop recording
// 6. Review render count and duration
```

---

## Browser Compatibility Testing

### Target Browsers

Test in the following browsers (latest versions):
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Known Issues

**Safari < 16:**
- `aria-live` regions may have delayed announcements
- Workaround: Screen reader users should enable VoiceOver

**Firefox < 100:**
- Focus-visible polyfill may be needed for older versions
- Workaround: Already handled by CSS reset

---

## Design Tradeoffs

### WalletSelectionModal

**Tradeoff: Error Persistence**
- **Decision:** Errors remain visible until next connection attempt
- **Rationale:** Users need clear feedback on what went wrong
- **Alternative:** Auto-dismiss errors after timeout
- **Risk:** User might miss error message if dismissed too quickly

**Tradeoff: Retry Counter**
- **Decision:** Show helpful tips after 2+ failed attempts
- **Rationale:** Balance between helpful and annoying
- **Alternative:** Show tips immediately
- **Risk:** Could overwhelm first-time users

**Tradeoff: Concurrent Connection Prevention**
- **Decision:** Use ref flag to prevent double-clicks
- **Rationale:** Simple, effective, no external state needed
- **Alternative:** Debounce function
- **Risk:** Slightly more complex, but may be more elegant

### NetworkMismatchBanner

**Tradeoff: Dismissal Scoping**
- **Decision:** Dismissal scoped to address + network combo
- **Rationale:** User might want to dismiss temporarily for testing
- **Alternative:** Never allow dismissal
- **Risk:** Cannot be permanently dismissed (may annoy power users)

**Tradeoff: No Session Persistence**
- **Decision:** Dismissal doesn't persist across page reload
- **Rationale:** Network mismatches are critical, shouldn't be hidden permanently
- **Alternative:** Store in localStorage
- **Risk:** Users might forget about mismatch and lose funds

**Tradeoff: Assertive ARIA Live Region**
- **Decision:** Use `aria-live="assertive"` for immediate announcement
- **Rationale:** Network mismatch is critical, needs immediate attention
- **Alternative:** Use `aria-live="polite"`
- **Risk:** May interrupt screen reader users, but safety is paramount

---

## Remaining Limitations

### WalletSelectionModal

1. **Wallet Provider Support**
   - Currently only Freighter is implemented
   - Albedo marked as "coming soon" but not functional
   - Future: Add WalletConnect, xBull, etc.

2. **Connection Retry Strategy**
   - No exponential backoff for retries
   - User must manually retry
   - Future: Implement automatic retry with backoff

3. **Wallet Availability Detection**
   - Doesn't pre-check if Freighter is installed
   - Error only shown after connection attempt
   - Future: Detect availability and show install link

### NetworkMismatchBanner

1. **Network Switch Automation**
   - Cannot automatically switch networks (Freighter limitation)
   - User must manually switch in extension
   - Future: Deep link if Freighter API supports it

2. **Custom Expected Network UI**
   - No UI to change expected network within app
   - Configured via environment variable
   - Future: Admin setting to change expected network

3. **Multi-Network Support**
   - Only supports TESTNET and PUBLIC
   - No support for custom networks
   - Future: Detect and warn about unknown networks

---

## Pre-Existing CI Failures

Document any pre-existing test or build failures that are NOT related to these changes:

```bash
# Run full test suite before changes
git checkout main
npm test > baseline-test-results.txt

# Run full test suite after changes
git checkout feature-branch
npm test > feature-test-results.txt

# Compare results
diff baseline-test-results.txt feature-test-results.txt
```

If any new failures appear, they must be fixed before merge.

---

## Validation Checklist for Reviewers

### Code Quality
- [ ] All acceptance criteria addressed
- [ ] TypeScript types are correct and strict
- [ ] No `any` types used without justification
- [ ] Error handling is comprehensive
- [ ] Component cleanup is proper (no memory leaks)

### Testing
- [ ] Unit tests cover success paths
- [ ] Unit tests cover failure paths
- [ ] Unit tests cover boundary cases
- [ ] Unit tests cover accessibility requirements
- [ ] All tests pass locally
- [ ] All tests pass in CI

### Documentation
- [ ] Component contract documented
- [ ] Breaking changes clearly marked
- [ ] Migration guide provided
- [ ] Validation guide complete
- [ ] Code comments explain complex logic

### Accessibility
- [ ] WCAG 2.1 AA compliance verified
- [ ] Keyboard navigation works
- [ ] Screen reader testing completed
- [ ] Touch targets meet minimum size
- [ ] Focus indicators visible
- [ ] ARIA attributes correct

### Security
- [ ] No secrets or credentials exposed
- [ ] External links have proper security attributes
- [ ] No XSS vulnerabilities
- [ ] No unsafe network defaults

### Performance
- [ ] No unnecessary re-renders
- [ ] Component renders within budget (<50ms)
- [ ] No memory leaks on unmount
- [ ] No blocking operations

---

## Recommended Staging and Commit

### Files to Stage

```bash
# Stage implementation files
git add src/components/Wallet/WalletSelectionModal.tsx
git add src/components/NetworkMismatchBanner.tsx
git add src/components/Wallet/wallet.css

# Stage test files
git add src/components/Wallet/__tests__/WalletSelectionModal.test.tsx
git add src/components/__tests__/NetworkMismatchBanner.test.tsx

# Stage documentation
git add src/components/Wallet/WALLET_COMPONENTS_CONTRACT.md
git add WALLET_VALIDATION_GUIDE.md
```

### Commit Command

```bash
git commit -m "[#IssueNumber] Improve wallet selection and network mismatch handling

- Enhanced WalletSelectionModal with better error handling and accessibility
- Improved NetworkMismatchBanner with keyboard support and ARIA attributes
- Added comprehensive test coverage (30+ test cases for modal, 25+ for banner)
- Documented component API contract and breaking change policy
- Added validation guide for QA and reviewers

Key improvements:
- Connection state management with retry counter
- Defensive error boundaries for unexpected errors
- Full keyboard navigation (Tab, Enter, Space, Escape)
- Screen reader support with ARIA live regions
- Touch target compliance (44x44px minimum)
- Visual enhancements with icons and better messaging
- Dismissal scoping for network mismatch warnings

Refs #IssueNumber"
```

---

## Post-Merge Monitoring

After merge, monitor for:

1. **User Feedback**
   - Connection success/failure rates
   - Network mismatch dismissal patterns
   - Accessibility complaints

2. **Error Tracking**
   - Connection errors in production
   - Unexpected component crashes
   - Browser compatibility issues

3. **Performance Metrics**
   - Component render times
   - Re-render frequency
   - Memory usage patterns

4. **Usage Analytics**
   - Modal open rate
   - Connection success rate
   - Network mismatch occurrence rate
   - Dismissal vs. action rate

---

## Contact and Support

For questions about this validation guide or the changes:
- Review the component contract: `src/components/Wallet/WALLET_COMPONENTS_CONTRACT.md`
- Check test files for usage examples
- Open an issue with reproduction steps
- Tag reviewers in PR comments
