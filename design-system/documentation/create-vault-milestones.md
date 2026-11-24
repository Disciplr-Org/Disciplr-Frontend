# Create Vault Milestones

The Create Vault form accepts one or more milestone rows. Each row contains:

- `title`: a short label shown in the review step and later milestone surfaces.
- `criteria`: the validation requirement the verifier should check.

## Validation

At least one milestone is required. Every row must have a non-empty title and
non-empty criteria. Titles are compared case-insensitively after trimming, so
duplicate titles are blocked before review.

When validation fails, the form summary lists all milestone errors and focus
moves to the first invalid milestone field after the core vault fields pass.

## Editing

Creators can add rows, remove rows, and reorder rows with the row controls.
Removing the final row is allowed so the required-row validation path remains
visible and testable.

## Review

The review step lists milestones in the submitted order with each title and its
criteria. The legacy single-milestone review prop still renders as a one-row
milestone list for compatibility with older callers.
