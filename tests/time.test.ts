import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chicagoDate, chicagoIso, chicagoInstant, weekendRange, formatTime } from '../src/lib/time.ts';
import { upcoming, thisWeekend, groupByDay } from '../src/lib/shows.ts';

const shows = [
  { id: 'fri-early', date: '2026-10-23', startTime: '20:00' },
  { id: 'tonight', date: '2026-10-24', startTime: '21:00' },
  { id: 'tonight-early', date: '2026-10-24', startTime: '17:00' },
  { id: 'sunday', date: '2026-10-25', startTime: '15:00' },
  { id: 'next-fri', date: '2026-10-30', startTime: '20:00' },
];
const ids = (list: { id: string }[]) => list.map((s) => s.id);

test('build at 23:00 UTC (6pm Chicago) still lists tonight’s shows', () => {
  const now = new Date('2026-10-24T23:00:00Z');
  assert.equal(chicagoDate(now), '2026-10-24'); // UTC date would also be the 24th...
  assert.deepEqual(ids(upcoming(shows, now)), ['tonight-early', 'tonight', 'sunday', 'next-fri']);
});

test('build after UTC midnight but before Chicago midnight keeps tonight', () => {
  // 04:30 UTC on the 25th is 11:30pm CDT on the 24th; a UTC-based filter would drop tonight.
  const now = new Date('2026-10-25T04:30:00Z');
  assert.equal(chicagoDate(now), '2026-10-24');
  assert.ok(ids(upcoming(shows, now)).includes('tonight'));
});

test('past days drop at Chicago midnight', () => {
  const now = new Date('2026-10-25T05:00:00Z'); // 00:00 CDT on the 25th
  assert.equal(chicagoDate(now), '2026-10-25');
  assert.deepEqual(ids(upcoming(shows, now)), ['sunday', 'next-fri']);
});

test('this weekend uses the Chicago date', () => {
  // Friday 9pm CDT = Saturday 02:00 UTC; still Friday in Chicago, weekend is Oct 23–25.
  const now = new Date('2026-10-24T02:00:00Z');
  assert.deepEqual(ids(thisWeekend(shows, now)), ['fri-early', 'tonight-early', 'tonight', 'sunday']);
});

test('weekend range', () => {
  assert.deepEqual(weekendRange('2026-10-21'), { start: '2026-10-23', end: '2026-10-25' }); // Wed
  assert.deepEqual(weekendRange('2026-10-23'), { start: '2026-10-23', end: '2026-10-25' }); // Fri
  assert.deepEqual(weekendRange('2026-10-25'), { start: '2026-10-23', end: '2026-10-25' }); // Sun
  assert.deepEqual(weekendRange('2026-10-26'), { start: '2026-10-30', end: '2026-11-01' }); // Mon
});

test('offsets follow DST (ends Nov 1 2026)', () => {
  assert.equal(chicagoIso('2026-10-31', '21:00'), '2026-10-31T21:00:00-05:00');
  assert.equal(chicagoIso('2026-11-01', '21:00'), '2026-11-01T21:00:00-06:00');
  assert.equal(chicagoInstant('2026-11-01', '21:00').toISOString(), '2026-11-02T03:00:00.000Z');
  assert.equal(chicagoInstant('2026-03-08', '20:00').toISOString(), '2026-03-09T01:00:00.000Z');
});

test('grouping and formatting', () => {
  assert.deepEqual(groupByDay(shows.slice(1, 4)).map((d) => [d.date, ids(d.shows)]), [
    ['2026-10-24', ['tonight-early', 'tonight']],
    ['2026-10-25', ['sunday']],
  ]);
  assert.equal(formatTime('21:00'), '9 PM');
  assert.equal(formatTime('19:30'), '7:30 PM');
  assert.equal(formatTime('00:15'), '12:15 AM');
});
