import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planTags, rankVenues, noEmDash, handleStatus } from '../scripts/social/venue-tags.mjs';

const v = (ig: string | null, extra: Record<string, unknown> = {}) => ({
  name: ig ?? 'x',
  social: { ...(ig ? { ig, fb: `https://facebook.com/${ig}` } : {}), verified: true, ...extra },
});

test('venue tags: category order, then small before large, then caption order', () => {
  const venues = { casino: v('casino', { large: true }), bar: v('bar'), club: v('club'), pub: v('pub'), next: v('next') };
  const order = rankVenues(
    [
      { venue: 'pub', category: 'trivia' },
      { venue: 'club', category: 'dj' },
      { venue: 'casino', category: 'live-music' },
      { venue: 'bar', category: 'live-music' },
      { venue: 'next', category: 'live-music', coming: true },
      { venue: 'pub', category: 'karaoke' },
    ],
    venues,
  );
  assert.deepEqual(order, ['bar', 'casino', 'club', 'pub', 'next']);
});

test('venue tags: cap of 20, each venue once, overflow first in image tags', () => {
  const venues: Record<string, ReturnType<typeof v>> = {};
  const apps = [];
  for (let i = 0; i < 25; i++) {
    venues[`v${i}`] = v(`h${i}`);
    apps.push({ venue: `v${i}`, category: 'live-music' }, { venue: `v${i}`, category: 'live-music' });
  }
  const plan = planTags(apps, venues);
  assert.equal(plan.igTagged.size, 20);
  assert.equal(plan.imageTags.length, 25);
  assert.deepEqual(plan.imageTags.slice(0, 5), ['v20', 'v21', 'v22', 'v23', 'v24']);
  assert.equal(plan.fbTop.length, 5);
});

test('venue tags: unverified handles are never used', () => {
  const venues = { a: { name: 'A', social: { ig: 'a', fb: 'https://facebook.com/a', verified: false } }, b: { name: 'B' } };
  const plan = planTags([{ venue: 'a', category: 'live-music' }, { venue: 'b', category: 'dj' }], venues);
  assert.equal(plan.igTagged.size, 0);
  assert.deepEqual(plan.fbTop, []);
  assert.deepEqual(plan.needsWork, ['a', 'b']);
  assert.match(handleStatus('a', venues.a)!, /unverified/);
  assert.match(handleStatus('b', venues.b)!, /no social entry/);
});

test('captions never contain an em-dash', () => {
  assert.equal(noEmDash('Band — Venue'), 'Band, Venue');
});
