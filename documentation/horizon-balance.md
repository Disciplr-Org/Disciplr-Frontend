# Horizon balance response contract

The frontend reads Stellar account balances from Horizon through the USDC balance helper.

## Validation rules

- A successful response must include a `balances` array.
- The `balances` array is capped at 100 entries. Responses larger than this are rejected with `INVALID_RESPONSE`.
- The helper scans only the accepted entries to find a matching USDC trustline for the configured issuer.
- `404` responses continue to map to `ACCOUNT_NOT_FOUND`, and non-OK responses continue to map to `REQUEST_FAILED`.
