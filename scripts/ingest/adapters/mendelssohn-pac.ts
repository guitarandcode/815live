// Mendelssohn Performing Arts Center: the concert series in the MPAC
// Auditorium. Source: the site's Event Organiser iCal feed (/feed/eo-events/),
// one request for every event with Chicago times, a URL and LAST-MODIFIED.
// Checked first and not available: The Events Calendar REST API (404; the
// site doesn't use that plugin). Cover and ticket link are only on each
// event's own page, which is fetched only when the feed's LAST-MODIFIED for
// that event changes, because robots.txt sets Crawl-delay: 60.
import { textLines } from '../lib/html.ts';
import { fetchText } from '../lib/http.ts';
import { parseIcs, type IcsEvent } from '../lib/ics.ts';
import { matchArtist } from '../lib/artists.ts';
import { deferToHandEntered, type IngestedShow } from '../lib/store.ts';

export const id = 'mendelssohn-pac';
const VENUE = 'mendelssohn-performing-arts-center';
const FEED = 'https://www.mendelssohnpac.org/feed/eo-events/';
const ROOM = 'MPAC Auditorium';
/** Event pages fetched per run (a minute each); the rest wait for the next run. */
const MAX_PAGES = 6;

/** Series events that aren't performances. */
const NOT_A_SHOW = /\b(lectures?|talks?|class(es)?|workshops?|master ?class(es)?|competitions?|auditions?|meetings?|luncheons?|rentals?|private)\b/i;
/** A leading phrase that names the occasion, not an act: "Christmas with the Abram Collier Nonet". */
const OCCASION = /\b(christmas|holiday|evening|night|celebration|tribute|music of|songs of)\b/i;

export interface Detail {
  lastmod: string;
  cover?: number | null;
  notes?: string;
  ticketUrl?: string;
}

/** "Berimbau Sextet with Krissy Bergmark" -> two acts; "Christmas with the X" -> title + X. */
export function parseBill(summary: string): { title?: string; acts: string[] } {
  const m = summary.match(/^(.+?)\s+with\s+(?:the\s+)?(.+)$/i);
  if (!m) return { acts: [summary] };
  if (OCCASION.test(m[1])) return { title: summary, acts: [m[2]] };
  return { acts: [m[1], m[2]] };
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** Date, time, price line and ticket link from an event page. */
export function parseEventPage(html: string): { date?: string; time?: string; cover?: number | null; notes?: string; ticketUrl?: string } {
  const lines = textLines(html);
  const out: ReturnType<typeof parseEventPage> = {};
  const i = lines.indexOf('Date:');
  const dm = lines[i + 1]?.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*([ap]m)/i);
  if (i >= 0 && dm) {
    const month = MONTHS.indexOf(dm[1].toLowerCase()) + 1;
    out.date = `${dm[3]}-${String(month).padStart(2, '0')}-${dm[2].padStart(2, '0')}`;
    out.time = `${String((Number(dm[4]) % 12) + (dm[6].toLowerCase() === 'pm' ? 12 : 0)).padStart(2, '0')}:${dm[5]}`;
  }
  const price = lines.find((l) => l.length < 120 && (/^\$\d/.test(l) || /^free\b/i.test(l)));
  if (price) {
    const amounts = [...price.matchAll(/\$(\d+(?:\.\d{2})?)/g)].map((m) => Number(m[1]));
    out.cover = amounts.length ? amounts[0] : null;
    if (amounts.length > 1) out.notes = `Tickets: ${price}.`;
  }
  out.ticketUrl = html.match(/<a [^>]*href="(https?:\/\/[^"]+)"[^>]*>\s*(?:PURCHASE|BUY)\s+TICKETS/i)?.[1];
  return out;
}

const slugOf = (url: string) => url.match(/\/events\/event\/([^/]+)/)?.[1];

export function toShow(ev: IcsEvent, slug: string, detail?: Detail): IngestedShow {
  const { title, acts } = parseBill(ev.summary);
  const artists = acts.map((a) => matchArtist(a));
  return {
    id: `${ev.start.date}-mpac-${artists[0].slug}`,
    uid: `${id}:${slug}:${ev.start.date}T${ev.start.time}`,
    date: ev.start.date,
    startTime: ev.start.time,
    venue: VENUE,
    category: 'live-music',
    ...(title && { title }),
    artists: artists.map((a) => ({ slug: a.slug, name: a.name })),
    ...(detail && detail.cover !== undefined && { cover: detail.cover }),
    ...(detail?.ticketUrl && { ticketUrl: detail.ticketUrl }),
    ...(detail?.notes && { notes: detail.notes }),
    sourceUrl: ev.url!,
  };
}

export interface RunResult {
  refetched: Map<string, IngestedShow[]>;
  alive: Set<string>;
  state: Record<string, Detail>;
  log: string[];
}

/** @param state event slug -> what its page said at a given LAST-MODIFIED. */
export async function run(state: Record<string, Detail>, today: string, full = false): Promise<RunResult> {
  const events = parseIcs(await fetchText(FEED));
  if (events.length === 0) throw new Error('feed had no events; refusing to treat every listing as removed');
  const refetched = new Map<string, IngestedShow[]>();
  const alive = new Set<string>();
  const next: Record<string, Detail> = {};
  const log: string[] = [];
  let pages = 0;
  for (const ev of events) {
    const slug = ev.url && slugOf(ev.url);
    if (!slug) {
      if (ev.start.date >= today) log.push(`WARN no event URL for "${ev.summary}"`);
      continue;
    }
    alive.add(slug);
    if (ev.start.date < today) continue;
    if (!ev.location?.includes(ROOM)) {
      log.push(`skipped ${slug}: not in the ${ROOM} (${ev.location ?? 'no location'})`);
      continue;
    }
    if (ev.status === 'CANCELLED' || NOT_A_SHOW.test(ev.summary)) {
      log.push(`skipped ${slug}: ${ev.status === 'CANCELLED' ? 'cancelled' : 'not a performance'} ("${ev.summary}")`);
      refetched.set(slug, []);
      continue;
    }
    let detail: Detail | undefined = state[slug];
    const lastmod = ev.lastModified ?? '';
    if (full || !detail || detail.lastmod !== lastmod) {
      if (pages >= MAX_PAGES) {
        // An old lastmod in state means it's fetched next run; keep what we knew meanwhile.
        log.push(`deferred ${slug}: page limit reached; fetched next run`);
      } else {
        pages++;
        try {
          const page = parseEventPage(await fetchText(ev.url!));
          if (page.date && (page.date !== ev.start.date || page.time !== ev.start.time)) {
            // Keep whatever we had for this event until the two agree.
            log.push(`WARN ${slug}: feed says ${ev.start.date} ${ev.start.time}, page says ${page.date} ${page.time}`);
            if (state[slug]) next[slug] = { ...state[slug], lastmod: '' };
            continue;
          }
          detail = { lastmod, cover: page.cover, notes: page.notes, ticketUrl: page.ticketUrl };
        } catch (e) {
          log.push(`WARN ${slug}: ${(e as Error).message}`);
        }
      }
    }
    if (detail) next[slug] = detail;
    for (const a of parseBill(ev.summary).acts.map((a) => matchArtist(a)))
      if (!a.existing && a.near.length) log.push(`ASK ${slug}: "${a.name}" is new; same as ${a.near.join(', ')}?`);
    refetched.set(slug, deferToHandEntered([toShow(ev, slug, detail)], log));
  }
  log.unshift(`${events.length} events in feed, ${pages} event page(s) fetched`);
  return { refetched, alive, state: next, log };
}
