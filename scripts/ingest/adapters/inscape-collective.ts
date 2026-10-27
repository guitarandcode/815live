// Inscape Collective (Midtown Rockford): concerts and open mics. The site is
// Wix with no calendar feed (no .ics, no ticketing platform), but Wix lists
// every event page in /event-pages-sitemap.xml with a lastmod, and each event
// page carries schema.org Event JSON-LD with an offset start time. Same
// pattern as the Hard Rock adapter: sitemap, then only new or changed pages.
// Most events are art sales, sound baths and classes, so music is picked by
// keywords and any other event that mentions music is logged for a person.
import { fetchText } from '../lib/http.ts';
import { matchArtist } from '../lib/artists.ts';
import { deferToHandEntered, type IngestedShow } from '../lib/store.ts';
import { addDays, chicagoDate, TZ } from '../../../src/lib/time.ts';

export const id = 'inscape-collective';
const VENUE = 'inscape-collective';
const ORIGIN = 'https://www.inscapecollective.org';
const SITEMAP = `${ORIGIN}/event-pages-sitemap.xml`;
const EVENT_PATH = '/event-details/';
/** Pages untouched for longer than this are past events; not fetched (pages are ~850 KB). */
const STALE_DAYS = 365;

const NOT_MUSIC = /\b(sound bath|meditation|drum circle|crafternoons?|workshops?|class(es)?|boutique|sale|poetry|yoga|ritual)\b/i;
const OPEN_MIC = /\bopen mic\b/i;
const CONCERT = /^(.+?)\s+in concert\b/i;
const MUSICISH = /\b(music|concert|band|jazz|blues|singer|songwriter|dj)\b/i;

export interface JsonLdEvent {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  eventStatus?: string;
  location?: { name?: string };
}

export function parseSitemap(xml: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '';
    const i = loc.indexOf(EVENT_PATH);
    if (i < 0) continue;
    out.set(loc.slice(i + EVENT_PATH.length).replace(/\/$/, ''), m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? '');
  }
  return out;
}

export function eventJsonLd(html: string): JsonLdEvent {
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    const obj = JSON.parse(m[1]);
    if (obj['@type'] === 'Event') return obj;
  }
  throw new Error('no Event JSON-LD');
}

const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const local = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || !/[+-]\d{2}:\d{2}$|Z$/.test(iso)) throw new Error(`no offset in "${iso}"`);
  return { date: chicagoDate(d), time: timeFmt.format(d) };
};

/** What kind of listing an event is, or why it isn't one. */
export function classify(ev: JsonLdEvent): { kind: 'concert'; act: string } | { kind: 'open-mic' } | { kind: 'skip'; ask: boolean } {
  if (OPEN_MIC.test(ev.name)) return { kind: 'open-mic' };
  const concert = ev.name.match(CONCERT);
  if (concert && !NOT_MUSIC.test(ev.name)) return { kind: 'concert', act: concert[1].trim() };
  return { kind: 'skip', ask: !NOT_MUSIC.test(ev.name) && MUSICISH.test(`${ev.name}\n${ev.description ?? ''}`) };
}

export function toShow(slug: string, ev: JsonLdEvent, c: { kind: 'concert'; act: string } | { kind: 'open-mic' }): IngestedShow {
  const start = local(ev.startDate);
  const end = ev.endDate ? local(ev.endDate) : undefined;
  const artist = c.kind === 'concert' ? matchArtist(c.act) : undefined;
  return {
    id: `${start.date}-inscape-${artist ? artist.slug : 'open-mic'}`,
    uid: `${id}:${slug}:${start.date}T${start.time}`,
    date: start.date,
    startTime: start.time,
    ...(end && end.date === start.date && end.time > start.time && { endTime: end.time }),
    venue: VENUE,
    category: c.kind === 'open-mic' ? 'open-mic' : 'live-music',
    ...(c.kind === 'open-mic' && { title: 'Open Mic' }),
    artists: artist ? [{ slug: artist.slug, name: artist.name }] : [],
    sourceUrl: `${ORIGIN}${EVENT_PATH}${slug}`,
  };
}

export interface RunResult {
  refetched: Map<string, IngestedShow[]>;
  alive: Set<string>;
  state: Record<string, string>;
  log: string[];
}

/** @param state slug -> lastmod from the previous run; pages with an unchanged lastmod aren't fetched. */
export async function run(state: Record<string, string>, today: string, full = false): Promise<RunResult> {
  const pages = parseSitemap(await fetchText(SITEMAP));
  if (pages.size === 0) throw new Error('sitemap had no event pages; refusing to treat every listing as removed');
  const refetched = new Map<string, IngestedShow[]>();
  const next: Record<string, string> = {};
  const log: string[] = [`${pages.size} event pages in sitemap`];
  const oldest = addDays(today, -STALE_DAYS);
  let stale = 0;
  for (const [slug, lastmod] of pages) {
    if (lastmod && lastmod < oldest) {
      stale++;
      continue;
    }
    if (!full && state[slug] && state[slug] === lastmod) {
      next[slug] = lastmod;
      continue;
    }
    try {
      const ev = eventJsonLd(await fetchText(`${ORIGIN}${EVENT_PATH}${slug}`));
      next[slug] = lastmod;
      const start = local(ev.startDate);
      if (start.date < today) continue;
      const c = classify(ev);
      if (/cancel/i.test(ev.eventStatus ?? '')) log.push(`skipped ${slug}: cancelled`);
      else if (ev.location?.name && !/inscape/i.test(ev.location.name)) log.push(`skipped ${slug}: elsewhere (${ev.location.name})`);
      else if (c.kind === 'skip') {
        if (c.ask) log.push(`ASK ${slug}: "${ev.name}" on ${start.date} mentions music; not listed`);
        refetched.set(slug, []);
        continue;
      } else {
        const show = toShow(slug, ev, c);
        if (show.artists[0]) {
          const a = matchArtist(show.artists[0].name);
          if (!a.existing && a.near.length) log.push(`ASK ${slug}: "${a.name}" is new; same as ${a.near.join(', ')}?`);
        }
        refetched.set(slug, deferToHandEntered([show], log));
        log.push(`fetched ${slug}: ${show.date} ${show.startTime}`);
        continue;
      }
      refetched.set(slug, []);
    } catch (e) {
      log.push(`WARN ${slug}: ${(e as Error).message}`);
      if (state[slug]) next[slug] = '';
    }
  }
  if (stale) log.push(`${stale} page(s) untouched for over a year not fetched`);
  return { refetched, alive: new Set(pages.keys()), state: next, log };
}
