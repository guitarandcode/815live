// Profile picture, Facebook cover and the site's link-preview card, in the
// DESIGN.md look. Run by hand after a brand change: npm run social:brand
//
//   docs/redesign/social/profile.png   1080x1080. Facebook and Instagram crop it
//                                       to a circle, so the mark sits well inside it.
//   docs/redesign/social/cover.png     1640x624 Facebook cover. Phones crop the
//                                       sides, so text and key art stay in the
//                                       middle 1200 px; the skyline runs edge to edge.
//   public/og.png (+ a copy in docs)   1200x630 og:image, the cover's layout.
//                                       Base.astro points og:image at /og.png.
//   social/brand/intro.png             1080x1350 intro/welcome post for the feed.
//   social/brand/intro-story.png       1080x1920 Story version; content stays out
//                                       of the top and bottom 250 px.
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { C, FOOTER_H, footer, h, measure, render, skyline, tape, ticket, wordmark } from './lib.mjs';

const ROOT = join(import.meta.dirname, '../..');
const OUT = join(ROOT, 'docs/redesign/social');

// Profile: the ticket stub over LIVE, filling most of the circle. PROFILE_SCALE
// is relative to the first version (ticket 300 px, LIVE 200 px). The circle's
// radius is 540; check the farthest inked pixel after a size change.
const PROFILE_SCALE = Number(process.env.PROFILE_SCALE ?? 1.28);
const profile = h(
  'div',
  { width: 1080, height: 1080, background: C.bg, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  ticket(300 * PROFILE_SCALE, { admit: false, rotate: -6 }),
  h('div', { marginTop: 30 * PROFILE_SCALE, fontFamily: 'Anton', fontSize: 200 * PROFILE_SCALE, lineHeight: 1, color: C.ink, textTransform: 'uppercase' }, 'live'),
);

// Cover and og card: ticket + 815LIVE.COM, a tape strip, the skyline below.
function card(width, height, { sky, url, tag, mark, safe }) {
  return h(
    'div',
    { width, height, background: C.bg, flexDirection: 'column', alignItems: 'center' },
    h(
      'div',
      { width: safe, height: height - sky, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
      h('div', { alignItems: 'center' },
        ticket(mark),
        h('div', { marginLeft: mark * 0.28, fontFamily: 'Anton', fontSize: url, lineHeight: 1, color: C.ink, textTransform: 'uppercase' }, '815live.com'),
      ),
      tape('Live music in Rockford & the 815', tag, { alignSelf: 'center', marginTop: tag * 0.55 }),
    ),
    h('div', { width, height: 6, background: C.ink }),
    skyline(width, sky - 6),
  );
}

await render(profile, 1080, 1080, join(OUT, 'profile.png'));
await render(card(1640, 624, { sky: 290, url: 150, tag: 50, mark: 130, safe: 1200 }), 1640, 624, join(OUT, 'cover.png'));
await render(card(1200, 630, { sky: 250, url: 138, tag: 48, mark: 120, safe: 1100 }), 1200, 630, join(ROOT, 'public/og.png'));
copyFileSync(join(ROOT, 'public/og.png'), join(OUT, 'og.png'));
console.log(`copied public/og.png to ${join(OUT, 'og.png')}`);

// Intro/welcome post: "Who's playing tonight? Now you know." as a show flyer,
// laid out like the daily lineup (wordmark, Anton headline, tape, heavy rules,
// skyline footer). The three blocks spread over the room between header and
// footer; an image whose content doesn't fit stops the run instead of clipping.
const INTRO_PAD = 64;
const INTRO_INNER = 1080 - INTRO_PAD * 2;
const INTRO_TOP = 44;
const INTRO_GAP = 40; // above the footer
const INTRO_MIN = 28; // least space between the three blocks
const KINDS = ['Live bands', 'Karaoke', 'Open mics', 'Trivia & comedy'];

function introBody(big) {
  const head = h('div', { width: INTRO_INNER, flexDirection: 'column', flexShrink: 0 },
    wordmark(58),
    h('div', { marginTop: big ? 44 : 22, fontFamily: 'Anton', fontSize: big ? 138 : 116, lineHeight: 0.95, color: C.ink, textTransform: 'uppercase' }, "Who's playing tonight?"),
    tape('Now you know.', big ? 84 : 76, { marginTop: big ? 30 : 22, marginLeft: -4 }),
  );
  const sub = h('div', { width: INTRO_INNER, flexShrink: 0, paddingTop: 22, borderTop: `6px solid ${C.ink}`, flexDirection: 'column', fontFamily: 'Atkinson', fontSize: big ? 38 : 34, lineHeight: 1.25, color: C.ink },
    // Two lines on purpose, so "daily." never hangs alone.
    h('div', {}, 'Every show around Rockford and the 815, in one place.'),
    h('div', { fontWeight: 700 }, 'Posted daily.'));
  const list = h('div', { width: INTRO_INNER, flexDirection: 'column', flexShrink: 0 },
    KINDS.map((k, i) => h('div', {
      width: INTRO_INNER, alignItems: 'center', paddingTop: big ? 16 : 11, paddingBottom: big ? 12 : 8,
      borderTop: `${i ? 4 : 6}px solid ${C.ink}`, borderBottom: i === KINDS.length - 1 ? `6px solid ${C.ink}` : 'none',
    },
      h('div', { width: big ? 86 : 76, flexShrink: 0, fontFamily: 'Anton', fontSize: big ? 66 : 58, lineHeight: 1, color: C.accent }, String(i + 1).padStart(2, '0')),
      h('div', { fontFamily: 'Anton', fontSize: big ? 74 : 64, lineHeight: 1.02, color: C.ink, textTransform: 'uppercase' }, k),
    )),
  );
  return [head, sub, list];
}

async function intro(H, safe, file) {
  const big = false; // the Story's safe area leaves only ~70 px more room than the feed
  const blocks = introBody(big);
  const room = H - safe * 2 - INTRO_TOP - INTRO_GAP - FOOTER_H;
  const need = (u) => u + INTRO_MIN * (blocks.length - 1);
  let used = 0;
  for (const b of blocks) used += await measure(b, INTRO_INNER);
  if (need(used) > room) throw new Error(`${file}: content overflows by ${Math.ceil(need(used) - room)} px`);
  await render(h('div', { width: 1080, height: H, background: C.bg, flexDirection: 'column', alignItems: 'center' },
    h('div', { width: 1080, height: safe + INTRO_TOP, flexShrink: 0 }),
    h('div', { width: INTRO_INNER, flexGrow: 1, flexDirection: 'column', justifyContent: 'space-between', paddingBottom: INTRO_GAP }, blocks),
    footer(1080, { safeBottom: safe, note: 'Playing a show? Send it in:' }),
  ), 1080, H, join(ROOT, 'social/brand', file));
}
await intro(1350, 0, 'intro.png');
await intro(1920, 250, 'intro-story.png');
