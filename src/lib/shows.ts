// Pure show-list logic, kept free of astro:content so it can be unit-tested.
import { chicagoDate, weekendRange } from './time.ts';

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

export function groupByDay<T extends Dated>(shows: T[]): { date: string; shows: T[] }[] {
  const days = new Map<string, T[]>();
  for (const s of [...shows].sort(byStart)) {
    days.set(s.date, [...(days.get(s.date) ?? []), s]);
  }
  return [...days].map(([date, list]) => ({ date, shows: list }));
}
