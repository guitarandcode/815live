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

export async function fetchText(url: string): Promise<string> {
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
    return res.text();
  }
  throw new Error(`Too many redirects for ${url}`);
}
