// End-to-end: build the real site the way Cloudflare does (host TZ=UTC) at
// pinned instants, then check which days the built pages list.
// Run with `npm run test:build` (rebuilds dist/, ~5s per case).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function buildAt(instant: string) {
  execFileSync('npx', ['astro', 'build'], {
    env: { ...process.env, TZ: 'UTC', BUILD_NOW: instant },
    stdio: 'ignore',
  });
  const days = (file: string) =>
    [...readFileSync(`dist/${file}`, 'utf8').matchAll(/data-show-date="([\d-]+)"/g)].map((m) => m[1]);
  return { home: days('index.html'), weekend: days('this-weekend.html'), footer: readFileSync('dist/index.html', 'utf8') };
}

test('23:00 UTC build (6pm Chicago) still lists tonight', () => {
  const { home, weekend, footer } = buildAt('2026-10-24T23:00:00Z');
  assert.equal(home[0], '2026-10-24');
  assert.deepEqual(weekend, ['2026-10-24', '2026-10-25']);
  assert.match(footer, /Listings updated <time[^>]*>Oct 24, 2026, 6:00 PM CT<\/time>/);
});

test('04:30 UTC build (11:30pm Chicago, already "tomorrow" in UTC) still lists tonight', () => {
  assert.equal(buildAt('2026-10-25T04:30:00Z').home[0], '2026-10-24');
});

test('recurring Sunday open stage expands for 8 weeks from the build date', () => {
  const { home } = buildAt('2026-10-24T23:00:00Z');
  const sundays = home.filter((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 0);
  assert.equal(sundays.length, 8);
  assert.equal(sundays[0], '2026-10-25');
  assert.equal(sundays.at(-1), '2026-12-13');
});

test('Monday build: this weekend means the coming Fri–Sun', () => {
  const { home, weekend } = buildAt('2026-10-26T15:00:00Z');
  assert.ok(!home.includes('2026-10-25'));
  assert.deepEqual(weekend, ['2026-10-30', '2026-11-01']); // nothing listed Sat Oct 31
});
