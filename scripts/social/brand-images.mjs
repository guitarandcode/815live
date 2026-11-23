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
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { C, h, render, skyline, tape, ticket } from './lib.mjs';

const ROOT = join(import.meta.dirname, '../..');
const OUT = join(ROOT, 'docs/redesign/social');

// Profile: the ticket stub over LIVE, both big enough to read as a thumbnail.
// The circle's radius is 540; the farthest corner of the art is about 430 out.
const profile = h(
  'div',
  { width: 1080, height: 1080, background: C.bg, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  ticket(300, { admit: false, rotate: -6 }),
  h('div', { marginTop: 30, fontFamily: 'Anton', fontSize: 200, lineHeight: 1, color: C.ink, textTransform: 'uppercase' }, 'live'),
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
