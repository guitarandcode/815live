// When a source lists nothing, each adapter throws (so the run keeps every
// existing listing) and the error says what the server actually sent.
// fetch is stubbed: no network, robots.txt is a 404 (everything allowed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptySourceError, type Fetched } from '../scripts/ingest/lib/http.ts';
import * as fozzys from '../scripts/ingest/adapters/fozzys.ts';
import * as hardRock from '../scripts/ingest/adapters/hard-rock-rockford.ts';
import * as inscape from '../scripts/ingest/adapters/inscape-collective.ts';
import * as mpac from '../scripts/ingest/adapters/mendelssohn-pac.ts';
import * as rpl from '../scripts/ingest/adapters/rpl-nordlof.ts';

const MAINTENANCE = '<!DOCTYPE html>\n<html>\n  <body>\n\n    <h1>Briefly   unavailable</h1>\n  </body>\n</html>\n';
const COLLAPSED = '<!DOCTYPE html> <html> <body> <h1>Briefly unavailable</h1> </body> </html>';

const realFetch = globalThis.fetch;
const requested: string[] = [];
globalThis.fetch = (async (input: string | URL) => {
  const url = String(input);
  requested.push(url);
  if (url.endsWith('/robots.txt')) return new Response('', { status: 404 });
  if (url === 'https://fozzys.net/sitemap_index.xml')
    return new Response('<sitemapindex><sitemap><loc>https://fozzys.net/mec-events-sitemap.xml</loc></sitemap></sitemapindex>', {
      headers: { 'content-type': 'application/xml' },
    });
  return new Response(MAINTENANCE, { headers: { 'content-type': 'text/html; charset=UTF-8' } });
}) as typeof fetch;
test.after(() => {
  globalThis.fetch = realFetch;
});

test('emptySourceError: status, type, byte size, and the first 300 characters with whitespace collapsed', () => {
  const r = (text: string): Fetched => ({ url: 'https://x/feed', status: 200, contentType: 'text/plain', bytes: Buffer.byteLength(text), text });
  assert.equal(
    emptySourceError('feed had no events', r(' a\n\n\tb  ')).message,
    'feed had no events; refusing to treat every listing as removed (https://x/feed: HTTP 200, text/plain, 8 bytes, body: "a b")',
  );
  const long = emptySourceError('x', r('é'.repeat(400))).message;
  assert.ok(long.includes(', 800 bytes, ')); // bytes, not characters
  assert.ok(long.includes(`body: "${'é'.repeat(300)}…"`) && !long.includes('é'.repeat(301)));
  assert.match(emptySourceError('x', r('')).message, /0 bytes, body: ""\)$/);
  const two = emptySourceError('none', [r('one'), { ...r('two'), url: 'https://x/2' }]).message;
  assert.match(two, /https:\/\/x\/feed: .*body: "one"; https:\/\/x\/2: .*body: "two"\)$/);
});

const cases: [string, (today: string) => Promise<unknown>, string, string][] = [
  ['mendelssohn-pac', (t) => mpac.run({}, t), 'feed had no events', 'https://www.mendelssohnpac.org/feed/eo-events/'],
  ['rpl-nordlof', (t) => rpl.run({}, t), 'feed had no events', rpl.FEED],
  ['hard-rock-rockford', (t) => hardRock.run({}, t), 'sitemap had no event pages', 'https://casino.hardrock.com/rockford/sitemap.xml'],
  ['inscape-collective', (t) => inscape.run({}, t), 'sitemap had no event pages', 'https://www.inscapecollective.org/event-pages-sitemap.xml'],
  ['fozzys', (t) => fozzys.run({}, t), 'event sitemaps listed no events', 'https://fozzys.net/mec-events-sitemap.xml'],
];

for (const [id, run, what, url] of cases) {
  test(`${id}: an empty source throws with what the server sent`, async () => {
    const bytes = Buffer.byteLength(MAINTENANCE);
    await assert.rejects(run('2026-11-19'), (e: Error) => {
      assert.ok(e.message.startsWith(`${what}; refusing to treat every listing as removed (`), e.message);
      assert.ok(e.message.includes(`HTTP 200, text/html; charset=UTF-8, ${bytes} bytes, body: "${COLLAPSED}")`), e.message);
      assert.ok(e.message.includes(`${url}: HTTP 200`), e.message);
      return true;
    });
  });
}

test('an empty source fetches nothing past the listing it checked', () => {
  // Only robots.txt, the listing itself, and Fozzy's sitemap index: no event pages.
  assert.ok(requested.every((u) => u.endsWith('/robots.txt') || /feed|sitemap/i.test(u)), requested.join('\n'));
});
