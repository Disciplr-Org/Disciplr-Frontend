# Deadline calendar export

Vault deadline calendar exports are generated with `src/utils/ics.ts`.

The utility builds a single-event `VCALENDAR` string with CRLF endings, folded lines, escaped iCalendar text values, and UTC timestamps. Invalid deadline values are guarded before download so the UI does not create malformed calendar files.

`VaultDetail` exports the current vault deadline. `UpcomingDeadlines` exports each listed deadline and disables the action for invalid dates.

Downloads use the same hidden anchor and Blob URL lifecycle as the CSV export helper, including `URL.revokeObjectURL` cleanup after the synthetic click.
