/**
 * fixtures/dashboard.ts
 *
 * Mock seed data for the Dashboard page (summary cards, recent activity feed,
 * upcoming deadlines and the success-rate sparkline). Extracted verbatim from
 * Dashboard.tsx so the values render identically.
 */

import type {
  DashboardSummary,
  Activity,
  Deadline,
} from "../utils/dashboard";

/** A single bar in the Dashboard success-rate sparkline. */
export interface ChartDatum {
  month: string;
  rate: number;
}

export const SUMMARY: DashboardSummary = {
  totalLocked: 25500,
  activeVaults: 3,
  pendingMilestones: 2,
  completionRate: 67,
};

export const ACTIVITY: Activity[] = [
  {
    id: "a1",
    type: "validated",
    vault: "Alpha Vault",
    timestamp: "2024-04-28T14:30:00Z",
  },
  {
    id: "a2",
    type: "created",
    vault: "Gamma Fund",
    timestamp: "2024-04-27T09:00:00Z",
    amount: 4200,
  },
  {
    id: "a3",
    type: "released",
    vault: "Delta Safe",
    timestamp: "2024-04-25T16:45:00Z",
    amount: 15000,
  },
  {
    id: "a4",
    type: "redirected",
    vault: "Epsilon Pool",
    timestamp: "2024-04-24T11:20:00Z",
    amount: 3300,
  },
];

export const DEADLINES: Deadline[] = [
  {
    id: "2",
    name: "Beta Reserve",
    deadline: "2024-05-20T10:00:00Z",
    amount: 8800,
  },
  {
    id: "1",
    name: "Alpha Vault",
    deadline: "2024-07-15T10:00:00Z",
    amount: 12500,
  },
];

export const CHART_DATA: ChartDatum[] = [
  { month: "Nov", rate: 50 },
  { month: "Dec", rate: 60 },
  { month: "Jan", rate: 55 },
  { month: "Feb", rate: 75 },
  { month: "Mar", rate: 70 },
  { month: "Apr", rate: 67 },
];
