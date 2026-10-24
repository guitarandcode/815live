// Minimal RFC 5545 calendar writer. Times are emitted in UTC ("Z"), which
// every client converts correctly and avoids shipping a VTIMEZONE block.
import { billTitle, coverLabel, endDate, type Show } from './data.ts';
import { chicagoInstant } from './time.ts';

const DEFAULT_HOURS = 3;

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

const utf8 = new TextEncoder();

/** Fold lines longer than 75 octets, never splitting a UTF-8 character. */
function fold(line: string): string {
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const n = utf8.encode(ch).length;
    if (bytes + n > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function calendar(shows: Show[], site: URL, now: Date): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//815live//Listings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:815live: Rockford-area live music',
    'X-WR-TIMEZONE:America/Chicago',
  ];
  for (const show of shows) {
    const start = chicagoInstant(show.date, show.startTime);
    const end = show.endTime
      ? chicagoInstant(endDate(show), show.endTime)
      : new Date(start.getTime() + DEFAULT_HOURS * 3600_000);
    const url = new URL(`/shows/${show.id}`, site).href;
    const v = show.venue.data;
    const desc = [
      show.artists.map((a) => a.data.name).join(', '),
      coverLabel(show.cover) && `Cover: ${coverLabel(show.cover)}`,
      show.notes,
      url,
    ].filter(Boolean);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${show.id}@815live.com`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${escape(`${billTitle(show)} at ${v.name}`)}`,
      `LOCATION:${escape(`${v.name}, ${v.address}, ${v.city}, ${v.state} ${v.zip}`)}`,
      `GEO:${v.lat};${v.lng}`,
      `DESCRIPTION:${escape(desc.join('\n'))}`,
      `URL:${url}`,
      `STATUS:${show.status === 'cancelled' ? 'CANCELLED' : show.status === 'postponed' ? 'TENTATIVE' : 'CONFIRMED'}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
