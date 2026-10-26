// All dates and times on 815live are America/Chicago wall-clock values.
// Show data stores a local date ('YYYY-MM-DD') and time ('HH:MM'); these
// helpers turn them into real instants and never consult the host's or the
// visitor's timezone. Cloudflare builds run in UTC, so this matters.

export const TZ = 'America/Chicago';

const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function chicagoFields(instant: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(instant).map((x) => [x.type, x.value]));
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    h: Number(p.hour),
    min: Number(p.minute),
    s: Number(p.second),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Calendar date in Chicago for an instant, as 'YYYY-MM-DD'. */
export function chicagoDate(instant: Date = new Date()): string {
  const f = chicagoFields(instant);
  return `${f.y}-${pad(f.m)}-${pad(f.d)}`;
}

/** Hour of the day (0–23) in Chicago for an instant. */
export const chicagoHour = (instant: Date) => chicagoFields(instant).h;

/** Minutes east of UTC that Chicago is at this instant (-300 CDT, -360 CST). */
export function chicagoOffsetMinutes(instant: Date): number {
  const f = chicagoFields(instant);
  const asUtc = Date.UTC(f.y, f.m - 1, f.d, f.h, f.min, f.s);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
}

function parseDate(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return { y, m, d };
}

/** The instant a Chicago wall-clock date/time occurs. */
export function chicagoInstant(date: string, time = '00:00'): Date {
  const { y, m, d } = parseDate(date);
  const [h, min] = time.split(':').map(Number);
  const naive = Date.UTC(y, m - 1, d, h, min);
  // Two passes settle the offset correctly on DST transition days.
  let guess = naive - chicagoOffsetMinutes(new Date(naive)) * 60000;
  guess = naive - chicagoOffsetMinutes(new Date(guess)) * 60000;
  return new Date(guess);
}

/** ISO 8601 with the Chicago offset, e.g. 2026-10-24T21:00:00-05:00. */
export function chicagoIso(date: string, time = '00:00'): string {
  const off = chicagoOffsetMinutes(chicagoInstant(date, time));
  const sign = off <= 0 ? '-' : '+';
  const abs = Math.abs(off);
  return `${date}T${time}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** Pure calendar math on 'YYYY-MM-DD' strings. */
export function addDays(date: string, days: number): string {
  const { y, m, d } = parseDate(date);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekday(date: string): number {
  const { y, m, d } = parseDate(date);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * The Fri–Sun weekend that "this weekend" means on a given Chicago date:
 * the current one from Friday through Sunday, otherwise the next one.
 */
export function weekendRange(today: string): { start: string; end: string } {
  const wd = weekday(today);
  const friday = addDays(today, wd === 0 ? -2 : 5 - wd);
  return { start: friday, end: addDays(friday, 2) };
}

// Display formatting. Dates are formatted as UTC midnight so the calendar
// day never shifts; that is a formatting trick, not a timezone choice.
const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' });
const mediumDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'short', day: 'numeric' });
const monthDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
const shortDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });

const utcMidnight = (date: string) => {
  const { y, m, d } = parseDate(date);
  return new Date(Date.UTC(y, m - 1, d));
};

export const formatDay = (date: string) => dayFmt.format(utcMidnight(date));
/** 'Wednesday, Oct 28' */
export const formatMediumDay = (date: string) => mediumDayFmt.format(utcMidnight(date));
export const formatShortDay = (date: string) => shortDayFmt.format(utcMidnight(date));
/** 'Oct 28' */
export const formatMonthDay = (date: string) => monthDayFmt.format(utcMidnight(date));

/** '19:30' -> '7:30 PM', '21:00' -> '9 PM'. */
export function formatTime(time: string): string {
  const [h, min] = time.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${min ? `:${pad(min)}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
}

/** '19:00'–'23:00' -> '7–11 PM'; '11:00'–'14:00' -> '11 AM–2 PM'. */
export function formatTimeRange(start: string, end?: string): string {
  if (!end) return formatTime(start);
  const [a, b] = [formatTime(start), formatTime(end)];
  const [aTime, aMer] = a.split(' ');
  return aMer === b.split(' ')[1] ? `${aTime}–${b}` : `${a}–${b}`;
}

const stampFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/** 'Oct 24, 2026, 3:15 PM CT' */
export const formatStamp = (instant: Date) => `${stampFmt.format(instant)} CT`;
