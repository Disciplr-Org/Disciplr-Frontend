# VerifierMetrics Panel

Documentation for the `VerifierMetrics` component and its underlying
`computeVerifierMetrics` utility.

---

## Overview

`VerifierMetrics` is a read-only summary panel displayed at the top of
`VerifierDashboard`. It computes four key metrics from the Zustand verifier
store and presents them as accent-bordered cards.

---

## Metrics Reference

### 1. Approval Rate

| Field | Detail |
|-------|--------|
| **Label** | Approval Rate |
| **Formula** | `(approvedCount / totalResolved) × 100` |
| **Unit** | Percentage (0–100), displayed rounded to nearest integer |
| **Accent color** | `var(--success)` |
| **Source field** | `validationHistory[].status === 'approved'` |

**Edge case — zero-division guard**:  
When `validationHistory.length === 0`, the result is **exactly `0`**, never
`NaN`. This is enforced with an explicit guard:

```ts
approvalRate = totalResolved === 0 ? 0 : (approvedCount / totalResolved) * 100;
```

**Example values**:
- 0 records → `0%`
- 3 approved, 0 rejected → `100%`
- 2 approved, 1 rejected → `67%` (rounds from 66.666…)

---

### 2. Overdue

| Field | Detail |
|-------|--------|
| **Label** | Overdue |
| **Formula** | Count of `pendingValidations` where `daysRemaining <= 0` |
| **Unit** | Integer count |
| **Accent color** | `var(--danger)` |
| **Source field** | `pendingValidations[].daysRemaining` |

**Edge cases**:
- `daysRemaining === 0` → **overdue** (not urgent; the two categories are
  mutually exclusive)
- `daysRemaining < 0` → overdue
- Empty `pendingValidations` → `0`

**Example values**:
- Task with `daysRemaining: 0` → counted as overdue
- Task with `daysRemaining: -3` → counted as overdue
- Task with `daysRemaining: 1` → **not** overdue (counted as urgent instead)

---

### 3. Urgent

| Field | Detail |
|-------|--------|
| **Label** | Urgent |
| **Formula** | Count of `pendingValidations` where `0 < daysRemaining <= 3` |
| **Unit** | Integer count |
| **Accent color** | `var(--warning)` |
| **Source field** | `pendingValidations[].daysRemaining` |

**Edge cases**:
- `daysRemaining === 0` → **not urgent** (counted as overdue — mutually exclusive)
- `daysRemaining === 3` → urgent (upper boundary is inclusive)
- `daysRemaining === 4` → neither urgent nor overdue
- Empty `pendingValidations` → `0`

**Example values**:
- Task with `daysRemaining: 1` → urgent
- Task with `daysRemaining: 3` → urgent
- Task with `daysRemaining: 4` → 0 contribution

---

### 4. Total Resolved

| Field | Detail |
|-------|--------|
| **Label** | Total Resolved |
| **Formula** | `validationHistory.length` |
| **Unit** | Integer count |
| **Accent color** | `var(--accent)` |
| **Source field** | `validationHistory` array length |

**Edge case**:
- Empty history → `0`

**Example values**:
- 5 history entries (mix of approved/rejected) → `5`

---

## Overdue vs. Urgent — Mutual Exclusivity

A task can only belong to one category:

```
daysRemaining <= 0   →  OVERDUE  (never urgent)
0 < daysRemaining <= 3  →  URGENT   (never overdue)
daysRemaining > 3    →  neither
```

The boundary value `daysRemaining === 0` is assigned to **overdue** exclusively.

---

## Store Field Names

This component reads directly from `useVerifierStore` (Zustand). The real
field names are:

| Store array | Field for countdown | Field for status |
|---|---|---|
| `pendingValidations` | `daysRemaining: number` | `status: 'pending'` |
| `validationHistory` | `daysRemaining: number` | `status: 'approved' \| 'rejected'` |

> Note: The store also has a `deadline: string` (ISO date) field, but
> `VerifierMetrics` uses only `daysRemaining` for overdue/urgent logic.

---

## Accessibility

Each card renders with an `aria-label` that includes the metric name and
current value:

```
aria-label="Approval rate: 67 percent"
aria-label="Overdue: 1"
aria-label="Urgent: 2"
aria-label="Total resolved: 5"
```

The parent `<section>` has `aria-label="Verifier performance metrics"`.

---

## Theme Compatibility

All colors are CSS variable tokens — no hardcoded hex values. The panel
renders correctly in both light and dark themes.

| Token | Usage |
|-------|-------|
| `var(--bg)` | Card background |
| `var(--border)` | Card border |
| `var(--text)` | Metric value text |
| `var(--muted)` | Metric label text |
| `var(--success)` | Approval rate accent |
| `var(--danger)` | Overdue accent |
| `var(--warning)` | Urgent accent |
| `var(--accent)` | Total Resolved accent |
