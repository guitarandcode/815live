// Facebook profile picture and cover photo, in the site's brand.
// Run: node scripts/social/brand-images.mjs   (writes to social/)
import { join } from 'node:path';
import { C, h, render, wordmark } from './lib.mjs';

const OUT = join(import.meta.dirname, '../../social');

// Profile picture: Facebook crops it to a circle, so everything sits well inside it.
const profile = h(
  'div',
  {
    width: 720, height: 720, background: C.bg,
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Cond', color: C.ink,
  },
  h('div', {
    background: C.accent, color: C.bg, fontWeight: 900, fontSize: 250, lineHeight: 1,
    letterSpacing: -4, borderRadius: 44, padding: '22px 44px 14px',
  }, '815'),
  h(
    'div',
    { alignItems: 'center', marginTop: 18, fontWeight: 800, fontSize: 132, lineHeight: 1, letterSpacing: -1 },
    'live',
    h('div', {
      width: 34, height: 34, borderRadius: 34, background: C.accent, marginLeft: 14,
      alignSelf: 'flex-start', marginTop: 10, boxShadow: '0 0 0 10px rgba(255,106,77,0.18)',
    }),
  ),
);

// Cover photo: 1640x624. Facebook centers the round profile picture over the
// cover, so the middle stays empty: headline in the left third, tagline and URL
// in the right third.
const side = (align, ...kids) =>
  h('div', { width: 500, flexDirection: 'column', alignItems: align, justifyContent: 'center' }, ...kids);
const cover = h(
  'div',
  { width: 1640, height: 624, background: C.bg, alignItems: 'center', justifyContent: 'center', color: C.ink },
  h('div', { width: 1500, justifyContent: 'space-between', alignItems: 'center' },
    side('flex-start',
      h('div', { fontFamily: 'Cond', fontWeight: 900, fontSize: 84, lineHeight: 0.95, textTransform: 'uppercase', flexDirection: 'column', whiteSpace: 'nowrap' },
        h('div', {}, 'Live music'),
        h('div', {}, 'in Rockford'),
        h('div', { color: C.accent }, '& the 815'),
      ),
    ),
    side('flex-end',
      h('div', { fontFamily: 'Sans', fontSize: 32, lineHeight: 1.35, color: C.muted, flexDirection: 'column', alignItems: 'flex-end' },
        h('div', {}, 'Bands, karaoke, DJ nights,'),
        h('div', {}, 'open mics and comedy.'),
        h('div', { color: C.ink, fontWeight: 600 }, 'Tonight and every night.'),
      ),
      h('div', {
        marginTop: 30, fontFamily: 'Cond', fontWeight: 700, fontSize: 42, color: C.bg, background: C.accent,
        borderRadius: 999, padding: '10px 34px 8px', letterSpacing: 1,
      }, '815live.com'),
    ),
  ),
);

await render(profile, 720, 720, join(OUT, 'profile.png'));
await render(cover, 1640, 624, join(OUT, 'cover.png'));
// A wordmark-only strip is handy for flyers and stories.
await render(h('div', { width: 900, height: 260, background: C.bg, alignItems: 'center', justifyContent: 'center' }, wordmark(150)), 900, 260, join(OUT, 'wordmark.png'));
