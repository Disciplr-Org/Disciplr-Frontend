# Validation Detail

The verifier validation detail page lets reviewers inspect a pending milestone,
check criteria, write notes, and approve or reject the task.

## Notes Draft Autosave

- Initial verification notes are saved per validation task in `localStorage`.
- Draft keys use the `validation-notes-draft:<taskId>` namespace.
- Writes are debounced so typing does not write on every keystroke.
- Saved notes are restored when a verifier returns to the same validation task.
- Drafts are cleared after approve or reject is confirmed.
- Storage failures, private-mode restrictions, or quota errors are ignored so
  verification actions continue to work.
