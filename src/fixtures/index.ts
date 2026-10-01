/**
 * fixtures/index.ts
 *
 * Barrel for the centralized mock/fixture data seam. All page mock data lives
 * under `src/fixtures/` and is consumed by services, stores and components so
 * that swapping in real backends touches only the data layer.
 *
 * See docs/VAULT_DATA_LAYER.md for the vault/transaction service seam.
 */

export * from "./vaults";
export * from "./transactions";
export * from "./dashboard";
export * from "./validations";
