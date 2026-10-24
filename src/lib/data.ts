// Loads the collections once per build and resolves show references.
import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES, type Category } from './categories.ts';
import { buildNow, byStart, dedupeRecurring, listing, recurringDates, upcoming, WEEKDAYS } from './shows.ts';
import { addDays, chicagoDate } from './time.ts';

export type Venue = CollectionEntry<'venues'>;
export type Artist = CollectionEntry<'artists'>;

export interface Show extends Omit<CollectionEntry<'shows'>['data'], 'venue' | 'artists'> {
  id: string;
  venue: Venue;
  artists: Artist[];
  /** Set on listings expanded from a recurring rule: the rule's slug. */
  recurring?: string;
  host?: string;
}

export interface Recurring extends Omit<CollectionEntry<'recurring'>['data'], 'venue'> {
  id: string;
  venue: Venue;
  /** The next dated listing (after dedupe), if any falls in the expansion window. */
  next?: Show;
}

/** How far ahead recurring rules are expanded. */
export const RECURRING_WEEKS = 8;

/** Fixed for the whole build so every page agrees on "today". */
export const NOW = buildNow();

let cache: Promise<{ venues: Venue[]; artists: Artist[]; shows: Show[]; recurring: Recurring[] }> | undefined;

export function loadAll() {
  cache ??= (async () => {
    const [venues, artists, rawShows, rules] = await Promise.all([
      getCollection('venues'),
      getCollection('artists'),
      getCollection('shows'),
      getCollection('recurring'),
    ]);
    const venueById = new Map(venues.map((v) => [v.id, v]));
    const artistById = new Map(artists.map((a) => [a.id, a]));
    const oneOffs = rawShows.map(
      ({ id, data }): Show => ({
        ...data,
        id,
        // reference() already validated these ids at load time.
        venue: venueById.get(data.venue.id)!,
        artists: data.artists.map((a) => artistById.get(a.id)!),
      }),
    );
    const today = chicagoDate(NOW);
    const expanded = rules.flatMap(({ id, data: r }) =>
      recurringDates(r, today, RECURRING_WEEKS).map(
        (date): Show => ({
          id: `${date}-${id}`,
          date,
          startTime: r.startTime,
          endTime: r.endTime,
          venue: venueById.get(r.venue.id)!,
          category: r.category,
          title: r.title,
          artists: [],
          cover: r.cover,
          notes: r.notes,
          status: 'scheduled',
          source: r.source,
          placeholder: false,
          recurring: id,
          host: r.host,
        }),
      ),
    );
    const shows = [...oneOffs, ...dedupeRecurring(oneOffs, expanded)].sort(byStart);
    // Rules with nothing in the window (out of season, all skipped) are left out.
    const recurring = rules
      .map(({ id, data }): Recurring => ({
        ...data,
        id,
        venue: venueById.get(data.venue.id)!,
        next: shows.find((s) => s.recurring === id),
      }))
      .filter((r) => r.next)
      .sort((a, b) => WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday) || a.startTime.localeCompare(b.startTime));
    const byName = (a: { data: { name: string } }, b: { data: { name: string } }) =>
      a.data.name.localeCompare(b.data.name);
    return { venues: venues.sort(byName), artists: artists.sort(byName), shows, recurring };
  })();
  return cache;
}

export async function upcomingShows() {
  return upcoming((await loadAll()).shows, NOW);
}

/** What the home and category pages show, optionally for one category. */
export async function pageListing(category?: Category) {
  const { shows, recurring } = await loadAll();
  const inCat = <T extends { category: Category }>(x: T) => !category || x.category === category;
  return {
    shows: listing(shows.filter(inCat), NOW),
    weekly: recurring.filter(inCat),
  };
}

/** Upcoming listing count per category (all expanded recurring instances included). */
export async function categoryCounts(): Promise<Record<Category, number>> {
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  for (const s of await upcomingShows()) counts[s.category]++;
  return counts;
}

/** "Headliner with Opener, Opener" */
export function billTitle(show: Show): string {
  const [head, ...rest] = show.artists.map((a) => a.data.name);
  return rest.length ? `${head} with ${rest.join(', ')}` : (head ?? '');
}

/** "The Moment, Joie De Vivre, …": the line-up under a titled show. */
export const lineup = (show: Show) => show.artists.map((a) => a.data.name).join(', ');

/** The show's own title when it has one, otherwise its bill. */
export const showTitle = (show: Show) => show.title ?? billTitle(show);

/** Calendar date the show ends on; an end time before the start means after midnight. */
export function endDate(show: Show): string {
  return show.endTime && show.endTime < show.startTime ? addDays(show.date, 1) : show.date;
}

/** null = free, undefined = unknown. */
export function coverLabel(cover: number | null | undefined): string | undefined {
  if (cover === undefined) return undefined;
  if (cover === null || cover === 0) return 'Free';
  return `$${Number.isInteger(cover) ? cover : cover.toFixed(2)}`;
}
