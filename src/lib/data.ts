// Loads the collections once per build and resolves show references.
import { getCollection, type CollectionEntry } from 'astro:content';
import { buildNow, byStart, upcoming } from './shows.ts';
import { addDays } from './time.ts';

export type Venue = CollectionEntry<'venues'>;
export type Artist = CollectionEntry<'artists'>;

export interface Show extends Omit<CollectionEntry<'shows'>['data'], 'venue' | 'artists'> {
  id: string;
  venue: Venue;
  artists: Artist[];
}

/** Fixed for the whole build so every page agrees on "today". */
export const NOW = buildNow();

let cache: Promise<{ venues: Venue[]; artists: Artist[]; shows: Show[] }> | undefined;

export function loadAll() {
  cache ??= (async () => {
    const [venues, artists, rawShows] = await Promise.all([
      getCollection('venues'),
      getCollection('artists'),
      getCollection('shows'),
    ]);
    const venueById = new Map(venues.map((v) => [v.id, v]));
    const artistById = new Map(artists.map((a) => [a.id, a]));
    const shows = rawShows
      .map(({ id, data }): Show => ({
        ...data,
        id,
        // reference() already validated these ids at load time.
        venue: venueById.get(data.venue.id)!,
        artists: data.artists.map((a) => artistById.get(a.id)!),
      }))
      .sort(byStart);
    const byName = (a: { data: { name: string } }, b: { data: { name: string } }) =>
      a.data.name.localeCompare(b.data.name);
    return { venues: venues.sort(byName), artists: artists.sort(byName), shows };
  })();
  return cache;
}

export async function upcomingShows() {
  return upcoming((await loadAll()).shows, NOW);
}

/** "Forest City Fuzz with Loves Park Lights" */
export function billTitle(show: Show): string {
  const [head, ...rest] = show.artists.map((a) => a.data.name);
  return rest.length ? `${head} with ${rest.join(', ')}` : head;
}

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
