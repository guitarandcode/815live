import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crawlDelay, isAllowed } from '../scripts/ingest/lib/robots.ts';
import { parseIcs } from '../scripts/ingest/lib/ics.ts';
import { matchArtist } from '../scripts/ingest/lib/artists.ts';
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
  const written = JSON.parse(readFileSync(join(dir, 'shows', '2026-11-08-hard-rock-act-a.json'), 'utf8'));
  assert.equal(written.checked, '2026-10-24');
  assert.equal(written.source.kind, 'venue');
  // Running again with the same input changes nothing.
  const again = reconcile('hard-rock-rockford', new Map([['act-a', shows]]), new Set(['act-a', 'act-c']), '2026-10-24');
  assert.deepEqual([again.written, again.deleted], [[], []]);
  delete process.env.INGEST_DATA;
});

test('robots: crawl-delay from our group, else *', () => {
  assert.equal(crawlDelay('user-agent: * \ndisallow: \ncrawl-delay: 60\n'), 60);
  assert.equal(crawlDelay('User-agent: *\nCrawl-delay: 60\n\nUser-agent: 815liveBot\nAllow: /\n'), 0);
  assert.equal(crawlDelay(''), 0);
});

test('ics: folded lines, escapes, Chicago TZID and UTC times', () => {
  const ics = [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'UID:1',
    'DTSTART;TZID=America/Chicago:20261204T190000',
    'SUMMARY: Christmas with the Abram',
    '  Collier Nonet',
    'URL:https://x/events/event/thursday-jazz-120326/',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:2',
    'DTSTART:20261028T223000Z',
    'DTEND:20261029T010000Z',
    'SUMMARY:Rev\\, Raven',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:3',
    'DTSTART:20261121T000000Z', // 6 PM CST the day before in UTC terms
    'SUMMARY:After DST',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const [a, b, c] = parseIcs(ics);
  assert.equal(a.summary, 'Christmas with the Abram Collier Nonet');
  assert.deepEqual(a.start, { date: '2026-12-04', time: '19:00' });
  assert.equal(b.summary, 'Rev, Raven');
  assert.deepEqual([b.start, b.end], [{ date: '2026-10-28', time: '17:30' }, { date: '2026-10-28', time: '20:00' }]);
  assert.deepEqual(c.start, { date: '2026-11-20', time: '18:00' });
  assert.throws(() => parseIcs('BEGIN:VEVENT\nDTSTART;TZID=America/New_York:20261204T190000\nEND:VEVENT'), /unsupported TZID/);
});

test('artists: exact matches reuse the slug; near names are flagged', () => {
  assert.deepEqual(matchArtist('Emily Hurd'), { slug: 'emily-hurd', name: 'Emily Hurd', existing: true, near: [] });
  const nonet = matchArtist('Abram Collier Nonet');
  assert.equal(nonet.existing, false);
  assert.deepEqual(nonet.near, ['abram-collier-quintet']);
});

test('dry run and hand-entered shows: nothing written; a person\'s entry wins', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ingest-'));
  mkdirSync(join(dir, 'shows'));
  mkdirSync(join(dir, 'artists'));
  writeFileSync(join(dir, 'shows', 'hand.json'), JSON.stringify({ date: '2026-11-20', startTime: '18:00', venue: 'v', source: { type: 'manual' } }));
  process.env.INGEST_DATA = dir;
  const store = await import(`../scripts/ingest/lib/store.ts?t=${Date.now()}`);
  const show = (date: string) => ({ id: `${date}-x`, uid: `a:g:${date}`, date, startTime: '17:00', venue: 'v', category: 'live-music', artists: [{ slug: 'x', name: 'X' }], sourceUrl: 'https://x' });
  const log: string[] = [];
  const kept = store.deferToHandEntered([show('2026-11-20'), show('2026-11-21')], log);
  assert.deepEqual(kept.map((s: { date: string }) => s.date), ['2026-11-21']);
  assert.match(log[0], /kept hand-entered hand over 2026-11-20-x \(NOTE: source says 17:00, file says 18:00\)/);
  const changes = store.reconcile('a', new Map([['g', kept]]), new Set(['g']), '2026-10-27', true);
  assert.deepEqual([changes.written, changes.artistsCreated], [['2026-11-21-x'], ['x']]);
  assert.match(changes.details[0], /^\+ 2026-11-21-x: 2026-11-21 17:00 \[x\]/);
  assert.deepEqual(readdirSync(join(dir, 'shows')), ['hand.json']);
  assert.deepEqual(readdirSync(join(dir, 'artists')), []);
  delete process.env.INGEST_DATA;
});
