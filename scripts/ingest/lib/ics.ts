// Just enough iCalendar (RFC 5545) for event feeds: unfolded lines, unescaped
// text, and DTSTART/DTEND turned into Chicago wall-clock date and time.
import { chicagoDate, TZ } from '../../../src/lib/time.ts';

export interface IcsEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  url?: string;
  status?: string;
  lastModified?: string;
  /** Chicago date and HH:MM. */
  start: { date: string; time: string };
  end?: { date: string; time: string };
}

const unescape = (s: string) => s.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1').trim();

const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** A DTSTART/DTEND value as Chicago wall-clock time. Only UTC and America/Chicago (or floating) times are accepted. */
export function icsTime(params: string, value: string): { date: string; time: string } {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) throw new Error(`unreadable time "${value}"`);
  const [, y, mo, d, h = '00', mi = '00', s = '00', z] = m;
  if (z) {
    const instant = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
    return { date: chicagoDate(instant), time: timeFmt.format(instant) };
  }
  const tzid = params.match(/TZID=([^;:]+)/)?.[1];
  if (tzid && tzid !== TZ) throw new Error(`unsupported TZID ${tzid}`);
  return { date: `${y}-${mo}-${d}`, time: `${h}:${mi}` };
}

export function parseIcs(text: string): IcsEvent[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  const events: IcsEvent[] = [];
  let cur: Map<string, [params: string, value: string]> | undefined;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') cur = new Map();
    else if (line === 'END:VEVENT' && cur) {
      const get = (k: string) => (cur!.has(k) ? unescape(cur!.get(k)![1]) : undefined);
      const start = cur.get('DTSTART');
      if (!start) throw new Error(`event ${get('UID')} has no DTSTART`);
      const end = cur.get('DTEND');
      events.push({
        uid: get('UID') ?? '',
        summary: get('SUMMARY') ?? '',
        description: get('DESCRIPTION'),
        location: get('LOCATION'),
        url: get('URL'),
        status: get('STATUS'),
        lastModified: get('LAST-MODIFIED'),
        start: icsTime(...start),
        ...(end && { end: icsTime(...end) }),
      });
      cur = undefined;
    } else if (cur) {
      const i = line.indexOf(':');
      if (i < 0) continue;
      const [name, ...params] = line.slice(0, i).split(';');
      if (!cur.has(name)) cur.set(name, [params.join(';'), line.slice(i + 1)]);
    }
  }
  return events;
}
