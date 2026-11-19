// Polite fetching: honest User-Agent, robots.txt checked before every request
// and every redirect hop, one request per host at a time with a pause between
// (the site's Crawl-delay when it sets one).
import { crawlDelay, isAllowed } from './robots.ts';

export const USER_AGENT = '815liveBot/1.0 (+https://815live.com/about)';
const PAUSE_MS = 1000;
const MAX_REDIRECTS = 5;

const robotsCache = new Map<string, Promise<string | null>>();
const lastHit = new Map<string, number>();
const hostDelay = new Map<string, number>();

export class RobotsBlocked extends Error {}

async function pause(host: string) {
  const wait = (lastHit.get(host) ?? 0) + (hostDelay.get(host) ?? PAUSE_MS) - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastHit.set(host, Date.now());
}

/** robots.txt body ('' when absent/4xx), or null when it couldn't be read (treat as disallowed). */
function robotsFor(origin: string): Promise<string | null> {
  let p = robotsCache.get(origin);
  if (!p) {
    p = (async () => {
      try {
        await pause(new URL(origin).host);
        const res = await fetch(`${origin}/robots.txt`, { headers: { 'User-Agent': USER_AGENT } });
        if (res.status >= 500) return null;
        const text = res.ok ? await res.text() : '';
        const delay = crawlDelay(text) * 1000;
        if (delay > PAUSE_MS) hostDelay.set(new URL(origin).host, delay);
        return text;
      } catch {
        return null;
      }
    })();
    robotsCache.set(origin, p);
  }
  return p;
}

async function assertAllowed(url: string) {
  const robots = await robotsFor(new URL(url).origin);
  if (robots === null) throw new RobotsBlocked(`robots.txt unreadable for ${url}`);
  const verdict = isAllowed(robots, url);
  if (!verdict.allowed) throw new RobotsBlocked(`${url} disallowed (${verdict.rule})`);
}

/** A response body plus what the server said about it. */
export interface Fetched {
  url: string;
  status: number;
  contentType: string;
  bytes: number;
  text: string;
}

export async function fetchResponse(url: string): Promise<Fetched> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertAllowed(current);
    await pause(new URL(current).host);
    const res = await fetch(current, { headers: { 'User-Agent': USER_AGENT }, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      current = new URL(res.headers.get('location')!, current).href;
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${current}`);
    const body = await res.arrayBuffer();
    return {
      url: current,
      status: res.status,
      contentType: res.headers.get('content-type') ?? '(none)',
      bytes: body.byteLength,
      text: new TextDecoder().decode(body),
    };
  }
  throw new Error(`Too many redirects for ${url}`);
}

export async function fetchText(url: string): Promise<string> {
  return (await fetchResponse(url)).text;
}

const SNIPPET_CHARS = 300;

/**
 * The error an adapter throws when its source lists nothing, so the run keeps
 * every existing listing. Says what the server actually sent (status, type,
 * size, start of the body) so a glitch can be told from a block or a format change.
 */
export function emptySourceError(what: string, responses: Fetched | Fetched[]): Error {
  const sent = [responses].flat().map((r) => {
    const chars = [...r.text.replace(/\s+/g, ' ').trim()];
    const snippet = chars.slice(0, SNIPPET_CHARS).join('') + (chars.length > SNIPPET_CHARS ? '…' : '');
    return `${r.url}: HTTP ${r.status}, ${r.contentType}, ${r.bytes} bytes, body: "${snippet}"`;
  });
  return new Error(`${what}; refusing to treat every listing as removed (${sent.join('; ')})`);
}
