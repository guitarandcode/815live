// "Tonight in the 815": a 1080x1350 post image (Facebook/Instagram portrait)
// built from data/, plus a ready-to-paste caption with tags.
//
//   node scripts/social/tonight.mjs                 # today (Chicago)
//   node scripts/social/tonight.mjs --date 2026-10-31
//
// Writes social/tonight-YYYY-MM-DD[-2].png and social/tonight-YYYY-MM-DD.txt.
// Busy nights spill onto extra images (post them together as one album).
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { C, h, render, stripes, wordmark } from './lib.mjs';

const ROOT = join(import.meta.dirname, '../..');
const OUT = join(ROOT, 'social');
const W = 1080;
const H = 1350;

// ---------- data ----------
const load = (dir) =>
  Object.fromEntries(
    readdirSync(join(ROOT, 'data', dir))
      .filter((f) => f.endsWith('.json'))
      .map((f) => [f.slice(0, -5), JSON.parse(readFileSync(join(ROOT, 'data', dir, f), 'utf8'))]),
  );

const chicagoToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());

const argDate = process.argv.indexOf('--date');
const date = argDate > -1 ? process.argv[argDate + 1] : chicagoToday();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Bad --date: ${date}`);

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const noon = new Date(`${date}T12:00:00Z`);
const weekday = WEEKDAYS[noon.getUTCDay()];
const month = Number(date.slice(5, 7));
const mins = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

const venues = load('venues');
const artists = load('artists');

const oneOffs = Object.values(load('shows')).filter(
  (s) => s.date === date && !s.placeholder && (s.status ?? 'scheduled') !== 'cancelled',
);
// Recurring nights, minus any that a one-off at the same venue replaces (same rule as the site).
const recurring = Object.values(load('recurring'))
  .filter((r) => r.weekday === weekday && !r.placeholder)
  .filter((r) => !r.months || r.months.includes(month))
  .filter((r) => !(r.skip ?? []).includes(date))
  .filter((r) => !oneOffs.some((s) => s.venue === r.venue && Math.abs(mins(s.startTime) - mins(r.startTime)) < 120));

const events = [...oneOffs, ...recurring]
  .map((e) => {
    const v = venues[e.venue];
    if (!v) throw new Error(`Unknown venue "${e.venue}"`);
    const names = (e.artists ?? []).map((a) => artists[a]?.name ?? a);
    return {
      ...e,
      category: e.category ?? 'live-music',
      act: names.length ? names.join(' + ') : e.title,
      eventTitle: names.length ? e.title : undefined,
      venueName: v.name,
      city: v.city,
      artistPages: (e.artists ?? []).map((a) => artists[a]?.socials?.facebook).filter(Boolean),
    };
  })
  .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.venueName.localeCompare(b.venueName));

if (!events.length) {
  console.log(`Nothing listed for ${date}. No image made.`);
  process.exit(0);
}

// ---------- formatting ----------
const SECTIONS = [
  ['live-music', 'Live music'],
  ['comedy', 'Comedy'],
  ['open-mic', 'Open mic'],
  ['karaoke', 'Karaoke'],
  ['trivia', 'Music trivia'],
];

function clock(t) {
  let hr = Number(t.slice(0, 2));
  const m = t.slice(3, 5);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  hr = hr % 12 || 12;
  return m === '00' ? `${hr} ${ampm}` : `${hr}:${m} ${ampm}`;
}

const longDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(noon);
const isToday = date === chicagoToday();
const heading = isToday ? 'Tonight' : longDate.split(',')[0];

// ---------- layout ----------
const PAD = 72; // side margins
const TOP = 64;
const BOTTOM = 44;
const HEADER = 372; // wordmark + two-line heading + date + rule
const FOOTER = 120;
const SECTION_H = 58;
const ROW_H = 88;
const BODY = H - TOP - BOTTOM - HEADER - FOOTER - 24;
const INNER = W - PAD * 2;

// Pack sections and rows into pages by height.
const pages = [];
let page = [];
let used = 0;
for (const [cat, label] of SECTIONS) {
  const rows = events.filter((e) => e.category === cat);
  if (!rows.length) continue;
  let first = true;
  let continued = false;
  for (const row of rows) {
    const need = ROW_H + (first ? SECTION_H : 0);
    // Start a new page rather than overflow (and never strand a label at the bottom).
    if (used + need > BODY && page.length) {
      pages.push(page);
      page = [];
      used = 0;
      continued = !first;
      first = true;
    }
    if (first) {
      page.push({ label: continued ? `${label} (cont.)` : label });
      used += SECTION_H;
      first = false;
    }
    page.push({ row });
    used += ROW_H;
  }
}
if (page.length) pages.push(page);

const ellipsis = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

function rowEl(e) {
  // Venues with more than one room note it like "On the Council Oak stage."
  const stage = e.notes?.match(/^On the (.+?) stage\.?$/i)?.[1];
  const sub = [e.eventTitle, e.venueName, stage, e.city !== 'Rockford' ? e.city : null].filter(Boolean).join(' · ');
  return h(
    'div',
    { width: INNER, height: ROW_H, flexShrink: 0, alignItems: 'center', borderBottom: `2px solid ${C.line}` },
    h('div', { width: 170, flexShrink: 0, fontFamily: 'Cond', fontWeight: 700, fontSize: 36, color: C.accent }, clock(e.startTime)),
    h(
      'div',
      { flexDirection: 'column', width: INNER - 170 },
      h('div', { fontFamily: 'Cond', fontWeight: 800, fontSize: 42, lineHeight: 1.1, color: C.ink, ...ellipsis }, e.act),
      h('div', { fontFamily: 'Sans', fontSize: 25, lineHeight: 1.3, color: C.muted, marginTop: 2, ...ellipsis }, sub),
    ),
  );
}

function pageEl(items, i, total) {
  return h(
    'div',
    { width: W, height: H, background: C.bg, backgroundImage: stripes, flexDirection: 'column', alignItems: 'center', paddingTop: TOP },
    // header
    h(
      'div',
      { width: INNER, height: HEADER, flexDirection: 'column' },
      h('div', { justifyContent: 'space-between', alignItems: 'center' },
        wordmark(46),
        total > 1 ? h('div', { fontFamily: 'Cond', fontWeight: 700, fontSize: 30, color: C.muted }, `${i + 1} / ${total}`) : null,
      ),
      h('div', { flexDirection: 'column', fontFamily: 'Cond', fontWeight: 900, fontSize: 112, lineHeight: 0.92, textTransform: 'uppercase', letterSpacing: -1, marginTop: 26 },
        h('div', { color: C.ink }, heading),
        h('div', { color: C.accent }, 'in the 815'),
      ),
      h('div', { fontFamily: 'Sans', fontWeight: 600, fontSize: 30, color: C.muted, marginTop: 16 }, longDate),
      h('div', { height: 4, background: C.accent, width: 120, marginTop: 20 }),
    ),
    // body
    h(
      'div',
      { width: INNER, height: BODY, marginTop: 12, marginBottom: 12, flexDirection: 'column', justifyContent: 'center' },
      items.map((it) =>
        it.label
          ? h('div', { height: SECTION_H, flexShrink: 0, alignItems: 'flex-end', paddingBottom: 6, fontFamily: 'Cond', fontWeight: 800, fontSize: 28, letterSpacing: 3, color: C.accent, textTransform: 'uppercase' }, it.label)
          : rowEl(it.row),
      ),
    ),
    // footer
    h(
      'div',
      { width: INNER, height: FOOTER, alignItems: 'center', justifyContent: 'space-between', borderTop: `2px solid ${C.line}` },
      h('div', { flexDirection: 'column' },
        h('div', { fontFamily: 'Cond', fontWeight: 800, fontSize: 40, color: C.ink }, '815live.com'),
        h('div', { fontFamily: 'Sans', fontSize: 22, color: C.muted, marginTop: 4 }, 'Full calendar, cover prices, directions'),
      ),
      h('div', { flexDirection: 'column', alignItems: 'flex-end' },
        h('div', { fontFamily: 'Sans', fontSize: 22, color: C.muted }, 'Playing soon? Send it in:'),
        h('div', { fontFamily: 'Sans', fontWeight: 600, fontSize: 25, color: C.ink, marginTop: 4 }, 'shows@815live.com'),
      ),
    ),
  );
}

mkdirSync(OUT, { recursive: true });
for (const [i, items] of pages.entries()) {
  const suffix = pages.length > 1 ? `-${i + 1}` : '';
  await render(pageEl(items, i, pages.length), W, H, join(OUT, `tonight-${date}${suffix}.png`));
}

// ---------- caption ----------
const lines = [`${isToday ? 'Tonight' : longDate} in the 815 🎶`, ''];
for (const [cat, label] of SECTIONS) {
  const rows = events.filter((e) => e.category === cat);
  if (!rows.length) continue;
  lines.push(`${label.toUpperCase()}`);
  for (const e of rows) lines.push(`• ${e.act} @ ${e.venueName}${e.city !== 'Rockford' ? ` (${e.city})` : ''}, ${clock(e.startTime)}`);
  lines.push('');
}
lines.push('Full calendar: https://815live.com', 'Got a show? shows@815live.com', '', '#Rockford #RockfordIL #LiveMusic #815');
const pagesToTag = [...new Set(events.flatMap((e) => e.artistPages))];
if (pagesToTag.length) lines.push('', '(Tag these pages when you post:)', ...pagesToTag);

const captionPath = join(OUT, `tonight-${date}.txt`);
writeFileSync(captionPath, lines.join('\n') + '\n');
console.log(`wrote ${captionPath}`);
