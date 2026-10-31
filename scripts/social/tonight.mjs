// "Tonight in the 815": a 1080x1350 post image (Facebook/Instagram portrait)
// built from data/, plus a ready-to-paste caption with tags.
//
//   node scripts/social/tonight.mjs                 # today (Chicago)
//   node scripts/social/tonight.mjs --date 2026-10-31
//
// Writes social/tonight-YYYY-MM-DD[-2].png, the Instagram caption
// social/tonight-YYYY-MM-DD.txt, the Facebook caption -fb.txt and the
// image-tag list -tags.txt, then reports venues missing social handles.
// Busy nights spill onto extra images (post them together as one album).
// Quiet nights (fewer than QUIET music listings) get one "Tonight + Coming Up"
// image instead: tonight's listings on top, then up to WEEK_MAX one-off shows
// from the next 7 days in the room left, soonest first. Coming-up highlights
// are one-off live music: no weekly nights, and no open mics, jams or DJs.
//
// Tonight is everything on the site's /tonight (same 4 AM rule), grouped by
// category in CATEGORIES order, so music leads and other events (trivia,
// bingo, karaoke, comedy; see src/lib/categories.ts) follow. Music always
// fits (busy nights spill onto more images); other events take the room
// left on the last image, and when they don't fit, rows are dropped in
// DROP_FIRST order and a "+ N more at 815live.com" line is added. Text never
// shrinks. Titles wrap to two lines instead of being cut off.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORIES, CATEGORY_LABEL, isMusic } from '../../src/lib/categories.ts';
import { nightOf } from '../../src/lib/shows.ts';
import { C, h, measure, render, wordmark } from './lib.mjs';
import { IG_CAP, fbPage, handleStatus, igHandle, noEmDash, planTags } from './venue-tags.mjs';

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

// Tonight runs until 4 AM, so the next date's early-morning shows count too.
const nextDate = addDays(date, 1);
const oneOffs = allShows.filter((s) => s.date === date || s.date === nextDate);
const HIGHLIGHT_CATEGORIES = ['live-music'];
const isHighlight = (s) =>
  HIGHLIGHT_CATEGORIES.includes(s.category ?? 'live-music') && !/\bjam\b/i.test(s.title ?? '');
// Recurring nights, minus any that a one-off at the same venue replaces (same rule as the site).
const rules = Object.values(load('recurring')).filter((r) => !r.placeholder);
const rulesOn = (d) =>
  rules
    .filter((r) => r.weekday === WEEKDAYS[new Date(`${d}T12:00:00Z`).getUTCDay()])
    .filter((r) => !r.months || r.months.includes(Number(d.slice(5, 7))))
    .filter((r) => !(r.skip ?? []).includes(d))
    .filter((r) => !oneOffs.some((s) => s.date === d && s.venue === r.venue && Math.abs(mins(s.startTime) - mins(r.startTime)) < 120))
    .map((r) => ({ ...r, date: d }));
const recurring = [date, nextDate].flatMap(rulesOn);

const toEvent = (e) => {
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
    // Town shown after the venue: none for Rockford or when the name already says it.
    town: v.city === 'Rockford' || v.name.toLowerCase().includes(v.city.toLowerCase()) ? null : v.city,
    artistPages: (e.artists ?? []).map((a) => artists[a]?.socials?.facebook).filter(Boolean),
  };
};
const byStart = (a, b) =>
  a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.venueName.localeCompare(b.venueName);

const all = [...oneOffs, ...recurring].filter((s) => nightOf(s) === date).map(toEvent).sort(byStart);
const events = all.filter((e) => isMusic(e.category));
const others = all.filter((e) => !isMusic(e.category));
const quiet = events.length < QUIET;
const weekEnd = addDays(date, WEEK_DAYS);
const week = quiet
  ? allShows.filter((s) => nightOf(s) > date && nightOf(s) <= weekEnd && isHighlight(s)).map(toEvent).sort(byStart).slice(0, WEEK_MAX)
  : [];

if (!events.length && !week.length && !others.length) {
  console.log(`Nothing listed for ${date} or the 7 days after. No image made.`);
  process.exit(0);
}

// ---------- formatting ----------
// Music first (live music leads), then the other events.
const SECTIONS = CATEGORIES.map((c) => [c, c === 'other' ? 'Other events' : CATEGORY_LABEL[c]]);
// When other events don't fit, rows go in this order (the latest first within each).
const DROP_FIRST = ['karaoke', 'trivia', 'bingo', 'other', 'comedy'];

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
const MORE_H = 58;
const WRAP_H = 48; // a title's second line (42 px type at 1.1, rounded up)
const BODY = H - TOP - BOTTOM - HEADER - FOOTER - 24;
const INNER = W - PAD * 2;
const TIME_W = 170;
const DAY_TIME_W = 230; // the week list: weekday and date over the time
const TITLE = { fontFamily: 'Cond', fontWeight: 800, fontSize: 42, lineHeight: 1.1 };

// Titles wrap to at most two lines; satori measures them so rows can be sized.
const titleLines = async (text, width) =>
  Math.min(2, Math.max(1, Math.round((await measure(h('div', { width, ...TITLE }, text), width)) / 46)));
for (const e of all) e.lines = await titleLines(e.act, INNER - TIME_W);
for (const e of week) e.lines = await titleLines(e.act, INNER - DAY_TIME_W);
const rowH = (e, base) => base + (e.lines - 1) * WRAP_H;

// Other events in the room left: drop rows (DROP_FIRST) until they and the
// "+ N more" line fit. Returns page items, grouped by category.
function fitOthers(room, base) {
  const kept = [...others];
  const height = () =>
    new Set(kept.map((e) => e.category)).size * SECTION_H +
    kept.reduce((n, e) => n + rowH(e, base), 0) +
    (kept.length < others.length ? MORE_H : 0);
  while (kept.length && height() > room) {
    const cat = DROP_FIRST.find((c) => kept.some((e) => e.category === c));
    kept.splice(kept.findLastIndex((e) => e.category === cat), 1);
  }
  const items = [];
  for (const [cat, label] of SECTIONS) {
    const rows = kept.filter((e) => e.category === cat);
    if (rows.length) items.push({ label }, ...rows.map((row) => ({ row })));
  }
  const more = others.length - kept.length;
  if (more && MORE_H <= room) items.push({ more });
  else if (more) console.warn(`no room for the "+ ${more} more" line`);
  return { items, height: kept.length || (more && MORE_H <= room) ? height() : 0 };
}

// Pack music sections and rows into pages by height; other events go on the last.
const pages = [];
let page = [];
let used = 0;
const musicSections = SECTIONS.filter(([c]) => isMusic(c));
// The last music row also leaves room under it for a "+ N more" line.
const lastMusic = musicSections.flatMap(([c]) => events.filter((e) => e.category === c)).at(-1);
for (const [cat, label] of musicSections) {
  const rows = events.filter((e) => e.category === cat);
  if (!rows.length) continue;
  let first = true;
  let continued = false;
  for (const row of rows) {
    const need = rowH(row, ROW_H) + (first ? SECTION_H : 0) + (row === lastMusic && others.length ? MORE_H : 0);
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
    used += rowH(row, ROW_H);
  }
}
if (!quiet) {
  page.push(...fitOthers(BODY - used, ROW_H).items);
  pages.push(page);
}

const ellipsis = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

// withDay: the week list, with weekday and date over the time.
// base: the row's height with a one-line title.
function rowEl(e, { withDay = false, base = ROW_H } = {}) {
  const timeW = withDay ? DAY_TIME_W : TIME_W;
  // Venues with more than one room note it like "On the Council Oak stage."
  const stage = e.notes?.match(/^On the (.+?) stage\.?$/i)?.[1];
  const sub = [e.eventTitle, e.venueName, stage, e.town].filter(Boolean).join(' · ');
  return h(
    'div',
    { width: INNER, height: rowH(e, base), flexShrink: 0, alignItems: 'center', borderBottom: `2px solid ${C.line}` },
    withDay
      ? h('div', { width: timeW, flexShrink: 0, flexDirection: 'column', fontFamily: 'Cond', fontWeight: 700 },
          h('div', { fontSize: 26, color: C.ink, textTransform: 'uppercase' }, shortDay(e.date).split(',')[0]),
          h('div', { fontSize: 30, color: C.accent }, `${shortDay(e.date).split(', ')[1]} · ${clock(e.startTime)}`))
      : h('div', { width: timeW, flexShrink: 0, fontFamily: 'Cond', fontWeight: 700, fontSize: 36, color: C.accent }, clock(e.startTime)),
    h(
      'div',
      { flexDirection: 'column', width: INNER - timeW },
      h('div', { ...TITLE, color: C.ink, display: 'block', lineClamp: 2 }, e.act),
      h('div', { fontFamily: 'Sans', fontSize: 25, lineHeight: 1.3, color: C.muted, marginTop: 2, ...ellipsis }, sub),
    ),
  );
}

const sectionLabel = (text) =>
  h('div', { height: SECTION_H, flexShrink: 0, alignItems: 'flex-end', paddingBottom: 6, fontFamily: 'Cond', fontWeight: 800, fontSize: 28, letterSpacing: 3, color: C.accent, textTransform: 'uppercase' }, text);
const moreEl = (n) =>
  h('div', { height: MORE_H, flexShrink: 0, alignItems: 'center', fontFamily: 'Sans', fontWeight: 600, fontSize: 26, color: C.muted }, `+ ${n} more at 815live.com`);
const itemEl = (it, base = ROW_H) => (it.label ? sectionLabel(it.label) : it.more ? moreEl(it.more) : rowEl(it.row, { base }));

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
      items.map((it) => itemEl(it)),
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

// Quiet nights: one page with tonight (all of it, or "nothing listed" for
// music), then as much of the week as fits.
const Q_HEADER = 300;
const Q_ROW = 80;
const Q_BODY = H - TOP - BOTTOM - Q_HEADER - FOOTER - 24;
const qMusic = [];
for (const [cat, label] of SECTIONS.filter(([c]) => isMusic(c))) {
  const rows = events.filter((e) => e.category === cat);
  if (rows.length) qMusic.push({ label }, ...rows.map((row) => ({ row })));
}
const qMusicH = events.length
  ? qMusic.reduce((n, it) => n + (it.label ? SECTION_H : rowH(it.row, Q_ROW)), 0)
  : Q_ROW;
const qOthers = quiet ? fitOthers(Q_BODY - qMusicH, Q_ROW) : { items: [], height: 0 };
// The week gets what tonight leaves.
const weekShown = [];
let weekRoom = Q_BODY - qMusicH - qOthers.height - SECTION_H;
for (const e of week) {
  if (rowH(e, Q_ROW) > weekRoom) break;
  weekShown.push(e);
  weekRoom -= rowH(e, Q_ROW);
}

function quietEl() {
  return h(
    'div',
    { width: W, height: H, background: C.bg, flexDirection: 'column', alignItems: 'center', paddingTop: TOP },
    h(
      'div',
      { width: INNER, height: Q_HEADER, flexDirection: 'column' },
      wordmark(46),
      h('div', { flexDirection: 'column', fontFamily: 'Cond', fontWeight: 900, fontSize: 92, lineHeight: 0.92, textTransform: 'uppercase', letterSpacing: -1, marginTop: 24 },
        h('div', { color: C.ink }, weekShown.length ? `${heading} +` : heading),
        h('div', { color: C.accent }, weekShown.length ? 'Coming up' : 'in the 815'),
      ),
      h('div', { fontFamily: 'Sans', fontWeight: 600, fontSize: 30, color: C.muted, marginTop: 16 }, weekShown.length ? `${longDate} · in the 815` : longDate),
      h('div', { height: 4, background: C.accent, width: 120, marginTop: 20 }),
    ),
    h(
      'div',
      { width: INNER, height: Q_BODY, marginTop: 12, marginBottom: 12, flexDirection: 'column', justifyContent: 'center' },
      events.length
        ? qMusic.map((it) => itemEl(it, Q_ROW))
        : h('div', { height: Q_ROW, flexShrink: 0, alignItems: 'center', fontFamily: 'Sans', fontSize: 30, color: C.muted, borderBottom: `2px solid ${C.line}` }, isToday ? 'No live music listed tonight.' : 'No live music listed.'),
      qOthers.items.map((it) => itemEl(it, Q_ROW)),
      weekShown.length ? sectionLabel('Coming up') : null,
      weekShown.map((e) => rowEl(e, { withDay: true, base: Q_ROW })),
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
// Three files: tonight-DATE.txt is the Instagram caption (verified venues as
// @handle, up to IG_CAP; reel.mjs reads its title and hashtag lines),
// -fb.txt the Facebook caption (plain names, pasted @mentions don't link
// there) with the top venues to tag by hand, and -tags.txt the Instagram
// handles to tag on the image. See venue-tags.mjs for the priority order.
const captionRows = [];
for (const [cat] of SECTIONS) for (const e of all.filter((e) => e.category === cat)) captionRows.push(e);
const appearances = [
  ...captionRows.map((e) => ({ venue: e.venue, category: e.category })),
  ...weekShown.map((e) => ({ venue: e.venue, category: e.category, coming: true })),
];
const plan = planTags(appearances, venues);

function caption(venueLabel, sep) {
  const lines = [`${isToday ? 'Tonight' : longDate}${weekShown.length ? ' + Coming Up' : ''} in the 815 🎶`, ''];
  if (!events.length) lines.push(isToday ? 'No live music listed tonight.' : 'No live music listed.', '');
  for (const [cat, label] of SECTIONS) {
    const rows = all.filter((e) => e.category === cat);
    if (!rows.length) continue;
    lines.push(`${label.toUpperCase()}`);
    for (const e of rows) lines.push(`• ${e.act} ${sep} ${venueLabel(e)}${e.town ? ` (${e.town})` : ''}, ${clock(e.startTime)}`);
    lines.push('');
  }
  if (weekShown.length) {
    lines.push('COMING UP');
    for (const e of weekShown) lines.push(`• ${shortDay(e.date)}: ${e.act} ${sep} ${venueLabel(e)}${e.town ? ` (${e.town})` : ''}, ${clock(e.startTime)}`);
    lines.push('');
  }
  lines.push('Full calendar: https://815live.com', 'Got a show? shows@815live.com', '', '#Rockford #RockfordIL #LiveMusic #815');
  const pagesToTag = [...new Set([...events, ...weekShown].flatMap((e) => e.artistPages))];
  if (pagesToTag.length) lines.push('', '(Tag these pages when you post:)', ...pagesToTag);
  return lines;
}

// Instagram: each tagged venue's first mention becomes @handle, later ones stay
// plain; lines read "Act at Venue" so a handle never follows a bare @.
const mentioned = new Set();
const igLines = caption((e) => {
  if (!plan.igTagged.has(e.venue) || mentioned.has(e.venue)) return e.venueName;
  mentioned.add(e.venue);
  return `@${igHandle(venues[e.venue])}`;
}, 'at');
const fbLines = caption((e) => e.venueName, '@');
if (plan.fbTop.length) {
  fbLines.push('', '(Tag these venues by hand:)', ...plan.fbTop.map((s) => `${venues[s].name}: ${fbPage(venues[s])}`));
}

const write = (path, lines) => {
  writeFileSync(path, noEmDash(lines.join('\n') + '\n'));
  console.log(`wrote ${path}`);
};
write(join(OUT, `tonight-${date}.txt`), igLines);
write(join(OUT, `tonight-${date}-fb.txt`), fbLines);
write(join(OUT, `tonight-${date}-tags.txt`), plan.imageTags.map((h) => `@${igHandle(venues[h])}`));
if (plan.imageTags.length > IG_CAP) console.log(`note: ${plan.imageTags.length} image tags; Instagram allows ${IG_CAP} per image, so split them across the album`);

// Report: tonight's venues with missing or unverified handles.
const todo = plan.needsWork.map((s) => handleStatus(s, venues[s])).filter(Boolean);
console.log(`venue tags: ${plan.igTagged.size} Instagram mentions in caption, ${plan.imageTags.length} image tags, ${plan.fbTop.length} Facebook to tag by hand`);
if (todo.length) console.log(`venues to fill in (npm run social:handles for all):\n${todo.map((t) => `  - ${t}`).join('\n')}`);
