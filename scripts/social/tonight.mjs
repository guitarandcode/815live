// "Tonight in the 815": the daily lineup as a show flyer (DESIGN.md), built
// from data/: a 1080x1350 feed image and a 1080x1920 Story, plus
// ready-to-paste captions with tags.
//
//   node scripts/social/tonight.mjs                 # today (Chicago)
//   node scripts/social/tonight.mjs --date 2026-10-31
//   node scripts/social/tonight.mjs --date 2026-10-31 --out /some/dir   # samples
//
// Writes social/tonight-YYYY-MM-DD.png (feed) and -story.png (Story; content
// stays out of the top and bottom 250 px), the Instagram caption
// social/tonight-YYYY-MM-DD-instagram.txt, the Facebook caption -fb.txt, the
// image-tag list -tags.txt and the Facebook venues to tag by hand
// -fb-tag-by-hand.txt, then reports venues missing social handles.
// Busy nights first switch to a tighter layout, then spill onto more images:
// -1.png, -2.png and -story-1.png, -story-2.png, each marked "1 of 2" (post the
// feed ones together as one album). reel.mjs reads only the feed images.
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
// DROP_FIRST order and a "+ N more at 815live.com" line is added. Shows are
// never cut off: acts wrap to as many lines as they need, every block is
// measured by satori before it's placed, and an image that would still
// overflow stops the run with an error instead of clipping.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORIES, CATEGORY_LABEL, isMusic } from '../../src/lib/categories.ts';
import { nightOf } from '../../src/lib/shows.ts';
import { C, h, measure, render, skyline, tape, wordmark } from './lib.mjs';
import { IG_CAP, fbPage, handleStatus, igHandle, noEmDash, planTags } from './venue-tags.mjs';

const ROOT = join(import.meta.dirname, '../..');
// --out DIR writes somewhere else (samples); the daily job uses social/.
const argOut = process.argv.indexOf('--out');
const OUT = argOut > -1 ? process.argv[argOut + 1] : join(ROOT, 'social');

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
// A show flyer (DESIGN.md): newsprint, the date on a yellow tape strip, acts
// in Anton, time and venue in Atkinson Hyperlegible, heavy black rules
// between shows, the Rockford skyline with 815live.com at the bottom.
// Every block is measured by satori before packing, so nothing is clipped.
const FORMATS = {
  // Feed posts (Instagram and Facebook portrait).
  feed: { W: 1080, H: 1350, safeTop: 0, safeBottom: 0, suffix: '' },
  // Stories: the apps cover the top and bottom 250 px, so content stays out of them.
  story: { W: 1080, H: 1920, safeTop: 250, safeBottom: 250, suffix: '-story' },
};
const PAD = 64; // side margins
const TOP = 44; // above the wordmark (inside the safe area)
const GAP = 18; // header → body, body → footer
const INNER = 1080 - PAD * 2;
const SKY_H = 216; // 1080 wide at the skyline's 5:1
const STRIP_H = 84; // the black strip under the skyline: 815live.com
const FOOTER_H = SKY_H + STRIP_H;
// Two densities: the tight one is tried before a busy night splits onto more images.
const DENSITY = {
  normal: { act: 42, sub: 26, pad: 12, rule: 4, label: 28, more: 26 },
  tight: { act: 34, sub: 23, pad: 7, rule: 3, label: 24, more: 23 },
};

const dayShort = (d) => shortDay(d).replace(',', ''); // 'Thu Oct 29'

function subLine(e, d, withDay) {
  // Venues with more than one room note it like "On the Council Oak stage."
  const stage = e.notes?.match(/^On the (.+?) stage\.?$/i)?.[1];
  const when = withDay ? `${dayShort(e.date)} · ${clock(e.startTime)}` : clock(e.startTime);
  const rest = [e.eventTitle, e.venueName, stage, e.town].filter(Boolean).join(' · ');
  return h('div', { fontFamily: 'Atkinson', fontSize: d.sub, lineHeight: 1.3, color: C.muted, marginTop: 4 },
    h('div', { flexShrink: 0, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap' }, when),
    h('div', { flexShrink: 1 }, `\u00a0· ${rest}`));
}

// A show: act(s) in Anton, wrapping as needed (never clamped), then time and venue.
// `first` rows in a section get no rule above them (the label sits there).
function rowEl(e, d, { withDay = false, first = false } = {}) {
  return h(
    'div',
    { width: INNER, flexShrink: 0, flexDirection: 'column', paddingTop: d.pad, paddingBottom: d.pad, borderTop: first ? 'none' : `${d.rule}px solid ${C.ink}` },
    h('div', { display: 'block', fontFamily: 'Anton', fontSize: d.act, lineHeight: 1.02, color: C.ink, textTransform: 'uppercase' }, e.act),
    subLine(e, d, withDay),
  );
}
const labelEl = (text, d) =>
  h('div', { width: INNER, flexShrink: 0, paddingTop: d.pad + 4, paddingBottom: 2, fontFamily: 'Anton', fontSize: d.label, lineHeight: 1.1, color: C.accent, textTransform: 'uppercase', borderTop: `${d.rule}px solid ${C.ink}` }, text);
const moreEl = (n, d) =>
  h('div', { width: INNER, flexShrink: 0, paddingTop: d.pad, paddingBottom: d.pad, borderTop: `${d.rule}px solid ${C.ink}`, fontFamily: 'Atkinson', fontWeight: 700, fontSize: d.more, color: C.ink }, `+ ${n} more at 815live.com`);

// Items: { label }, { row, withDay?, first? } or { more }. Labels open with a rule,
// so the row right after a label skips its own.
const itemEl = (it, d) => (it.label ? labelEl(it.label, d) : it.more ? moreEl(it.more, d) : rowEl(it.row, d, it));
const heights = new Map();
async function itemH(it, d) {
  const key = `${d.act}|${it.label ?? ''}|${it.more ?? ''}|${it.row ? `${it.row.venue}|${it.row.date}|${it.row.startTime}|${it.row.act}|${!!it.withDay}|${!!it.first}` : ''}`;
  if (!heights.has(key)) heights.set(key, await measure(itemEl(it, d), INNER));
  return heights.get(key);
}
const sumH = async (items, d) => {
  let n = 0;
  for (const it of items) n += await itemH(it, d);
  return n;
};
// Mark the first row after each label.
const firstAfterLabels = (items) => items.map((it, i) => (it.row && items[i - 1]?.label ? { ...it, first: true } : it));

const sectionItems = (list, { withDay = false } = {}) => {
  const items = [];
  for (const [cat, label] of SECTIONS) {
    const rows = list.filter((e) => e.category === cat);
    if (rows.length) items.push({ label }, ...rows.map((row) => ({ row, withDay })));
  }
  return firstAfterLabels(items);
};

// Other events in `room`: drop rows (DROP_FIRST, latest first) until they and
// the "+ N more" line fit. Music is never dropped.
async function fitOthers(room, d) {
  const kept = [...others];
  const build = () => {
    const items = sectionItems(kept);
    const more = others.length - kept.length;
    return more ? [...items, { more }] : items;
  };
  while (kept.length && (await sumH(build(), d)) > room) {
    const cat = DROP_FIRST.find((c) => kept.some((e) => e.category === c));
    kept.splice(kept.findLastIndex((e) => e.category === cat), 1);
  }
  let items = build();
  if (!kept.length && (await sumH(items, d)) > room) {
    console.warn(`no room for the "+ ${others.length} more" line`);
    items = [];
  }
  return { items, height: await sumH(items, d) };
}

// The header: wordmark (and "1 of 2"), the title in Anton with 815 in pink,
// the date on a strip of tape.
function headerEl(title, dateText, i, total) {
  const words = title.split(' ');
  return h(
    'div',
    { width: INNER, flexDirection: 'column', flexShrink: 0 },
    h('div', { justifyContent: 'space-between', alignItems: 'center' },
      wordmark(58),
      total > 1 ? h('div', { background: C.ink, color: C.yellow, fontFamily: 'Anton', fontSize: 36, lineHeight: 1, padding: '10px 16px 8px', textTransform: 'uppercase' }, `${i + 1} of ${total}`) : null,
    ),
    h('div', { flexWrap: 'wrap', marginTop: 20, fontFamily: 'Anton', fontSize: 88, lineHeight: 0.95, textTransform: 'uppercase' },
      words.map((w, n) => h('div', { color: w === '815' ? C.accent : C.ink, marginRight: n < words.length - 1 ? 20 : 0 }, w)),
    ),
    tape(dateText, 42, { marginTop: 18, marginLeft: -4 }),
  );
}
const headerH = (title, dateText) => measure(headerEl(title, dateText, 0, 2), INNER);

function footerEl(f) {
  return h(
    'div',
    { width: f.W, flexDirection: 'column', flexShrink: 0 },
    h('div', { width: f.W, height: 6, background: C.ink }),
    skyline(f.W, SKY_H - 6),
    // Padding would widen a box in satori, so the strip centres an INNER-wide row instead.
    h('div', { width: f.W, height: STRIP_H, background: C.ink, alignItems: 'center', justifyContent: 'center' },
      h('div', { width: INNER, alignItems: 'center', justifyContent: 'space-between' },
        h('div', { fontFamily: 'Anton', fontSize: 54, lineHeight: 1, color: C.yellow, textTransform: 'uppercase' }, '815live.com'),
        h('div', { flexDirection: 'column', alignItems: 'flex-end', fontFamily: 'Atkinson', color: C.bg, fontSize: 22, lineHeight: 1.25 },
          h('div', {}, 'Playing soon? Send it in:'),
          h('div', { fontWeight: 700, fontSize: 25 }, 'shows@815live.com'),
        ),
      ),
    ),
    // Stories: the black continues under the app's bottom UI.
    f.safeBottom ? h('div', { width: f.W, height: f.safeBottom, background: C.ink }) : null,
  );
}

const bodyRoom = (f, hdr) => f.H - f.safeTop - f.safeBottom - TOP - hdr - GAP * 2 - FOOTER_H;

function pageEl(f, title, dateText, items, d, i, total) {
  return h(
    'div',
    { width: f.W, height: f.H, background: C.bg, flexDirection: 'column', alignItems: 'center', overflow: 'hidden' },
    h('div', { width: f.W, height: f.safeTop + TOP, flexShrink: 0 }),
    headerEl(title, dateText, i, total),
    h('div', { width: INNER, flexGrow: 1, marginTop: GAP, marginBottom: GAP, flexDirection: 'column' }, items.map((it) => itemEl(it, d))),
    footerEl(f),
  );
}

// Busy and average nights: everything on one image if it fits, at normal size
// and then tight; then music on one tight image with other events in the room
// left; then music split over images (tight), other events on the last one.
async function planNight(room) {
  const music = sectionItems(events);
  for (const d of [DENSITY.normal, DENSITY.tight]) {
    const all = [...music, ...sectionItems(others)];
    if ((await sumH(all, d)) <= room) return { d, pages: [all] };
  }
  const d = DENSITY.tight;
  const musicH = await sumH(music, d);
  if (musicH <= room) return { d, pages: [[...music, ...(await fitOthers(room - musicH, d)).items]] };

  const pages = [];
  let page = [];
  let used = 0;
  const moreRoom = others.length ? await itemH({ more: others.length }, d) : 0;
  // The last music row also leaves room under it for a "+ N more" line.
  const lastMusic = sectionItems(events).filter((it) => it.row).at(-1)?.row;
  for (const [cat, label] of SECTIONS.filter(([c]) => isMusic(c))) {
    const rows = events.filter((e) => e.category === cat);
    let first = true; // the next row opens this section on this image (label above it)
    let continued = false;
    for (const row of rows) {
      const labelH = await itemH({ label }, d);
      const need = (first ? labelH : 0) + (await itemH({ row, first }, d)) + (row === lastMusic ? moreRoom : 0);
      // Start a new image rather than overflow (and never strand a label at the bottom).
      if (used + need > room && page.length) {
        pages.push(page);
        page = [];
        used = 0;
        continued = !first;
        first = true;
      }
      if (first) {
        const l = { label: continued ? `${label} (cont.)` : label };
        page.push(l);
        used += await itemH(l, d);
      }
      const it = { row, first };
      page.push(it);
      used += await itemH(it, d);
      first = false;
    }
  }
  page.push(...(await fitOthers(room - used, d)).items);
  pages.push(page);
  return { d, pages };
}

const feedRoomFor = async (title, dateText) => bodyRoom(FORMATS.feed, await headerH(title, dateText));

// Quiet nights (fewer than QUIET music listings): one image with tonight, then
// as much of the coming week as fits. The week list is chosen on the feed
// image (the captions use it); the taller Story shows the same list.
const nothingTonight = !all.length;
const dateLine = longDate;
let weekShown = [];
let quietItems = [];
let qTitle = '';
if (quiet) {
  const d = DENSITY.normal;
  const tonightItems = sectionItems(events);
  // Room is figured with the longest title this night could get.
  const room = await feedRoomFor(nothingTonight ? 'Coming up in the 815' : `${heading} + coming up`, dateLine);
  const musicH = await sumH(tonightItems, d);
  const qOthers = await fitOthers(room - musicH, d);
  let weekRoom = room - musicH - qOthers.height - (nothingTonight ? 0 : await itemH({ label: 'Coming up' }, d));
  for (const [n, e] of week.entries()) {
    const it = { row: e, withDay: true, first: n === 0 };
    const rh = await itemH(it, d);
    if (rh > weekRoom) break;
    weekShown.push(e);
    weekRoom -= rh;
  }
  // Posts never say "No live music listed" (user rule, 2026-11-07): a night with
  // nothing on it posts only "Coming up", and with nothing coming up, nothing.
  if (nothingTonight && !weekShown.length) {
    console.log(`Nothing listed for ${date} and no room for the week. No image made.`);
    process.exit(0);
  }
  qTitle = nothingTonight ? 'Coming up in the 815' : weekShown.length ? `${heading} + coming up` : `${heading} in the 815`;
  const weekItems = weekShown.map((row, n) => ({ row, withDay: true, first: n === 0 && nothingTonight }));
  quietItems = firstAfterLabels([
    ...tonightItems,
    ...qOthers.items,
    ...(weekShown.length && !nothingTonight ? [{ label: 'Coming up' }] : []),
    ...weekItems,
  ]);
}

mkdirSync(OUT, { recursive: true });
for (const f of Object.values(FORMATS)) {
  const title = quiet ? qTitle : `${heading} in the 815`;
  const hdr = await headerH(title, dateLine);
  const room = bodyRoom(f, hdr);
  const plan = quiet ? { d: DENSITY.normal, pages: [quietItems] } : await planNight(room);
  for (const [i, items] of plan.pages.entries()) {
    // Checked after packing too: nothing may run off the image.
    const used = await sumH(items, plan.d);
    if (used > room) throw new Error(`${f.suffix || 'feed'} image ${i + 1} overflows by ${Math.ceil(used - room)} px`);
    const n = plan.pages.length > 1 ? `-${i + 1}` : '';
    const file = join(OUT, `tonight-${date}${f.suffix}${n}.png`);
    await render(pageEl(f, title, dateLine, items, plan.d, i, plan.pages.length), f.W, f.H, file);
  }
}

// ---------- caption ----------
// Post files hold ONLY the post text, ready to paste (user rule, 2026-11-07):
// tonight-DATE-instagram.txt is the Instagram caption (verified venues as
// @handle, up to IG_CAP; reel.mjs reads its title and hashtag lines) and
// -fb.txt the Facebook caption (plain venue names, never IG handles; pasted
// @mentions don't link there). Anything meant for the poster goes elsewhere:
// -notes.txt (artist Facebook Pages to tag, also printed here), -tags.txt the
// Instagram handles to tag on the image, and -fb-tag-by-hand.txt the top FB_TOP
// venues to tag by hand on Facebook (name and page URL, one per line; empty
// when none). All start with tonight-DATE so the daily job's cleanup removes
// them. See venue-tags.mjs for the order.
const captionRows = [];
for (const [cat] of SECTIONS) for (const e of all.filter((e) => e.category === cat)) captionRows.push(e);
const appearances = [
  ...captionRows.map((e) => ({ venue: e.venue, category: e.category })),
  ...weekShown.map((e) => ({ venue: e.venue, category: e.category, coming: true })),
];
const plan = planTags(appearances, venues);

function caption(venueLabel, sep, { calendar = 'https://815live.com' } = {}) {
  const lines = [nothingTonight ? 'Coming Up in the 815 🎶' : `${isToday ? 'Tonight' : longDate}${weekShown.length ? ' + Coming Up' : ''} in the 815 🎶`, ''];
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
  lines.push(`Full calendar: ${calendar}`, 'Got a show? shows@815live.com', '', '#Rockford #RockfordIL #LiveMusic #815');
  return lines;
}

// Instagram: every line at a tagged venue gets its @handle (user request,
// 2026-11-07), within IG_CAP @mentions for the whole caption. Each tagged
// venue's first mention always counts (planTags already ranked and capped
// those); repeats use what's left of the cap, in caption order. Lines read
// "Act at Venue" so a handle never follows a bare @. Links don't work in IG
// captions, so the calendar line says "link in bio".
const mentioned = new Set();
let repeatsLeft = IG_CAP - plan.igTagged.size;
const igLines = caption((e) => {
  if (!plan.igTagged.has(e.venue)) return e.venueName;
  if (mentioned.has(e.venue)) {
    if (repeatsLeft <= 0) return e.venueName;
    repeatsLeft--;
  }
  mentioned.add(e.venue);
  return `@${igHandle(venues[e.venue])}`;
}, 'at', { calendar: 'link in bio' });
// Facebook: "at", never "@" (every @ fires FB's Page search; user rule 2026-11-07).
const fbLines = caption((e) => e.venueName, 'at');
const pagesToTag = [...new Set([...events, ...weekShown].flatMap((e) => e.artistPages))];
const noteLines = pagesToTag.length ? ['Artist Facebook Pages to tag when you post:', ...pagesToTag] : [];
const fbTagLines = plan.fbTop.map((s) => `${venues[s].name}: ${fbPage(venues[s])}`);

const write = (path, lines) => {
  writeFileSync(path, noEmDash(lines.length ? lines.join('\n') + '\n' : ''));
  console.log(`wrote ${path}`);
};
write(join(OUT, `tonight-${date}-instagram.txt`), igLines);
write(join(OUT, `tonight-${date}-fb.txt`), fbLines);
write(join(OUT, `tonight-${date}-tags.txt`), plan.imageTags.map((h) => `@${igHandle(venues[h])}`));
write(join(OUT, `tonight-${date}-fb-tag-by-hand.txt`), fbTagLines);
write(join(OUT, `tonight-${date}-notes.txt`), noteLines);
if (noteLines.length) console.log(noteLines.join('\n  '));
if (plan.imageTags.length > IG_CAP) console.log(`note: ${plan.imageTags.length} image tags; Instagram allows ${IG_CAP} per image, so split them across the album`);

// Report: tonight's venues with missing or unverified handles.
const todo = plan.needsWork.map((s) => handleStatus(s, venues[s])).filter(Boolean);
console.log(`venue tags: ${IG_CAP - repeatsLeft} Instagram mentions in caption (${plan.igTagged.size} venues), ${plan.imageTags.length} image tags, ${plan.fbTop.length} Facebook to tag by hand`);
if (todo.length) console.log(`venues to fill in (npm run social:handles for all):\n${todo.map((t) => `  - ${t}`).join('\n')}`);
