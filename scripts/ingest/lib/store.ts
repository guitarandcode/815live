// Reads and writes /data JSON the same way a person would edit it, and
// reconciles an adapter's events with the show files it owns.
//
// Ownership: a show file belongs to an adapter when its source.uid starts
// with "<adapter-id>:". uids look like "<adapter-id>:<group>:<detail>"; a
// group is one source page (e.g. one Hard Rock event page), so a re-parsed
// page replaces exactly the shows that came from it. Hand-entered files
// (no uid) are never deleted, though a file with the same id is overwritten
// and thereby adopted.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** The repo's /data, or INGEST_DATA (tests point this at a temp copy). */
export const DATA = process.env.INGEST_DATA ?? join(import.meta.dirname, '../../../data');

export interface IngestedShow {
  id: string;
  uid: string;
  date: string;
  startTime: string;
  endTime?: string;
  venue: string;
  category: 'live-music' | 'dj' | 'karaoke' | 'open-mic' | 'trivia' | 'comedy';
  title?: string;
  artists: { slug: string; name: string }[];
  cover?: number | null;
  ticketUrl?: string;
  notes?: string;
  sourceUrl: string;
}

export interface Changes {
  written: string[];
  deleted: string[];
  artistsCreated: string[];
}

const json = (v: unknown) => JSON.stringify(v, null, 2) + '\n';

/** Writes only when the content changes, so unchanged runs leave git clean. */
function writeIfChanged(path: string, value: unknown): boolean {
  const next = json(value);
  if (existsSync(path) && readFileSync(path, 'utf8') === next) return false;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, next);
  return true;
}

export function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : fallback;
}

export function writeJson(path: string, value: unknown) {
  writeIfChanged(path, value);
}

interface ShowFile {
  date: string;
  source?: { uid?: string };
}

function ownedShows(adapter: string): { id: string; data: ShowFile }[] {
  const dir = join(DATA, 'shows');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ id: f.slice(0, -5), data: readJson<ShowFile>(join(dir, f), { date: '' }) }))
    .filter((s) => s.data.source?.uid?.startsWith(`${adapter}:`));
}

const groupOf = (uid: string) => uid.split(':')[1];

function toFile(s: IngestedShow, checked: string) {
  return {
    date: s.date,
    startTime: s.startTime,
    ...(s.endTime && { endTime: s.endTime }),
    venue: s.venue,
    category: s.category,
    ...(s.title && { title: s.title }),
    artists: s.artists.map((a) => a.slug),
    ...(s.cover !== undefined && { cover: s.cover }),
    ...(s.ticketUrl && { ticketUrl: s.ticketUrl }),
    ...(s.notes && { notes: s.notes }),
    checked,
    source: { type: 'venue-site', url: s.sourceUrl, kind: 'venue', uid: s.uid },
  };
}

/**
 * @param refetched shows parsed this run, keyed by group (every group listed
 *   is authoritative: its old future shows not in the list are removed)
 * @param alive every group still present at the source (refetched or not);
 *   owned future shows from groups no longer present are removed
 */
export function reconcile(
  adapter: string,
  refetched: Map<string, IngestedShow[]>,
  alive: Set<string>,
  today: string,
): Changes {
  const changes: Changes = { written: [], deleted: [], artistsCreated: [] };
  const fresh = new Set([...refetched.values()].flat().map((s) => s.id));
  for (const { id, data } of ownedShows(adapter)) {
    if (data.date < today || fresh.has(id)) continue; // past shows stay as history
    const group = groupOf(data.source!.uid!);
    if (refetched.has(group) || !alive.has(group)) {
      rmSync(join(DATA, 'shows', `${id}.json`));
      changes.deleted.push(id);
    }
  }
  for (const show of [...refetched.values()].flat()) {
    for (const a of show.artists) {
      const path = join(DATA, 'artists', `${a.slug}.json`);
      if (!existsSync(path)) {
        writeJson(path, { name: a.name, genres: [], socials: {}, auto: true });
        changes.artistsCreated.push(a.slug);
      }
    }
    if (writeIfChanged(join(DATA, 'shows', `${show.id}.json`), toFile(show, today))) changes.written.push(show.id);
  }
  return changes;
}
