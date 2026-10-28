// End-to-end: build the real site the way Cloudflare does (host TZ=UTC) at
// pinned instants, then check which days the built pages list.
// Run with `npm run test:build` (rebuilds dist/, ~5s per case).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Fixed records for cases that must not depend on real listings (see its README). */
const FIXTURES = 'tests/fixtures/data';

function buildAt(instant: string, opts: { data?: string; env?: Record<string, string> } = {}) {
  execFileSync('npx', ['astro', 'build'], {
    env: { ...process.env, TZ: 'UTC', BUILD_NOW: instant, ...(opts.data && { SITE_DATA: opts.data }), ...opts.env },
    stdio: 'ignore',
  });
  const days = (file: string) =>
    [...readFileSync(`dist/${file}`, 'utf8').matchAll(/data-show-date="([\d-]+)"/g)].map((m) => m[1]);
  const homeHtml = readFileSync('dist/index.html', 'utf8');
  // Home nights the build shows (it also carries hidden ones for the browser to re-sort).
  const home = [...homeHtml.matchAll(/data-night="([\d-]+)"( hidden)?>/g)].filter((m) => !m[2]).map((m) => m[1]);
  return { home, weekend: days('this-weekend.html'), footer: homeHtml, homeHtml };
}

/** Site path of each built page -> the internal paths its plain hrefs link to (not links scripts add later). */
function linkGraph(): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, e.name);
      if (e.isDirectory()) walk(file);
      else if (e.name.endsWith('.html')) {
        const page = '/' + relative('dist', file).replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '');
        const links = new Set<string>();
        for (const [, href] of readFileSync(file, 'utf8').matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
          const url = new URL(href.replaceAll('&amp;', '&'), `https://815live.com${page}`);
          if (url.origin === 'https://815live.com') links.add(url.pathname.replace(/\.html$/, '').replace(/(.)\/$/, '$1'));
        }
        graph.set(page, links);
      }
    }
  };
  walk('dist');
  return graph;
}

test('23:00 UTC build (6pm Chicago) still lists tonight', () => {
  const { home, weekend, footer } = buildAt('2026-10-24T23:00:00Z');
  assert.equal(home[0], '2026-10-24');
  assert.deepEqual(weekend.filter((d) => d < '2026-10-26'), weekend); // only Sat/Sun of this weekend
  assert.ok(weekend.includes('2026-10-24'));
  assert.match(footer, /Listings updated <time[^>]*>Oct 24, 2026, 6:00 PM<\/time>/);
  assert.doesNotMatch(footer, /All times Central|\d PM CT\b/); // readers are local; zone stays in JSON-LD
});

test('04:30 UTC build (11:30pm Chicago, already "tomorrow" in UTC) still lists tonight', () => {
  assert.equal(buildAt('2026-10-25T04:30:00Z').home[0], '2026-10-24');
});

test('weekly rules: listed for 7 days on the home page, expanded 8 weeks out, never further', () => {
  // Friday Jun 4, 2027 (1 PM Chicago). Horizon: 8 weeks = through Thu Jul 29.
  const { homeHtml } = buildAt('2027-06-04T18:00:00Z', { data: FIXTURES });
  assert.match(homeHtml, /href="\/shows\/2027-06-05-fixture-karaoke-saturday"/); // day 2: listed
  assert.match(homeHtml, /href="\/shows\/2027-06-09-fixture-open-mic-wednesday"/); // day 6: listed
  assert.doesNotMatch(homeHtml, /href="\/shows\/2027-06-19-fixture-karaoke-saturday"/); // day 16: not on the page
  assert.match(homeHtml, /<h2>Every week<\/h2>/);
  const pages = readdirSync('dist/shows').filter((f) => f.includes('fixture-karaoke-saturday')).sort();
  assert.equal(pages.length, 8);
  assert.equal(pages[0], '2027-06-05-fixture-karaoke-saturday.html');
  assert.equal(pages.at(-1), '2027-07-24-fixture-karaoke-saturday.html'); // 8th Saturday
  assert.ok(!existsSync('dist/shows/2027-07-31-fixture-karaoke-saturday.html')); // 9th: past the horizon
  assert.ok(existsSync('dist/shows/2027-07-28-fixture-open-mic-wednesday.html')); // 8th Wednesday
  assert.ok(!existsSync('dist/shows/2027-08-04-fixture-open-mic-wednesday.html'));
  const ics = readFileSync('dist/calendar.ics', 'utf8');
  assert.equal(ics.match(/UID:[^\r]*fixture-karaoke-saturday@/g)?.length, 8);
  assert.doesNotMatch(readFileSync('dist/sitemap.xml', 'utf8'), /2027-07-31-fixture-karaoke/);
});

test('category pages: hidden filter links for empty categories, empty pages noindexed', () => {
  buildAt('2027-06-04T18:00:00Z', { data: FIXTURES }); // the fixtures have no comedy
  const home = readFileSync('dist/index.html', 'utf8');
  assert.match(home, /href="\/open-mic"/);
  assert.doesNotMatch(home, /href="\/comedy"/);
  // Other categories hang off /other-events, not the main row.
  const other = readFileSync('dist/other-events.html', 'utf8');
  assert.match(other, /<nav class="filters sub"[^>]*>[\s\S]*href="\/bingo"[\s\S]*href="\/karaoke"/);
  assert.doesNotMatch(other, /href="\/comedy"/);
  assert.match(readFileSync('dist/comedy.html', 'utf8'), /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(readFileSync('dist/sitemap.xml', 'utf8'), /\/comedy</);
  const karaoke = readFileSync('dist/karaoke.html', 'utf8');
  assert.doesNotMatch(karaoke, /Fixture Open Mic/);
  assert.match(karaoke, /Every week<\/h2>[\s\S]*Saturdays, \d/); // weekly rules listed once
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
  assert.match(homeHtml, /href="\/tomorrow" data-day-link="2026-10-25"[\s\S]*?Tomorrow/);
  assert.match(homeHtml, /<input[^>]*type="date"[^>]*min="2026-10-24"[^>]*max="2026-12-18"/);
  assert.match(homeHtml, /<form class="date-jump" action="\/calendar"/); // no-JS fallback
  assert.match(homeHtml, /<meta property="og:image" content="https:\/\/815live.com\/og.png">/);
  assert.ok(existsSync('dist/og.png'));
});

test('nothing tonight: the home page says so and points to the next night with events', () => {
  // A Tuesday; the fixtures' only weekly nights are Wednesday and Saturday.
  const { homeHtml } = buildAt('2027-06-01T18:00:00Z', { data: FIXTURES });
  assert.match(homeHtml, /<p class="tonight-empty" data-home-empty>/);
  assert.match(homeHtml, /Next up: <a href="\/tomorrow" data-day-link="2027-06-02">Wednesday, Jun 2<\/a>/);
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

test('date pages: 56 days (the recurring horizon), own titles, empty ones noindexed and out of the sitemap', () => {
  buildAt('2026-10-24T23:00:00Z');
  const files = readdirSync('dist/date').sort();
  assert.equal(files.length, 56);
  assert.equal(files[0], '2026-10-24.html');
  assert.equal(files.at(-1), '2026-12-18.html');
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
  assert.match(cal, /href="\/date\/2026-12-18"/);
  assert.doesNotMatch(cal, /href="\/date\/2026-12-19"/);
  assert.doesNotMatch(sitemap, /\/date\/2026-12-19</);
  // The pager stops at the last date page; the one before it still links forward.
  assert.doesNotMatch(readFileSync('dist/date/2026-12-18.html', 'utf8'), /rel="next"/);
  assert.match(readFileSync('dist/date/2026-12-17.html', 'utf8'), /href="\/date\/2026-12-18" rel="next"/);
  assert.match(readFileSync('dist/date/2026-12-18.html', 'utf8'), /<input[^>]*max="2026-12-18"/);
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

test('tonight, tomorrow and free landing pages', () => {
  buildAt('2026-10-27T23:00:00Z'); // Tuesday 6 PM Chicago
  const days = (file: string) => [...readFileSync(`dist/${file}`, 'utf8').matchAll(/data-show-date="([\d-]+)"/g)].map((m) => m[1]);
  assert.ok(days('tonight.html').every((d) => d === '2026-10-27' || d === '2026-10-28'));
  assert.ok(days('tonight.html').includes('2026-10-27'));
  assert.ok(days('tomorrow.html').every((d) => d === '2026-10-28' || d === '2026-10-29'));
  assert.match(readFileSync('dist/tonight.html', 'utf8'), /<title>Live Music in Rockford Tonight \| 815live<\/title>/);
  const free = readFileSync('dist/free.html', 'utf8');
  assert.match(free, /<title>Free Live Music in Rockford \| 815live<\/title>/);
  for (const [, id] of free.matchAll(/href="\/shows\/([^"]+)"/g)) {
    const file = `data/shows/${id}.json`;
    if (existsSync(file)) {
      const cover = JSON.parse(readFileSync(file, 'utf8')).cover;
      assert.ok(cover === null || cover === 0, `${id} is on /free with cover ${cover}`);
    }
  }
  const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
  for (const p of ['tonight', 'tomorrow', 'free']) assert.match(sitemap, new RegExp(`<loc>https://815live.com/${p}</loc>`));
});

test('Chicago dates on a UTC build: 02:00 UTC is still the previous evening', () => {
  // Wed Oct 28, 02:00 UTC = Tue Oct 27, 9 PM in Chicago (CDT).
  buildAt('2026-10-28T02:00:00Z', { data: FIXTURES });
  const read = (f: string) => readFileSync(`dist/${f}`, 'utf8');
  const days = (f: string) => [...read(f).matchAll(/data-show-date="([\d-]+)"/g)].map((m) => m[1]);
  assert.deepEqual(days('tonight.html'), ['2026-10-27']);
  assert.match(read('tonight.html'), /Tuesday, October 27 in Rockford/);
  assert.match(read('tonight.html'), /href="\/shows\/2026-10-27-fixture-hall"/);
  assert.deepEqual([...new Set(days('tomorrow.html'))], ['2026-10-28']);
  assert.match(read('tomorrow.html'), /Wednesday, October 28 in Rockford/);
  assert.match(read('index.html'), /data-built="2026-10-27"/);
  const dates = readdirSync('dist/date').sort();
  assert.equal(dates[0], '2026-10-27.html');
  const sitemapDates = [...read('sitemap.xml').matchAll(/\/date\/([\d-]+)</g)].map((m) => m[1]);
  assert.equal(sitemapDates[0], '2026-10-27');
  assert.ok(!sitemapDates.includes('2026-10-26'));
  assert.match(read('this-weekend.html'), /Fri, Oct 30 – Sun, Nov 1/);
});

test('preview builds keep production canonicals and sitemap URLs', () => {
  buildAt('2026-10-28T02:00:00Z', {
    data: FIXTURES,
    env: { CF_PAGES: '1', CF_PAGES_BRANCH: 'seo-and-sources', CF_PAGES_URL: 'https://abc123.815live.pages.dev' },
  });
  const tonight = readFileSync('dist/tonight.html', 'utf8');
  assert.match(tonight, /<link rel="canonical" href="https:\/\/815live.com\/tonight">/);
  assert.match(tonight, /<meta property="og:url" content="https:\/\/815live.com\/tonight">/);
  const locs = [...readFileSync('dist/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 0 && locs.every((u) => u.startsWith('https://815live.com/')));
  assert.doesNotMatch(readFileSync('dist/index.html', 'utf8'), /pages\.dev/);
});


test('internal links: home, header, day strip and filters reach /tonight, /tomorrow and /free', () => {
  buildAt('2026-10-27T23:00:00Z'); // Tuesday 6 PM
  const read = (f: string) => readFileSync(`dist/${f}`, 'utf8');
  const home = read('index.html');
  assert.match(home, /<nav aria-label="Main">\s*<a href="\/tonight">Tonight<\/a>/);
  assert.match(home, /href="\/tonight" data-day-link="2026-10-27" class="day-chip/);
  assert.match(home, /href="\/tomorrow" data-day-link="2026-10-28" class="day-chip/);
  assert.match(home, /href="\/date\/2026-10-29" data-day-link="2026-10-29" class="day-chip/);
  assert.doesNotMatch(home, /href="\/date\/2026-10-2[78]"/);
  assert.match(home, /<nav class="home-quick"[\s\S]*href="\/tomorrow"[\s\S]*href="\/free"/);
  assert.match(home, /<nav class="filters"[\s\S]*?<a href="\/free">Free<\/a>/);
  assert.match(read('karaoke.html'), /<nav class="filters"[\s\S]*?<a href="\/free">Free<\/a>/);
  assert.match(read('free.html'), /<a href="\/free" aria-current="page">Free<\/a>/);
  // Home and /tonight, and the date pages and the landing pages, don't share a title or h1.
  const head = (f: string) => [read(f).match(/<title>([^<]*)/)![1], read(f).match(/<h1[^>]*>([\s\S]*?)<\/h1>/)![1]];
  const pages = ['index.html', 'tonight.html', 'date/2026-10-27.html', 'tomorrow.html', 'date/2026-10-28.html'];
  for (const part of [0, 1]) assert.equal(new Set(pages.map((f) => head(f)[part])).size, pages.length);
  assert.match(read('date/2026-10-27.html'), /<link rel="canonical" href="https:\/\/815live.com\/date\/2026-10-27">/);
  assert.match(read('date/2026-10-27.html'), /<a href="\/tonight">Tonight<\/a>/);
  assert.match(read('date/2026-10-28.html'), /<a href="\/tomorrow">Tomorrow<\/a>/);
});

/** A page's <main>, so names in its <head> (title, description) don't count. */
const main = (html: string) => html.slice(html.indexOf('<main'));

/** Sitemap URLs that no other built page links to. */
function orphans(): string[] {
  const graph = linkGraph();
  const inbound = new Map<string, number>();
  for (const [page, links] of graph) for (const to of links) if (to !== page) inbound.set(to, (inbound.get(to) ?? 0) + 1);
  const locs = [...readFileSync('dist/sitemap.xml', 'utf8').matchAll(/<loc>https:\/\/815live\.com([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
  assert.ok(locs.length > 0);
  return locs.filter((p) => !inbound.get(p));
}

test('no orphans: every page in the sitemap is linked from some other page', () => {
  buildAt(new Date().toISOString()); // today's real listings, as the daily build sees them
  assert.ok(readFileSync('dist/sitemap.xml', 'utf8').split('<loc>').length > 100);
  const found = orphans();
  assert.deepEqual(found, [], `sitemap pages nothing links to: ${found.join(', ')}`);
});

test('past shows keep their pages but leave the sitemap', () => {
  buildAt('2026-10-29T18:00:00Z', { data: FIXTURES }); // the fixture shows are Oct 27 and 28
  assert.ok(existsSync('dist/shows/2026-10-27-fixture-hall.html'));
  assert.doesNotMatch(readFileSync('dist/sitemap.xml', 'utf8'), /\/shows\/2026-10-2[78]-fixture-(hall|bar)</);
});

test('other events: music first, then "Also happening", on home, /tonight and date pages', () => {
  buildAt('2026-10-28T17:00:00Z', { data: FIXTURES }); // Wed noon: open mic, a band, then trivia
  const read = (f: string) => readFileSync(`dist/${f}`, 'utf8');
  const home = read('index.html');
  const night = home.slice(home.indexOf('data-night="2026-10-28"'));
  assert.ok(night.indexOf('Wednesday Fixture Show') < night.indexOf('data-also'));
  assert.ok(night.indexOf('data-also') < night.indexOf('Fixture Trivia'));
  for (const f of ['tonight.html', 'date/2026-10-28.html']) {
    const html = main(read(f));
    const also = html.indexOf('<section class="also"');
    assert.ok(also > 0, `${f} has an Also happening section`);
    assert.ok(html.indexOf('Fixture Open Mic') < also && html.indexOf('Wednesday Fixture Show') < also);
    assert.ok(html.indexOf('Fixture Trivia') > also);
    assert.match(html.slice(also), /<a href="\/trivia">Trivia<\/a>[\s\S]*<a href="\/other-events">All other events<\/a>/);
  }
  // The filter row: music, Free, then Other events, off by default.
  const filters = home.match(/<nav class="filters"[^>]*>([\s\S]*?)<\/nav>/)![1];
  assert.deepEqual([...filters.matchAll(/href="([^"]+)"/g)].map((m) => m[1]), ['/', '/live-music', '/open-mic', '/free', '/other-events']);
  assert.match(filters, /href="\/free"[^>]*>Free<\/a>\s*<a href="\/other-events" class="side"\s*>/);
  assert.doesNotMatch(filters, /href="\/(karaoke|trivia|bingo)"/);
  // Category pages: their own titles; 'other' has no page; empty ones stay noindexed and out of the sitemap.
  assert.match(read('trivia.html'), /<title>Trivia nights in Rockford, IL \| 815live<\/title>/);
  assert.match(read('trivia.html'), /<h1>Trivia nights<\/h1>/);
  assert.match(read('bingo.html'), /<title>Bingo in Rockford, IL: tonight and this week \| 815live<\/title>/);
  assert.match(read('bingo.html'), /<meta name="description" content="Where to play bingo in Rockford/);
  assert.match(read('karaoke.html'), /<title>Karaoke nights in Rockford, IL \| 815live<\/title>/); // unchanged
  assert.match(read('comedy.html'), /<title>Comedy shows in Rockford, IL \| 815live<\/title>/); // unchanged
  assert.match(read('comedy.html'), /<meta name="robots" content="noindex">/);
  assert.match(read('other-events.html'), /<title>Trivia, Bingo, Karaoke and Comedy in Rockford \| 815live<\/title>/);
  assert.ok(!existsSync('dist/other.html'));
  const sitemap = read('sitemap.xml');
  for (const p of ['other-events', 'trivia', 'bingo', 'karaoke', 'open-mic']) assert.match(sitemap, new RegExp(`<loc>https://815live.com/${p}</loc>`));
  assert.doesNotMatch(sitemap, /\/(comedy|other)</);
  assert.deepEqual(orphans(), []);
});

test('JSON-LD: MusicEvent for music, SocialEvent for games and karaoke, no bands on non-music', () => {
  buildAt('2026-10-28T17:00:00Z', { data: FIXTURES });
  const ld = (id: string) => {
    const html = readFileSync(`dist/shows/${id}.html`, 'utf8');
    return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).find((o) => o.startDate);
  };
  assert.equal(ld('2026-10-28-fixture-hall')['@type'], 'MusicEvent');
  assert.equal(ld('2026-10-28-fixture-hall').performer[0]['@type'], 'MusicGroup');
  assert.equal(ld('2026-10-28-fixture-open-mic-wednesday')['@type'], 'MusicEvent');
  assert.equal(ld('2026-10-28-fixture-bar')['@type'], 'SocialEvent');
  assert.equal(ld('2026-10-28-fixture-bar').performer, undefined);
  assert.equal(ld('2026-10-31-fixture-karaoke-saturday')['@type'], 'SocialEvent');
});

test('no music tonight: the empty note, then Also happening, and Next up skips non-music nights', () => {
  buildAt('2027-06-04T18:00:00Z', { data: FIXTURES }); // Fri: bingo only; Sat: karaoke only; Wed: open mic
  const read = (f: string) => readFileSync(`dist/${f}`, 'utf8');
  const home = read('index.html');
  assert.match(home, /<p class="tonight-empty" data-home-empty>\s*No live music listed for/);
  assert.match(home, /class="tonight-list" data-home-list>/); // shown, for the bingo
  assert.match(home, /data-night="2027-06-04">[\s\S]*?data-also[\s\S]*?Fixture Bingo/);
  assert.match(home, /Next up: <a href="\/date\/2027-06-09" data-day-link="2027-06-09">/);
  assert.match(home, /<h2>Every week<\/h2>[\s\S]*Fixture Open Mic[\s\S]*<h2>Also every week<\/h2>[\s\S]*Fixture Karaoke/);
  const tonight = main(read('tonight.html'));
  assert.match(tonight, /No live music listed for tonight/);
  assert.ok(tonight.indexOf('Fixture Bingo') > tonight.indexOf('<section class="also"'));
  const free = main(read('free.html'));
  assert.ok(free.indexOf('Fixture Bingo') > free.indexOf('Also free') && free.indexOf('Fixture Open Mic') < free.indexOf('Also free'));
});
