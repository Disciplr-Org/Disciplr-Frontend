export interface IcsEventInput {
  title: string;
  deadline: string;
  description?: string;
  uid: string;
}

const CRLF = '\r\n';
const DEFAULT_DURATION = 'PT30M';
const PROD_ID = '-//Disciplr//Vault Deadline//EN';

function isValidDate(date: Date): boolean {
  return Number.isFinite(date.getTime());
}

export function isValidIcsDeadline(deadline: string): boolean {
  return isValidDate(new Date(deadline));
}

function formatIcsDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    'T',
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    'Z',
  ].join('');
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function byteLength(value: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }

  return value.length;
}

export function foldIcsLine(line: string): string {
  const lines: string[] = [];
  let remaining = line;

  while (byteLength(remaining) > 75) {
    let splitAt = 0;
    let bytes = 0;

    for (const char of remaining) {
      const nextBytes = bytes + byteLength(char);
      if (nextBytes > 75) break;
      bytes = nextBytes;
      splitAt += char.length;
    }

    if (splitAt === 0) break;

    lines.push(remaining.slice(0, splitAt));
    remaining = ` ${remaining.slice(splitAt)}`;
  }

  lines.push(remaining);
  return lines.join(CRLF);
}

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function icsFilename(title: string, uid: string): string {
  const base = sanitizeFilenamePart(title) || sanitizeFilenamePart(uid) || 'vault-deadline';
  return `${base}.ics`;
}

export function buildIcsEvent({ title, deadline, description = '', uid }: IcsEventInput): string {
  const deadlineDate = new Date(deadline);
  if (!isValidDate(deadlineDate)) {
    throw new Error('Cannot build calendar event for an invalid deadline.');
  }

  const timestamp = formatIcsDate(deadlineDate);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PROD_ID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${timestamp}`,
    `DURATION:${DEFAULT_DURATION}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return `${lines.map(foldIcsLine).join(CRLF)}${CRLF}`;
}

export function downloadIcs(calendar: string, filename: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;

  const blob = new Blob([calendar], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadIcsEvent(input: IcsEventInput): boolean {
  if (!isValidIcsDeadline(input.deadline)) return false;

  downloadIcs(buildIcsEvent(input), icsFilename(input.title, input.uid));
  return true;
}
