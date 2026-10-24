import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isAllowed } from '../scripts/ingest/lib/robots.ts';
import { inferDate, parseEventPage, parseSitemap, toShows } from '../scripts/ingest/adapters/hard-rock-rockford.ts';

test('robots: wildcard and longest-match rules', () => {
  const marys = 'User-agent: *\nDisallow: /calendar/action~*/\nDisallow: /*controller=ai1ec_exporter_controller*\n';
  assert.equal(isAllowed(marys, 'http://x/?plugin=a&controller=ai1ec_exporter_controller&action=export').allowed, false);
  assert.equal(isAllowed(marys, 'http://x/calendar/action~month/').allowed, false);
  assert.equal(isAllowed(marys, 'http://x/calendar/').allowed, true);
  const hr = 'User-agent: *\nAllow: /*.js$\nDisallow: /*.pdf$\nDisallow: /sitecore/\n';
  assert.equal(isAllowed(hr, 'https://x/menu.pdf').allowed, false);
  assert.equal(isAllowed(hr, 'https://x/menu.pdf?v=1').allowed, true); // $ anchors the end
  assert.equal(isAllowed(hr, 'https://x/rockford/entertainment/upcoming-events/a').allowed, true);
  const split = 'User-agent: *\nAllow: /\n\nUser-agent: *\nDisallow: /api/\n'; // groups for * merge
  assert.equal(isAllowed(split, 'https://x/api/v2').allowed, false);
  const ours = 'User-agent: *\nDisallow: /\n\nUser-agent: 815liveBot\nAllow: /events\n';
  assert.equal(isAllowed(ours, 'https://x/events').allowed, true);
  assert.equal(isAllowed('', 'https://x/anything').allowed, true);
});

test('sitemap: event pages and lastmod only', () => {
  const xml = `<urlset>
    <url><loc>https://casino.hardrock.com/rockford/casino</loc><lastmod>2026-01-01</lastmod></url>
    <url><loc>https://casino.hardrock.com/rockford/entertainment/upcoming-events/hairnation</loc><lastmod>2026-09-03</lastmod></url>
    <url><loc>https://casino.hardrock.com/rockford/entertainment/upcoming-events/emily-wendy-2</loc><lastmod>2026-10-16</lastmod></url>
  </urlset>`;
  assert.deepEqual([...parseSitemap(xml)], [
    ['hairnation', '2026-09-03'],
    ['emily-wendy-2', '2026-10-16'],
  ]);
});

test('year inference needs a matching weekday inside the window', () => {
  assert.equal(inferDate('Saturday', 11, 21, '2026-10-24'), '2026-11-21');
  assert.equal(inferDate('Saturday', 1, 2, '2026-10-24'), '2027-01-02'); // next year
  assert.equal(inferDate('Friday', 11, 21, '2026-10-24'), undefined); // weekday doesn't fit
  assert.equal(inferDate('Saturday', 10, 17, '2026-10-24'), '2026-10-17'); // a week back: still found
  assert.equal(inferDate('Saturday', 10, 3, '2026-10-24'), undefined); // too far back
});

// Hand-written page in the shape of a Hard Rock event page (not copied).
const page = (title: string, body: string) =>
  `<html><head><title>${title}</title><script>var x = "Friday, May 1 | 6PM";</script></head><body><main>${body}</main></body></html>`;

test('event page: slots, stages, duplicates and out-of-scope stages', () => {
  const html = page(
    'Test Duo at Hard Rock Casino Rockford',
    `<h1>Test Duo</h1>
     <div>Saturday, October 31 | 6PM</div><div>Hard Rock Cafe</div>
     <div>Saturday, October 31 | 9:30PM</div><div>Council Oak</div>
     <div>Saturday, October 31 | 6PM</div><div>Hard Rock Cafe</div>
     <div>Sunday, November 1 | 7PM</div><div>Hard Rock Live</div>
     <p>Some words about the act.</p>`,
  );
  const { name, slots, skipped } = parseEventPage(html, '2026-10-24');
  assert.equal(name, 'Test Duo');
  assert.deepEqual(slots, [
    { date: '2026-10-31', startTime: '18:00', stage: 'Hard Rock Cafe' },
    { date: '2026-10-31', startTime: '21:30', stage: 'Council Oak' },
  ]);
  assert.equal(skipped.length, 1);
  const shows = toShows('test-duo-2', name, slots);
  assert.deepEqual(
    shows.map((s) => [s.id, s.uid]),
    [
      ['2026-10-31-hard-rock-test-duo-cafe', 'hard-rock-rockford:test-duo-2:2026-10-31T18:00@cafe'],
      ['2026-10-31-hard-rock-test-duo-council-oak', 'hard-rock-rockford:test-duo-2:2026-10-31T21:30@council-oak'],
    ],
  );
  assert.equal(shows[0].artists[0].slug, 'test-duo');
});

test('event page: a weekday that contradicts the date is an error, not a guess', () => {
  const html = page('X at Hard Rock Casino Rockford', '<div>Friday, October 31 | 6PM</div><div>Hard Rock Cafe</div>');
  assert.throws(() => parseEventPage(html, '2026-10-24'), /ambiguous/);
});

test('reconcile: replaces a refetched page, drops removed pages, keeps past and hand-made files', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ingest-'));
  mkdirSync(join(dir, 'shows'));
  mkdirSync(join(dir, 'artists'));
  const put = (id: string, v: object) => writeFileSync(join(dir, 'shows', `${id}.json`), JSON.stringify(v));
  const owned = (page: string, date: string) => ({ date, source: { uid: `hard-rock-rockford:${page}:${date}T18:00@cafe` } });
  put('old-slot', owned('act-a', '2026-11-01')); // act-a refetched without this slot -> deleted
  put('gone', owned('act-b', '2026-11-02')); // act-b no longer in sitemap -> deleted
  put('past', owned('act-b', '2026-10-01')); // past -> kept
  put('kept', owned('act-c', '2026-11-03')); // act-c unchanged (not refetched) -> kept
  put('manual', { date: '2026-11-04', source: { type: 'manual' } }); // hand-made -> kept
  process.env.INGEST_DATA = dir;
  const { reconcile } = await import(`../scripts/ingest/lib/store.ts?t=${Date.now()}`);
  const shows = toShows('act-a', 'Act A', [{ date: '2026-11-08', startTime: '18:00', stage: 'Hard Rock Cafe' }]);
  const changes = reconcile('hard-rock-rockford', new Map([['act-a', shows]]), new Set(['act-a', 'act-c']), '2026-10-24');
  assert.deepEqual(changes.deleted.sort(), ['gone', 'old-slot']);
  assert.deepEqual(readdirSync(join(dir, 'shows')).sort(), ['2026-11-08-hard-rock-act-a.json', 'kept.json', 'manual.json', 'past.json']);
  assert.deepEqual(changes.artistsCreated, ['act-a']);
  assert.equal(JSON.parse(readFileSync(join(dir, 'artists', 'act-a.json'), 'utf8')).auto, true);
  // Running again with the same input changes nothing.
  const again = reconcile('hard-rock-rockford', new Map([['act-a', shows]]), new Set(['act-a', 'act-c']), '2026-10-24');
  assert.deepEqual([again.written, again.deleted], [[], []]);
  delete process.env.INGEST_DATA;
});
