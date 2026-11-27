import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeSlots, slotTimes } from '../scripts/social/lineup.mjs';

const nightOf = (s: { date: string; startTime: string }) => s.date; // same-day rows in these tests

test('lineup: same act, venue and night merges into one row, times in order', () => {
  const rows = [
    { act: 'Miles Nielsen and the Rusted Hearts', venue: 'the-music-box', date: '2026-11-27', startTime: '21:00' },
    { act: 'Someone Else', venue: 'the-music-box', date: '2026-11-27', startTime: '19:00' },
    { act: '  miles nielsen   AND the rusted hearts ', venue: 'the-music-box', date: '2026-11-27', startTime: '18:30' },
  ];
  const out = mergeSlots(rows, nightOf);
  assert.equal(out.length, 2);
  assert.deepEqual(out[0].times, ['18:30', '21:00']);
  assert.equal(out[0].slots.length, 2);
  assert.equal(out[1].act, 'Someone Else');
});

test('lineup: different venue or night stays separate', () => {
  const rows = [
    { act: 'A', venue: 'x', date: '2026-11-27', startTime: '18:00' },
    { act: 'A', venue: 'y', date: '2026-11-27', startTime: '21:00' },
    { act: 'A', venue: 'x', date: '2026-11-28', startTime: '18:00' },
  ];
  assert.equal(mergeSlots(rows, nightOf).length, 3);
});

test('lineup: an after-midnight slot belongs to the night before and sorts last', () => {
  const night = (s: { date: string; startTime: string }) => (s.startTime < '04:00' ? '2026-11-27' : s.date);
  const rows = [
    { act: 'DJ', venue: 'x', date: '2026-11-28', startTime: '00:30' },
    { act: 'DJ', venue: 'x', date: '2026-11-27', startTime: '22:00' },
  ];
  const [m] = mergeSlots(rows, night);
  assert.deepEqual(m.times, ['22:00', '00:30']);
});

test('lineup: slot times read "at 6:30 and 9"', () => {
  assert.equal(slotTimes(['18:30', '21:00']), 'at 6:30 and 9');
  assert.equal(slotTimes(['18:00', '19:30', '21:00']), 'at 6, 7:30 and 9');
  assert.equal(slotTimes(['12:00', '00:30']), 'at 12 and 12:30');
});
