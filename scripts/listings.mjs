// Prints every listing for one night (one-offs plus expanded weekly rules,
// after the site's dedupe), for checking a roundup such as Kevin's daily post
// against what we have. Read-only.
//
//   npm run listings -- --date 2026-11-06
//
// One line per listing: time, category, act or title, venue (+ aliases), town,
// source, and the data file it comes from. Cancelled shows are included and marked.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dedupeRecurring, nightOf, recurringDates } from '../src/lib/shows.ts';
import { addDays, formatDay, formatTime } from '../src/lib/time.ts';

const ROOT = join(import.meta.dirname, '..');
const load = (dir) =>
  Object.fromEntries(
    readdirSync(join(ROOT, 'data', dir))
      .filter((f) => f.endsWith('.json'))
      .map((f) => [f.slice(0, -5), JSON.parse(readFileSync(join(ROOT, 'data', dir, f), 'utf8'))]),
  );

const chicagoToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
const i = process.argv.indexOf('--date');
const date = i > -1 ? process.argv[i + 1] : chicagoToday();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) {
  console.error(`Usage: npm run listings -- --date YYYY-MM-DD (got ${date})`);
  process.exit(2);
}
const next = addDays(date, 1);

const venues = load('venues');
const artists = load('artists');
const shows = Object.entries(load('shows'))
  .filter(([, s]) => !s.placeholder && (s.date === date || s.date === next))
  .map(([id, s]) => ({ ...s, id: `shows/${id}`, venue: { id: s.venue } }));
const rules = Object.entries(load('recurring')).flatMap(([id, r]) =>
  recurringDates({ ...r, skip: r.skip ?? [] }, date, 1)
    .concat(recurringDates({ ...r, skip: r.skip ?? [] }, next, 1))
    .filter((d) => d === date || d === next)
    .map((d) => ({ ...r, date: d, id: `recurring/${id}`, artists: [], venue: { id: r.venue } })),
);
const all = [...shows, ...dedupeRecurring(shows, rules)]
  .filter((s) => nightOf(s) === date)
  .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

console.log(`${formatDay(date)}: ${all.length} listings (night runs to 4 AM)`);
for (const s of all) {
  const v = venues[s.venue.id];
  const names = (s.artists ?? []).map((a) => artists[a]?.name ?? a);
  const act = [s.title, names.join(' + ')].filter(Boolean).join(': ');
  const aka = v.aliases?.length ? ` (aka ${v.aliases.join(', ')})` : '';
  const time = formatTime(s.startTime) + (s.endTime ? `-${formatTime(s.endTime)}` : '');
  const src = s.source?.uid ? 'venue feed' : s.source?.kind ? `${s.source.type}/${s.source.kind}` : s.source?.type;
  const status = (s.status ?? 'scheduled') === 'scheduled' ? '' : ` [${s.status.toUpperCase()}]`;
  console.log(`- ${time} | ${s.category ?? 'live-music'} | ${act} | ${v.name}${aka}, ${v.city} | ${src} | ${s.id}${status}`);
}
