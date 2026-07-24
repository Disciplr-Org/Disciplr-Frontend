/**
 * fixtures/validations.ts
 *
 * Mock seed data for the verifier store (pending validations + history).
 * Extracted verbatim from src/Zustand/Store.ts.
 */

import type { ValidationTask } from "../Zustand/Store";

export const initialPending: ValidationTask[] = [
  {
    id: 'v-101',
    vaultName: 'Q3 Development Fund',
    owner: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    amount: '50,000 USDC',
    deadline: '2026-05-15',
    status: 'pending',
    milestone: 'Beta Release Deployment',
    evidenceUrl: 'https://github.com/example/release-v1',
    criteria: [
      'Deployment URL is live and publicly accessible',
      'All critical bugs from the backlog are resolved',
      'Release notes are published',
    ],
  },
  {
    id: 'v-102',
    vaultName: 'Community Grant #42',
    owner: 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    amount: '10,000 USDC',
    deadline: '2026-05-02',
    status: 'pending',
    milestone: 'Design System Figma Delivery',
    evidenceUrl: 'https://figma.com/example-link',
    criteria: [
      'Figma file is shared with the org',
      'All component pages are complete',
    ],
  }
];

export const initialHistory: ValidationTask[] = [
  {
    id: 'v-099',
    vaultName: 'Audit Bounty',
    owner: 'GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    amount: '5,000 USDC',
    deadline: '2026-04-10',
    status: 'approved',
    milestone: 'Smart Contract Security Audit',
    notes: 'Audit looks solid, all critical issues addressed.',
  }
];
