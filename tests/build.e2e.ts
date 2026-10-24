// End-to-end: build the real site the way Cloudflare does (host TZ=UTC) at
// pinned instants, then check which days the built pages list.
// Run with `npm run test:build` (rebuilds dist/, ~5s per case).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

function buildAt(instant: string) {
  execFileSync('npx', ['astro', 'build'], {
    env: { ...process.env, TZ: 'UTC', BUILD_NOW: instant },
    stdio: 'ignore',
  });
  const days = (file: string) =>
    [...readFileSync(`dist/${file}`, 'utf8').matchAll(/data-show-date="([\d-]+)"/g)].map((m) => m[1]);
  const homeHtml = readFileSync('dist/index.html', 'utf8');
  return { home: days('index.html'), weekend: days('this-weekend.html'), footer: homeHtml, homeHtml };
}

test('23:00 UTC build (6pm Chicago) still lists tonight', () => {
  const { home, weekend, footer } = buildAt('2026-10-24T23:00:00Z');
  assert.equal(home[0], '2026-10-24');
  assert.deepEqual(weekend.filter((d) => d < '2026-10-26'), weekend); // only Sat/Sun of this weekend
  assert.ok(weekend.includes('2026-10-24'));
  assert.match(footer, /Listings updated <time[^>]*>Oct 24, 2026, 6:00 PM CT<\/time>/);
});

test('04:30 UTC build (11:30pm Chicago, already "tomorrow" in UTC) still lists tonight', () => {
  assert.equal(buildAt('2026-10-25T04:30:00Z').home[0], '2026-10-24');
});

test('home lists recurring events only for 7 days but still builds 8 weeks of pages', () => {
  const { homeHtml } = buildAt('2026-10-24T23:00:00Z');
  assert.match(homeHtml, /href="\/shows\/2026-10-25-marys-place-open-stage"/); // day 2: listed
  assert.match(homeHtml, /href="\/shows\/2026-10-26-screw-city-tavern-name-that-tune"/); // day 3: listed
  assert.doesNotMatch(homeHtml, /href="\/shows\/2026-11-01-marys-place-open-stage"/); // day 9: not listed
  assert.ok(existsSync('dist/shows/2026-12-13-marys-place-open-stage.html')); // week 8 page exists
  assert.ok(existsSync('dist/shows/2026-12-14-screw-city-tavern-name-that-tune.html'));
  assert.match(homeHtml, /<h2>Every week<\/h2>/);
  const ics = readFileSync('dist/calendar.ics', 'utf8');
  assert.equal(ics.match(/UID:[^\r]*open-stage@/g)?.length, 8);
});

test('category pages: hidden filter links for empty categories, empty pages noindexed', () => {
  buildAt('2026-10-24T23:00:00Z');
  const home = readFileSync('dist/index.html', 'utf8');
  assert.match(home, /href="\/karaoke"/);
  assert.match(home, /href="\/open-mic"/);
  assert.match(home, /href="\/live-music"/);
  assert.doesNotMatch(home, /href="\/comedy"/);
  assert.match(readFileSync('dist/comedy.html', 'utf8'), /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(readFileSync('dist/sitemap.xml', 'utf8'), /\/comedy</);
  const karaoke = readFileSync('dist/karaoke.html', 'utf8');
  assert.doesNotMatch(karaoke, /Open Stage/);
  assert.match(karaoke, /Every week<\/h2>[\s\S]*(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)days, \d/); // weekly rules listed once
});

test('Monday build: this weekend means the coming Fri–Sun', () => {
  const { home, weekend } = buildAt('2026-10-26T15:00:00Z');
  assert.ok(!home.includes('2026-10-25'));
  assert.ok(weekend.length > 0);
  assert.ok(weekend.every((d) => d >= '2026-10-30' && d <= '2026-11-01'));
});
