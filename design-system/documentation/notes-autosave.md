# Validation notes autosave

`ValidationDetail` keeps verifier notes in a task-scoped local draft while a verifier is reviewing a pending validation.

Drafts are stored under `disciplr:validation-notes-draft:<taskId>` and are written with a short debounce so each keystroke does not touch storage immediately. Empty notes remove the stored draft instead of persisting a blank value.

Storage access is wrapped in safe helpers. If localStorage is disabled, full, or unavailable in private browsing, the verifier can still type notes and submit a decision; only draft persistence is skipped.

Drafts are restored when the same validation task is opened again. They are cleared after either approval or rejection is confirmed.
