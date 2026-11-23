import { HelpArticle } from '../types'

export const exportingDeadlinesCalendarArticle: HelpArticle = {
  slug: 'exporting-deadlines-calendar',
  title: 'Exporting deadlines to your calendar',
  category: 'Vaults',
  summary: 'Sync milestone dates and verification deadlines to Google Calendar, Apple Calendar, or Outlook.',
  keywords: ['export', 'deadlines', 'calendar', 'ics', 'sync', 'reminders', 'schedule'],
  body: `Never miss a commitment deadline by exporting your active vault milestones directly into your preferred calendar application.

### Supported Calendar Formats
Disciplr supports standard iCalendar (.ics) exports compatible with:
- Google Calendar
- Apple Calendar
- Microsoft Outlook
- Any CalDAV-compliant calendar client

### How to Export

#### From the Dashboard (all upcoming milestones)
1. Open the **Dashboard** and locate the **Upcoming Deadlines** panel.
2. Choose your preferred reminder setting from the **Alarm preference** dropdown.
3. Click **Export milestones (.ics)** to download a single \`.ics\` file containing every upcoming pending milestone across your vaults, or **Export all deadlines (.ics)** to include vault deadlines as well.
4. Import the downloaded \`.ics\` file into your calendar client. Re-importing later updates existing events in place without creating duplicates.

#### From a Single Vault
1. Navigate to the specific vault view under \`/vaults/:id\`.
2. Look for the **Export to Calendar** button beside the deadline banner.
3. Download the generated \`.ics\` file and import it into your calendar client.`,
  related: ['creating-a-vault', 'how-verification-works', 'what-happens-on-failure'],
  updatedAt: '2026-11-23',
}
