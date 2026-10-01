# Address Validation

To prevent malformed or attacker-controlled values from being rendered as explorer links, the `AddressDisplay` component and explorer URL builders validate Stellar addresses (account IDs and contract IDs) before rendering links.

## Format Requirements

A valid Stellar address must:
1. Be exactly 56 characters long.
2. Start with `G` (for accounts) or `C` (for contracts).
3. Be composed entirely of valid uppercase base32 characters (`A-Z` and `2-7`).

## Implementation

- Validation utility: `src/utils/stellarAddress.ts`
- Guarded explorer helpers: `src/utils/explorer.ts` (`contractExplorerUrl`, `getExplorerAccountUrl`)
- Visual display and guarding: `src/components/AddressDisplay.tsx`

Invalid addresses are visually marked with a line-through styling and warning `aria-label`s, and explorer links for them are hidden. However, users can still copy the verbatim invalid string if they need to debug it.
