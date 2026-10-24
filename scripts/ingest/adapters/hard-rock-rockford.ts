// Hard Rock Casino Rockford: lounge-stage acts (Hard Rock Cafe stage and the
// Council Oak lounge). The casino's sitemap lists every event page with a
// lastmod date; only new or changed pages are fetched. Event pages give
// "Saturday, November 21 | 6PM" followed by the stage name, with no year.
import { textLines, titleOf } from '../lib/html.ts';
import { fetchText } from '../lib/http.ts';
import type { IngestedShow } from '../lib/store.ts';
import { addDays, weekday } from '../../../src/lib/time.ts';

export const id = 'hard-rock-rockford';
const VENUE = 'hard-rock-casino-rockford';
const SITEMAP = 'https://casino.hardrock.com/rockford/sitemap.xml';
const EVENT_PATH = '/rockford/entertainment/upcoming-events/';

/** Stages we list, with the note shown on the show page. Hard Rock Live (touring) is out of scope. */
export const STAGES: Record<string, { key: string; note: string }> = {
  'Hard Rock Cafe': { key: 'cafe', note: 'On the Hard Rock Cafe stage.' },
  'Council Oak': { key: 'council-oak', note: 'In the Council Oak lounge.' },
};

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export interface Slot {
  date: string;
  startTime: string;
  stage: string;
}

/** Event pages listed in the sitemap: slug -> lastmod. */
export function parseSitemap(xml: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '';
    const i = loc.indexOf(EVENT_PATH);
    if (i < 0) continue;
    const slug = loc.slice(i + EVENT_PATH.length).replace(/\/$/, '');
    if (!/^[a-z0-9-]+$/.test(slug)) continue;
    out.set(slug, m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? '');
  }
  return out;
}

/**
 * The year a weekday + month/day falls in: the only year (of last, this and
 * next) where the weekday matches and the date is between a week ago and a
 * year ahead. Undefined when that isn't unambiguous.
 */
export function inferDate(dayName: string, month: number, day: number, today: string): string | undefined {
  const y = Number(today.slice(0, 4));
  const want = DAYS.indexOf(dayName.toLowerCase());
  const hits = [y - 1, y, y + 1]
    .map((yr) => `${yr}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    .filter((d) => weekday(d) === want && d >= addDays(today, -7) && d <= addDays(today, 365));
  return hits.length === 1 ? hits[0] : undefined;
}

/** Act name and performance slots from an event page. Throws when the page can't be read unambiguously. */
export function parseEventPage(html: string, today: string): { name: string; slots: Slot[]; skipped: string[] } {
  const title = titleOf(html) ?? '';
  const name = title.replace(/\s+at Hard Rock Casino Rockford\s*$/i, '').trim();
  if (!name) throw new Error('no title');
  const lines = textLines(html);
  const slots: Slot[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();
  const rx = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+([A-Za-z]+)\s+(\d{1,2})\s*\|\s*(\d{1,2})(?::(\d{2}))?\s*([AP]M)$/i;
  lines.forEach((line, i) => {
    const m = line.match(rx);
    if (!m) return;
    const month = MONTHS.indexOf(m[2].toLowerCase()) + 1;
    if (!month) throw new Error(`unknown month in "${line}"`);
    const date = inferDate(m[1], month, Number(m[3]), today);
    if (!date) throw new Error(`ambiguous or out-of-range date "${line}"`);
    const hour = (Number(m[4]) % 12) + (m[6].toUpperCase() === 'PM' ? 12 : 0);
    const startTime = `${String(hour).padStart(2, '0')}:${m[5] ?? '00'}`;
    const stage = lines[i + 1] ?? '';
    const key = `${date} ${startTime} ${stage}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (STAGES[stage]) slots.push({ date, startTime, stage });
    else skipped.push(`${line} @ ${stage || '?'}`);
  });
  if (slots.length === 0 && skipped.length === 0) throw new Error('no date lines found');
  return { name, slots, skipped };
}

export const artistSlug = (eventSlug: string) => eventSlug.replace(/-\d+$/, '');

export function toShows(eventSlug: string, name: string, slots: Slot[]): IngestedShow[] {
  const artist = artistSlug(eventSlug);
  return slots.map((s) => {
    const stage = STAGES[s.stage];
    return {
      id: `${s.date}-hard-rock-${artist}${slots.length > 1 ? `-${stage.key}` : ''}`,
      uid: `${id}:${eventSlug}:${s.date}T${s.startTime}@${stage.key}`,
      date: s.date,
      startTime: s.startTime,
      venue: VENUE,
      category: /\bcomed(y|ian)\b/i.test(name) ? 'comedy' : 'live-music',
      artists: [{ slug: artist, name }],
      notes: stage.note,
      sourceUrl: `https://casino.hardrock.com${EVENT_PATH}${eventSlug}`,
    };
  });
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
  for (const [slug, lastmod] of pages) {
    if (!full && state[slug] && state[slug] === lastmod) {
      next[slug] = lastmod;
      continue;
    }
    try {
      const { name, slots, skipped } = parseEventPage(await fetchText(`https://casino.hardrock.com${EVENT_PATH}${slug}`), today);
      refetched.set(slug, toShows(slug, name, slots));
      next[slug] = lastmod;
      log.push(`fetched ${slug}: ${slots.length} slot(s)${skipped.length ? `, skipped ${skipped.join('; ')}` : ''}`);
    } catch (e) {
      // Not recorded in state, so it's retried next run; its existing shows are kept.
      log.push(`WARN ${slug}: ${(e as Error).message}`);
      if (state[slug]) next[slug] = '';
    }
  }
  return { refetched, alive: new Set(pages.keys()), state: next, log };
}
