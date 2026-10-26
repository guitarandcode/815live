// Pure show-list logic, kept free of astro:content so it can be unit-tested.
import { addDays, chicagoDate, chicagoHour, weekday, weekendRange } from './time.ts';

interface Dated {
  date: string;
  startTime: string;
}

/**
 * The instant the build treats as "now". BUILD_NOW (any Date-parsable
 * string) overrides it for testing, e.g. BUILD_NOW=2026-10-24T23:00:00Z.
 */
export function buildNow(): Date {
  const override = process.env.BUILD_NOW;
  const now = override ? new Date(override) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`Invalid BUILD_NOW: ${override}`);
  return now;
}

export const byStart = (a: Dated, b: Dated) =>
  a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);

/** Shows on or after today's Chicago date, soonest first. Tonight's shows stay listed until midnight CT. */
export function upcoming<T extends Dated>(shows: T[], now: Date): T[] {
  const today = chicagoDate(now);
  return shows.filter((s) => s.date >= today).sort(byStart);
}

/** Upcoming shows that fall in this (or the next) Fri–Sun weekend, by Chicago date. */
export function thisWeekend<T extends Dated>(shows: T[], now: Date): T[] {
  const { start, end } = weekendRange(chicagoDate(now));
  return upcoming(shows, now).filter((s) => s.date >= start && s.date <= end);
}

/** Days ahead (from today, inclusive) that recurring listings appear in dated lists. */
export const RECURRING_LIST_DAYS = 7;

/**
 * The dated list for the home and category pages: upcoming one-offs, plus
 * recurring instances only within the next RECURRING_LIST_DAYS days. The
 * rest of the recurring instances still get pages, iCal and JSON-LD.
 */
export function listing<T extends Dated & { recurring?: string }>(shows: T[], now: Date): T[] {
  const cutoff = addDays(chicagoDate(now), RECURRING_LIST_DAYS);
  return upcoming(shows, now).filter((s) => !s.recurring || s.date < cutoff);
}

/**
 * A night out runs until 4 AM: a show starting before then belongs to the
 * previous date's night. Base.astro's inline script applies the same rule.
 */
export const NIGHT_ENDS = '04:00';
export const nightOf = (s: Dated) => (s.startTime < NIGHT_ENDS ? addDays(s.date, -1) : s.date);

/**
 * How the build labels its own calendar day. Browsers relabel on load
 * ('Tonight' from 5 PM until 4 AM); the build keeps to its calendar date
 * because the daily build runs around 3 AM and is read all day.
 */
export const dayPart = (now: Date): 'Today' | 'Tonight' => (chicagoHour(now) >= 17 ? 'Tonight' : 'Today');

/**
 * The home page's second section after a given night: tomorrow through
 * Sunday, or the next 7 days on Saturday and Sunday so it never shows a
 * single day. index.astro's inline script repeats this.
 */
export function laterWindow(night: string): { start: string; end: string; label: string } {
  const wd = weekday(night);
  const weekend = wd === 0 || wd === 6;
  return {
    start: addDays(night, 1),
    end: addDays(night, weekend ? 7 : 7 - wd),
    label: weekend ? 'Next 7 days' : 'Later this week',
  };
}

export function groupByNight<T extends Dated>(shows: T[]): { date: string; shows: T[] }[] {
  const nights = new Map<string, T[]>();
  for (const s of [...shows].sort(byStart)) {
    nights.set(nightOf(s), [...(nights.get(nightOf(s)) ?? []), s]);
  }
  return [...nights].sort(([a], [b]) => a.localeCompare(b)).map(([date, list]) => ({ date, shows: list }));
}

export function groupByDay<T extends Dated>(shows: T[]): { date: string; shows: T[] }[] {
  const days = new Map<string, T[]>();
  for (const s of [...shows].sort(byStart)) {
    days.set(s.date, [...(days.get(s.date) ?? []), s]);
  }
  return [...days].map(([date, list]) => ({ date, shows: list }));
}

export const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export interface RecurringRule {
  weekday: (typeof WEEKDAYS)[number];
  months?: number[];
  skip: string[];
}

/** Dates a weekly rule falls on, from `today` through `weeks` weeks out (Chicago dates). */
export function recurringDates(rule: RecurringRule, today: string, weeks: number): string[] {
  const target = WEEKDAYS.indexOf(rule.weekday);
  let date = addDays(today, (target - weekday(today) + 7) % 7);
  const dates: string[] = [];
  for (let i = 0; i < weeks; i++, date = addDays(date, 7)) {
    const month = Number(date.slice(5, 7));
    if (rule.months && !rule.months.includes(month)) continue;
    if (rule.skip.includes(date)) continue;
    dates.push(date);
  }
  return dates;
}

const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Window within which a one-off show at the same venue replaces a recurring slot. */
export const DEDUPE_MINUTES = 120;

/**
 * Drops recurring instances that collide with a one-off show at the same
 * venue on the same date, starting within DEDUPE_MINUTES. One-offs win.
 */
export function dedupeRecurring<T extends Dated & { venue: { id: string } }>(oneOffs: T[], recurring: T[]): T[] {
  return recurring.filter(
    (r) =>
      !oneOffs.some(
        (s) =>
          s.venue.id === r.venue.id &&
          s.date === r.date &&
          Math.abs(minutes(s.startTime) - minutes(r.startTime)) < DEDUPE_MINUTES,
      ),
  );
}
