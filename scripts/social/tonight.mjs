// "Tonight in the 815": a 1080x1350 post image (Facebook/Instagram portrait)
// built from data/, plus a ready-to-paste caption with tags.
//
//   node scripts/social/tonight.mjs                 # today (Chicago)
//   node scripts/social/tonight.mjs --date 2026-10-31
//
// Writes social/tonight-YYYY-MM-DD[-2].png and social/tonight-YYYY-MM-DD.txt.
// Busy nights spill onto extra images (post them together as one album).
// Quiet nights (fewer than QUIET listings) get one "Tonight + Next 7 Days"
// image instead: tonight on top, then up to WEEK_MAX one-off shows from the
// next 7 days, soonest first. Highlights are one-off live shows (bands,
// comedy): no weekly nights, and no karaoke, open mics, jams, trivia or DJs.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { C, h, render, wordmark } from './lib.mjs';

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

const QUIET = 3;
const WEEK_MAX = 6;
const WEEK_DAYS = 7;
const addDays = (d, n) => {
  const t = new Date(`${d}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};

const venues = load('venues');
const artists = load('artists');
const allShows = Object.values(load('shows')).filter((s) => !s.placeholder && (s.status ?? 'scheduled') !== 'cancelled');

const oneOffs = allShows.filter((s) => s.date === date);
const HIGHLIGHT_CATEGORIES = ['live-music', 'comedy'];
const isHighlight = (s) =>
  HIGHLIGHT_CATEGORIES.includes(s.category ?? 'live-music') && !/\bjam\b/i.test(s.title ?? '');
// Recurring nights, minus any that a one-off at the same venue replaces (same rule as the site).
const recurring = Object.values(load('recurring'))
  .filter((r) => r.weekday === weekday && !r.placeholder)
  .filter((r) => !r.months || r.months.includes(month))
  .filter((r) => !(r.skip ?? []).includes(date))
  .filter((r) => !oneOffs.some((s) => s.venue === r.venue && Math.abs(mins(s.startTime) - mins(r.startTime)) < 120));

const toEvent = (e) => {
  const v = venues[e.venue];
  if (!v) throw new Error(`Unknown venue "${e.venue}"`);
  const names = (e.artists ?? []).map((a) => artists[a]?.name ?? a);
  return {
    ...e,
    date: e.date ?? date, // recurring rules have no date of their own
    category: e.category ?? 'live-music',
    act: names.length ? names.join(' + ') : e.title,
    eventTitle: names.length ? e.title : undefined,
    venueName: v.name,
    city: v.city,
    artistPages: (e.artists ?? []).map((a) => artists[a]?.socials?.facebook).filter(Boolean),
  };
};
const byStart = (a, b) =>
  a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.venueName.localeCompare(b.venueName);

const events = [...oneOffs, ...recurring].map(toEvent).sort(byStart);
const quiet = events.length < QUIET;
const weekEnd = addDays(date, WEEK_DAYS);
const week = quiet
  ? allShows.filter((s) => s.date > date && s.date <= weekEnd && isHighlight(s)).map(toEvent).sort(byStart).slice(0, WEEK_MAX)
  : [];

if (!events.length && !week.length) {
  console.log(`Nothing listed for ${date} or the 7 days after. No image made.`);
  process.exit(0);
}

// ---------- formatting ----------
const SECTIONS = [
  ['live-music', 'Live music'],
  ['dj', 'DJ'],
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
const dayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const shortDay = (d) => dayFmt.format(new Date(`${d}T12:00:00Z`)); // 'Thu, Oct 29'
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

// withDay: the week list, with weekday and date over the time.
function rowEl(e, { withDay = false, rowH = ROW_H } = {}) {
  const timeW = withDay ? 230 : 170;
  // Venues with more than one room note it like "On the Council Oak stage."
  const stage = e.notes?.match(/^On the (.+?) stage\.?$/i)?.[1];
  const sub = [e.eventTitle, e.venueName, stage, e.city !== 'Rockford' ? e.city : null].filter(Boolean).join(' · ');
  return h(
    'div',
    { width: INNER, height: rowH, flexShrink: 0, alignItems: 'center', borderBottom: `2px solid ${C.line}` },
    withDay
      ? h('div', { width: timeW, flexShrink: 0, flexDirection: 'column', fontFamily: 'Cond', fontWeight: 700 },
          h('div', { fontSize: 26, color: C.ink, textTransform: 'uppercase' }, shortDay(e.date).split(',')[0]),
          h('div', { fontSize: 30, color: C.accent }, `${shortDay(e.date).split(', ')[1]} · ${clock(e.startTime)}`))
      : h('div', { width: timeW, flexShrink: 0, fontFamily: 'Cond', fontWeight: 700, fontSize: 36, color: C.accent }, clock(e.startTime)),
    h(
      'div',
      { flexDirection: 'column', width: INNER - timeW },
      h('div', { fontFamily: 'Cond', fontWeight: 800, fontSize: 42, lineHeight: 1.1, color: C.ink, ...ellipsis }, e.act),
      h('div', { fontFamily: 'Sans', fontSize: 25, lineHeight: 1.3, color: C.muted, marginTop: 2, ...ellipsis }, sub),
    ),
  );
}

function pageEl(items, i, total) {
  return h(
    'div',
    { width: W, height: H, background: C.bg, flexDirection: 'column', alignItems: 'center', paddingTop: TOP },
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
    footerEl(),
  );
}

function footerEl() {
  return h(
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
  );
}

// Quiet nights: one page with tonight (or "nothing listed"), then the week.
const Q_HEADER = 300;
const Q_ROW = 80;
const Q_BODY = H - TOP - BOTTOM - Q_HEADER - FOOTER - 24;
const sectionLabel = (text) =>
  h('div', { height: SECTION_H, flexShrink: 0, alignItems: 'flex-end', paddingBottom: 6, fontFamily: 'Cond', fontWeight: 800, fontSize: 28, letterSpacing: 3, color: C.accent, textTransform: 'uppercase' }, text);

function quietEl() {
  return h(
    'div',
    { width: W, height: H, background: C.bg, flexDirection: 'column', alignItems: 'center', paddingTop: TOP },
    h(
      'div',
      { width: INNER, height: Q_HEADER, flexDirection: 'column' },
      wordmark(46),
      h('div', { flexDirection: 'column', fontFamily: 'Cond', fontWeight: 900, fontSize: 92, lineHeight: 0.92, textTransform: 'uppercase', letterSpacing: -1, marginTop: 24 },
        h('div', { color: C.ink }, `${heading} +`),
        h('div', { color: C.accent }, 'Next 7 days'),
      ),
      h('div', { fontFamily: 'Sans', fontWeight: 600, fontSize: 30, color: C.muted, marginTop: 16 }, `${longDate} · in the 815`),
      h('div', { height: 4, background: C.accent, width: 120, marginTop: 20 }),
    ),
    h(
      'div',
      { width: INNER, height: Q_BODY, marginTop: 12, marginBottom: 12, flexDirection: 'column', justifyContent: 'center' },
      sectionLabel(heading),
      events.length
        ? events.map((e) => rowEl(e, { rowH: Q_ROW }))
        : h('div', { height: Q_ROW, flexShrink: 0, alignItems: 'center', fontFamily: 'Sans', fontSize: 30, color: C.muted, borderBottom: `2px solid ${C.line}` }, isToday ? 'Nothing listed tonight.' : 'Nothing listed.'),
      week.length ? sectionLabel('Next 7 days') : null,
      week.map((e) => rowEl(e, { withDay: true, rowH: Q_ROW })),
    ),
    footerEl(),
  );
}

mkdirSync(OUT, { recursive: true });
if (quiet) await render(quietEl(), W, H, join(OUT, `tonight-${date}.png`));
else for (const [i, items] of pages.entries()) {
  const suffix = pages.length > 1 ? `-${i + 1}` : '';
  await render(pageEl(items, i, pages.length), W, H, join(OUT, `tonight-${date}${suffix}.png`));
}

// ---------- caption ----------
const lines = [`${isToday ? 'Tonight' : longDate}${quiet ? ' + Next 7 Days' : ''} in the 815 🎶`, ''];
if (!events.length) lines.push(isToday ? 'Nothing listed tonight.' : 'Nothing listed.', '');
for (const [cat, label] of SECTIONS) {
  const rows = events.filter((e) => e.category === cat);
  if (!rows.length) continue;
  lines.push(`${label.toUpperCase()}`);
  for (const e of rows) lines.push(`• ${e.act} @ ${e.venueName}${e.city !== 'Rockford' ? ` (${e.city})` : ''}, ${clock(e.startTime)}`);
  lines.push('');
}
if (week.length) {
  lines.push('NEXT 7 DAYS');
  for (const e of week) lines.push(`• ${shortDay(e.date)}: ${e.act} @ ${e.venueName}${e.city !== 'Rockford' ? ` (${e.city})` : ''}, ${clock(e.startTime)}`);
  lines.push('');
}
lines.push('Full calendar: https://815live.com', 'Got a show? shows@815live.com', '', '#Rockford #RockfordIL #LiveMusic #815');
const pagesToTag = [...new Set([...events, ...week].flatMap((e) => e.artistPages))];
if (pagesToTag.length) lines.push('', '(Tag these pages when you post:)', ...pagesToTag);

const captionPath = join(OUT, `tonight-${date}.txt`);
writeFileSync(captionPath, lines.join('\n') + '\n');
console.log(`wrote ${captionPath}`);
