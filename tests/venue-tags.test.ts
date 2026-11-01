import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planTags, rankVenues, noEmDash, handleStatus, igHandle, fbPage } from '../scripts/social/venue-tags.mjs';

const v = (ig: string | null, extra: Record<string, unknown> = {}) => ({
  name: ig ?? 'x',
  social: { ...(ig ? { ig, fb: `https://facebook.com/${ig}` } : {}), ig_verified: true, fb_verified: true, ...extra },
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
  const venues = {
    a: { name: 'A', social: { ig: 'a', ig_verified: false, fb: 'https://facebook.com/a', fb_verified: false } },
    b: { name: 'B' },
  };
  const plan = planTags([{ venue: 'a', category: 'live-music' }, { venue: 'b', category: 'dj' }], venues);
  assert.equal(plan.igTagged.size, 0);
  assert.deepEqual(plan.fbTop, []);
  assert.deepEqual(plan.needsWork, ['a', 'b']);
  assert.equal(handleStatus('a', venues.a), 'A (a): Instagram unverified (@a), Facebook unverified (https://facebook.com/a)');
  assert.match(handleStatus('b', venues.b)!, /no social entry/);
});

test('venue tags: each platform uses its own flag', () => {
  const venues = {
    fbOnly: { name: 'FB only', social: { ig: 'fbonly', ig_verified: false, fb: 'https://facebook.com/fbonly', fb_verified: true } },
    igOnly: { name: 'IG only', social: { ig: 'igonly', ig_verified: true, fb: 'https://facebook.com/igonly', fb_verified: false } },
    noIg: { name: 'No IG', social: { ig_verified: false, fb: 'https://facebook.com/noig', fb_verified: true } },
  };
  assert.equal(igHandle(venues.fbOnly), null);
  assert.equal(fbPage(venues.fbOnly), 'https://facebook.com/fbonly');
  assert.equal(igHandle(venues.igOnly), 'igonly');
  assert.equal(fbPage(venues.igOnly), null);

  const plan = planTags(
    ['fbOnly', 'igOnly', 'noIg'].map((venue) => ({ venue, category: 'live-music' })),
    venues,
  );
  assert.deepEqual([...plan.igTagged], ['igOnly']);
  assert.deepEqual(plan.imageTags, ['igOnly']);
  assert.deepEqual(plan.fbTop, ['fbOnly', 'noIg']);
  assert.equal(handleStatus('fbOnly', venues.fbOnly), 'FB only (fbOnly): Instagram unverified (@fbonly)');
  assert.equal(handleStatus('igOnly', venues.igOnly), 'IG only (igOnly): Facebook unverified (https://facebook.com/igonly)');
  assert.equal(handleStatus('noIg', venues.noIg), 'No IG (noIg): no Instagram');
});

test('captions never contain an em-dash', () => {
  assert.equal(noEmDash('Band \u2014 Venue'), 'Band, Venue');
});
