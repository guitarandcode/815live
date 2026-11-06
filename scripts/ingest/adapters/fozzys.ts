// Fozzy's Bar & Grill (Loves Park): DJ nights, music bingo and trivia from
// the venue's own WordPress site (Modern Events Calendar, fozzys.net/events/).
// Source: MEC's per-event iCal (`/?method=ical&id=N`). Event pages are found
// through the `mec-events-sitemap*.xml` files (lastmod), and each page gives
// its post id. A page and its iCal are only fetched again when the sitemap's
// lastmod changes.
//
// Time zone: the site's iCal labels every time `TZID=UTC` (X-WR-TIMEZONE:UTC),
// but the clock times are Chicago local: "DJ Visio, Friday November 27th,
// 9 PM" comes out as `DTSTART;TZID=UTC:20261127T210000`. So the UTC label is
// dropped and the times are read as America/Chicago wall clock (user,
// 2026-11-06; tests/ingest.test.ts pins it). End times are left out: MEC
// writes 23:55 as a placeholder (the same event's text says 1:30 AM).
//
// Runs only when named (`npm run ingest -- fozzys`): the 9 AM timer run calls
// it, not the nightly CI ingest (user, 2026-11-06).
import { matchArtist } from '../lib/artists.ts';
import { classifyEvent } from '../lib/classify.ts';
import { decode } from '../lib/html.ts';
import { fetchText } from '../lib/http.ts';
import { parseIcs, type IcsEvent } from '../lib/ics.ts';
import { deferToHandEntered, type IngestedShow } from '../lib/store.ts';
import { addDays } from '../../../src/lib/time.ts';

export const id = 'fozzys';
/** Not run by a plain `node scripts/ingest/run.ts`; only when named. */
export const onlyWhenNamed = true;
const VENUE = 'fozzys-bar-and-grill';
const ORIGIN = 'https://fozzys.net';
/** Sitemap entries changed this many days back are (re)checked. */
const RECENT_DAYS = 60;
/** Event pages (+ their iCal) fetched per run; the rest wait for the next run. */
const MAX_EVENTS = 40;

export interface Seen {
  lastmod: string;
  postId?: string;
  /** What the iCal said at that lastmod (kept so unchanged events aren't refetched). */
  event?: { summary: string; description?: string; date: string; time: string; url: string };
}

/** Event page URL -> lastmod, from MEC's sitemap files. */
export function parseEventSitemap(xml: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*(?:<lastmod>([^<]+)<\/lastmod>)?/g)) {
    const loc = m[1].trim();
    if (/^https:\/\/fozzys\.net\/events\/[^/]+\/$/.test(loc)) out.set(loc, (m[2] ?? '').trim());
  }
  return out;
}

/** The MEC iCal with its fake UTC label removed, so times parse as Chicago wall clock. */
export function parseFozzysIcs(text: string): IcsEvent[] {
  return parseIcs(text.replace(/;TZID=UTC(?=:)/g, ''));
}

const slugOf = (url: string) => url.match(/\/events\/([^/]+)\/$/)![1];

/** "DJ Visio — Live DJ" -> DJ Visio as the act; other titles stay titles. */
export function toShow(ev: { summary: string; description?: string; date: string; time: string; url: string }): IngestedShow | { skip: string } {
  const summary = decode(ev.summary).trim();
  const c = classifyEvent(summary, ev.description ?? '');
  if (!c) return { skip: `not a music or night-out event ("${summary}")` };
  if ('ask' in c) return { skip: `${c.ask} ("${summary}")` };
  const slug = slugOf(ev.url);
  const djName = c.category === 'dj' ? summary.match(/^((?:DJ|VJ)\s+[^—–-]+?)\s*(?:[—–-].*)?$/i)?.[1] : undefined;
  const artists = djName ? [matchArtist(djName)] : [];
  const free = /\bno cover\b|\bfree to play\b/i.test(`${summary}\n${ev.description ?? ''}`);
  return {
    id: `${ev.date}-fozzys-${slug.replace(/-\d+$/, '')}`,
    uid: `${id}:${slug}:${ev.date}T${ev.time}`,
    date: ev.date,
    startTime: ev.time,
    venue: VENUE,
    category: c.category,
    ...(!djName && { title: summary.replace(/\s*[—–]\s*Live DJ$/i, '') }),
    artists: artists.map((a) => ({ slug: a.slug, name: a.name })),
    ...(free && { cover: null }),
    sourceUrl: ev.url,
  };
}

export async function run(state: Record<string, Seen>, today: string, full = false) {
  const index = await fetchText(`${ORIGIN}/sitemap_index.xml`);
  const maps = [...index.matchAll(/<loc>([^<]*mec-events-sitemap\d*\.xml)<\/loc>/g)].map((m) => m[1]);
  if (!maps.length) throw new Error('no mec-events sitemaps in sitemap_index.xml');
  const pages = new Map<string, string>();
  for (const sm of maps) for (const [u, lm] of parseEventSitemap(await fetchText(sm))) pages.set(u, lm);
  if (!pages.size) throw new Error('event sitemaps listed no events; refusing to treat every listing as removed');

  const refetched = new Map<string, IngestedShow[]>();
  const alive = new Set([...pages.keys()].map(slugOf));
  const next: Record<string, Seen> = {};
  const log: string[] = [];
  const since = addDays(today, -RECENT_DAYS);
  let fetched = 0;
  for (const [url, lastmod] of pages) {
    const slug = slugOf(url);
    let seen: Seen | undefined = state[url];
    const changed = full || !seen || seen.lastmod !== lastmod;
    if (changed && lastmod.slice(0, 10) < since && !seen) continue; // old, never seen: not worth fetching
    if (changed) {
      if (fetched >= MAX_EVENTS) {
        log.push(`deferred ${slug}: fetch limit reached; next run`);
        if (seen) next[url] = { ...seen, lastmod: '' };
        continue;
      }
      fetched++;
      try {
        const html = await fetchText(url);
        const postId = html.match(/method=ical&(?:amp;)?id=(\d+)/)?.[1];
        if (!postId) throw new Error('no iCal link on the page');
        const [ev] = parseFozzysIcs(await fetchText(`${ORIGIN}/?method=ical&id=${postId}`));
        if (!ev) throw new Error('iCal had no event');
        seen = { lastmod, postId, event: { summary: ev.summary, description: ev.description, date: ev.start.date, time: ev.start.time, url } };
      } catch (e) {
        log.push(`WARN ${slug}: ${(e as Error).message}`);
        if (state[url]) next[url] = { ...state[url], lastmod: '' };
        continue;
      }
    }
    next[url] = seen!;
    const ev = seen!.event;
    if (!ev || ev.date < today || !changed) continue; // unchanged events keep their files (group still alive)
    const show = toShow(ev);
    if ('skip' in show) {
      log.push(`skipped ${slug}: ${show.skip}`);
      refetched.set(slug, []);
      continue;
    }
    for (const a of show.artists) {
      const m = matchArtist(a.name);
      if (!m.existing && m.near.length) log.push(`ASK ${slug}: "${a.name}" is new; same as ${m.near.join(', ')}?`);
    }
    refetched.set(slug, deferToHandEntered([show], log));
  }
  log.unshift(`${pages.size} event pages in ${maps.length} sitemaps, ${fetched} page(s) + iCal fetched`);
  return { refetched, alive, state: next, log };
}
