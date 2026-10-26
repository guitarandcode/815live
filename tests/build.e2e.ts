// End-to-end: build the real site the way Cloudflare does (host TZ=UTC) at
// pinned instants, then check which days the built pages list.
// Run with `npm run test:build` (rebuilds dist/, ~5s per case).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

function buildAt(instant: string) {
  execFileSync('npx', ['astro', 'build'], {
    env: { ...process.env, TZ: 'UTC', BUILD_NOW: instant },
    stdio: 'ignore',
  });
  const days = (file: string) =>
    [...readFileSync(`dist/${file}`, 'utf8').matchAll(/data-show-date="([\d-]+)"/g)].map((m) => m[1]);
  const homeHtml = readFileSync('dist/index.html', 'utf8');
  // Home nights the build shows (it also carries hidden ones for the browser to re-sort).
  const home = [...homeHtml.matchAll(/data-night="([\d-]+)"( hidden)?>/g)].filter((m) => !m[2]).map((m) => m[1]);
  return { home, weekend: days('this-weekend.html'), footer: homeHtml, homeHtml };
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

test('home lists recurring events only for 7 days but still builds 9 weeks of pages', () => {
  const { homeHtml } = buildAt('2026-10-24T23:00:00Z');
  assert.match(homeHtml, /href="\/shows\/2026-10-25-marys-place-open-stage"/); // day 2: listed
  assert.match(homeHtml, /href="\/shows\/2026-10-26-screw-city-tavern-name-that-tune"/); // day 3: listed
  // Day 9 is carried hidden for the browser to re-sort a day-old build; day 16 isn't on the page.
  assert.doesNotMatch(homeHtml, /href="\/shows\/2026-11-08-marys-place-open-stage"/);
  assert.ok(existsSync('dist/shows/2026-12-13-marys-place-open-stage.html')); // week 8 page exists
  assert.ok(existsSync('dist/shows/2026-12-14-screw-city-tavern-name-that-tune.html'));
  assert.match(homeHtml, /<h2>Every week<\/h2>/);
  const ics = readFileSync('dist/calendar.ics', 'utf8');
  assert.equal(ics.match(/UID:[^\r]*open-stage@/g)?.length, 9);
});

test('category pages: hidden filter links for empty categories, empty pages noindexed', () => {
  // Far enough out that only weekly nights exist, so comedy is empty.
  buildAt('2027-06-04T18:00:00Z');
  const home = readFileSync('dist/index.html', 'utf8');
  assert.match(home, /href="\/karaoke"/);
  assert.match(home, /href="\/open-mic"/);
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

test('home leads with tonight, a 7-day strip and a date picker', () => {
  const { homeHtml } = buildAt('2026-10-24T23:00:00Z');
  assert.match(homeHtml, /<h1 id="tonight-heading"><span data-home-part>Tonight<\/span> in the/);
  const strip = [...homeHtml.matchAll(/data-strip-date="([\d-]+)"/g)].map((m) => m[1]);
  assert.deepEqual(strip, ['24', '25', '26', '27', '28', '29', '30'].map((d) => `2026-10-${d}`));
  assert.match(homeHtml, /<span class="dc-label">Tonight<\/span>/);
  assert.match(homeHtml, /href="\/date\/2026-10-25"[\s\S]*?Tomorrow/);
  assert.match(homeHtml, /<input[^>]*type="date"[^>]*min="2026-10-24"[^>]*max="2026-12-22"/);
  assert.match(homeHtml, /<form class="date-jump" action="\/calendar"/); // no-JS fallback
  assert.match(homeHtml, /<meta property="og:image" content="https:\/\/815live.com\/og.png">/);
  assert.ok(existsSync('dist/og.png'));
});

test('nothing tonight: the home page says so and points to the next night with events', () => {
  // A Friday far enough out that no one-off shows exist; Saturday karaoke is weekly.
  const { homeHtml } = buildAt('2027-06-04T18:00:00Z');
  assert.match(homeHtml, /<p class="tonight-empty" data-home-empty>/);
  assert.match(homeHtml, /Next up: <a href="\/date\/2027-06-05">Saturday, Jun 5<\/a>/);
  assert.match(homeHtml, /class="tonight-list" data-home-list hidden/);
});

test('home sections: today, later this week through Sunday, then coming up', () => {
  const { homeHtml } = buildAt('2026-10-26T15:00:00Z'); // Monday 10 AM
  assert.match(homeHtml, /<span data-home-part>Today<\/span>/);
  assert.match(homeHtml, /<span data-later-label>Later this week<\/span>/);
  assert.match(homeHtml, /Tue, Oct 27 – Sun, Nov 1/);
  const section = (name: string) => {
    const start = homeHtml.indexOf(`data-home="${name}"`);
    const end = homeHtml.indexOf('data-home="', start + 1);
    return homeHtml.slice(start, end < 0 ? undefined : end);
  };
  const nights = (html: string) => [...html.matchAll(/data-night="([\d-]+)">/g)].map((m) => m[1]);
  assert.deepEqual(nights(section('later')), ['27', '28', '29', '30', '31'].map((d) => `2026-10-${d}`).concat('2026-11-01'));
  assert.ok(nights(section('coming')).every((d) => d > '2026-11-01'));
  assert.match(homeHtml, /href="\/calendar">See everything on the calendar/);
});

test('on a Saturday the second section is the next 7 days', () => {
  const { homeHtml } = buildAt('2026-10-31T17:00:00Z');
  assert.match(homeHtml, /<span data-later-label>Next 7 days<\/span>/);
  assert.match(homeHtml, /Sun, Nov 1 – Sat, Nov 7/);
});

test('submit page: mailto with a template, in the nav and the sitemap', () => {
  buildAt('2026-10-26T15:00:00Z');
  const submit = readFileSync('dist/submit.html', 'utf8');
  assert.match(submit, /href="mailto:shows@815live.com\?subject=Show%20submission&amp;body=Act%20name%3A%20/);
  assert.match(readFileSync('dist/index.html', 'utf8'), /<a class="submit-link" href="\/submit"/);
  assert.match(readFileSync('dist/about.html', 'utf8'), /href="\/submit"/);
  assert.match(readFileSync('dist/sitemap.xml', 'utf8'), /<loc>https:\/\/815live.com\/submit<\/loc>/);
});

test('date pages: 60 days, own titles, empty ones noindexed and out of the sitemap', () => {
  buildAt('2026-10-24T23:00:00Z');
  const files = readdirSync('dist/date').sort();
  assert.equal(files.length, 60);
  assert.equal(files[0], '2026-10-24.html');
  assert.equal(files.at(-1), '2026-12-22.html');
  const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
  assert.match(sitemap, /<loc>https:\/\/815live.com\/calendar<\/loc>/);
  let full = 0;
  let empty = 0;
  for (const f of files) {
    const html = readFileSync(`dist/date/${f}`, 'utf8');
    const date = f.slice(0, -5);
    const hasShows = html.includes('class="show-card');
    const inSitemap = sitemap.includes(`/date/${date}</loc>`);
    assert.equal(html.includes('<meta name="robots" content="noindex">'), !hasShows, f);
    assert.equal(inSitemap, hasShows, f);
    hasShows ? full++ : empty++;
  }
  assert.ok(full > 0 && empty > 0, `need both kinds to test (full ${full}, empty ${empty})`);
  assert.match(
    readFileSync('dist/date/2026-11-14.html', 'utf8'),
    /<title>Live music in Rockford on Saturday, November 14 \| 815live<\/title>/,
  );
  const cal = readFileSync('dist/calendar.html', 'utf8');
  assert.match(cal, /href="\/date\/2026-10-24"/);
  assert.match(cal, /href="\/date\/2026-12-22"/);
  assert.doesNotMatch(cal, /href="\/date\/2026-12-23"/);
});


test('listings show their source, last-checked date and a report link', () => {
  buildAt('2026-10-26T18:00:00Z');
  const page = readFileSync('dist/shows/2026-10-30-best-dam-bar.html', 'utf8');
  assert.match(page, /href="https:\/\/www.facebook.com\/events\/2117510702175424"[^>]*>Facebook event</);
  assert.match(page, /Last checked<\/dt>\s*<dd><time datetime="2026-10-26">/);
  assert.match(page, /href="mailto:shows@815live.com\?subject=Change%3A%20The%20Shifty%20Boys%20Unplugged%20at%20Best%20Dam%20Bar/);
  assert.match(page, /<footer[\s\S]*Shows change; check with the venue before heading out\./);
  // Every card on the home page carries the trust line.
  const home = readFileSync('dist/index.html', 'utf8');
  const cards = home.match(/class="show-card/g)!.length;
  assert.equal(home.match(/class="trust"/g)?.length, cards);
  assert.equal(home.match(/>Report a change</g)?.length, cards);
  assert.doesNotMatch(home, /Checked [A-Z][a-z]{2} \d/); // the checked date is on show pages only
  // Partial line-ups say more acts are coming.
  assert.match(readFileSync('dist/shows/2026-11-07-cahoots-rockford.html', 'utf8'), /Sunset Strip, more TBA/);
});
