// RPL Nordlof Center: concerts in the Rockford Public Library's arts center
// (mostly Crossroads Blues Society's Music Off the Rock series). Source: the
// library's Communico calendar, through its public "Add to Calendar" iCal
// feed filtered to the Nordlof Center (location 930). Chosen over Communico's
// internal JSON endpoint because the feed is the URL the library offers for
// subscribing. The feed has no event types (the Arts/Culture/Special Event
// tags are inconsistent), so music is picked by keywords and everything
// skipped is logged. Library times are often door times; a hand-entered show
// on the same date (usually from the presenter) wins and the mismatch is logged.
import { fetchText } from '../lib/http.ts';
import { parseIcs, type IcsEvent } from '../lib/ics.ts';
import { matchArtist } from '../lib/artists.ts';
import { deferToHandEntered, type IngestedShow } from '../lib/store.ts';

export const id = 'rpl-nordlof';
const VENUE = 'rpl-nordlof-center';
const HOST = 'https://services.rockfordpubliclibrary.org';
const FILTER = { feedType: 'ical', filters: { location: ['930'], ages: ['all'], types: ['all'], tags: [], term: '', days: 1 } };
export const FEED = `${HOST}/feeds?data=${Buffer.from(JSON.stringify(FILTER)).toString('base64')}`;

const NOT_MUSIC = /\b(film|screening|movie|workshops?|game|gaming|slam|poetry|class|creative jam|tournament|rumble)\b/i;
const MUSIC = /\b(music off the rock|crossroads blues|concerts?|blues|jazz|band|trio|quartet|orchestra|choir|recital|symphony)\b/i;
const SERIES = /\b(music off the rock|crossroads blues)\b/i;

export function isMusic(ev: IcsEvent): boolean {
  const text = `${ev.summary}\n${ev.description ?? ''}`;
  return !NOT_MUSIC.test(ev.summary) && MUSIC.test(text);
}

/** "Anthony Geraci: Where Were You" -> Anthony Geraci (the rest is an album or tour name). */
export const actsOf = (summary: string) =>
  summary
    .replace(/:.*$/, '')
    .split(/\s+with\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

export function toShow(ev: IcsEvent): IngestedShow {
  const artists = actsOf(ev.summary).map(matchArtist);
  const text = `${ev.summary}\n${ev.description ?? ''}`;
  const room = ev.location?.match(/^Nordlof Center - (.+)$/)?.[1];
  return {
    id: `${ev.start.date}-rpl-nordlof-${artists[0].slug}`,
    uid: `${id}:${ev.uid}:${ev.start.date}T${ev.start.time}`,
    date: ev.start.date,
    startTime: ev.start.time,
    ...(ev.end && ev.end.date === ev.start.date && ev.end.time > ev.start.time && { endTime: ev.end.time }),
    venue: VENUE,
    category: 'live-music',
    ...(SERIES.test(text) && { title: 'Music Off The Rock' }),
    artists: artists.map((a) => ({ slug: a.slug, name: a.name })),
    ...(/\bfree\b/i.test(text) && { cover: null }),
    ...(room && { notes: `In the ${room}.` }),
    sourceUrl: `${HOST}/event/${ev.uid}`,
  };
}

export interface RunResult {
  refetched: Map<string, IngestedShow[]>;
  alive: Set<string>;
  state: Record<string, string>;
  log: string[];
}

/** The feed is one request, so every run re-reads everything; no state. */
export async function run(_state: Record<string, string>, today: string): Promise<RunResult> {
  const events = parseIcs(await fetchText(FEED));
  if (events.length === 0) throw new Error('feed had no events; refusing to treat every listing as removed');
  const refetched = new Map<string, IngestedShow[]>();
  const log: string[] = [`${events.length} Nordlof Center events in feed`];
  const skipped = new Set<string>();
  for (const ev of events) {
    if (ev.start.date < today) continue;
    if (ev.status === 'CANCELLED' || !isMusic(ev)) {
      skipped.add(ev.summary);
      refetched.set(ev.uid, []);
      continue;
    }
    for (const a of actsOf(ev.summary).map(matchArtist))
      if (!a.existing && a.near.length) log.push(`ASK ${ev.uid}: "${a.name}" is new; same as ${a.near.join(', ')}?`);
    refetched.set(ev.uid, deferToHandEntered([toShow(ev)], log));
  }
  if (skipped.size) log.push(`not music: ${[...skipped].join('; ')}`);
  return { refetched, alive: new Set(events.map((e) => e.uid)), state: {}, log };
}
