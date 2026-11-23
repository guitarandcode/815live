// Shared bits for the social images: the DESIGN.md palette and fonts, a tiny
// element helper for satori, the 815 ticket mark, tape strips, the Rockford
// skyline, and render-to-PNG. No browser and no network: fonts are the woff
// files in ./fonts, so every run renders the same.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const ROOT = join(import.meta.dirname, '../..');
const fontFile = (file) => readFileSync(join(import.meta.dirname, 'fonts', file));

// DESIGN.md, light palette. Keys kept from the old palette (reel.mjs uses C.bg).
export const C = {
  bg: '#e4e2dd', // newsprint
  ink: '#141414',
  muted: '#45423d',
  accent: '#b0124f', // poster pink
  yellow: '#ffd21a', // tape
  white: '#ffffff',
};

const FONTS = [
  { name: 'Anton', weight: 400, style: 'normal', data: fontFile('anton-latin-400-normal.woff') },
  { name: 'Atkinson', weight: 400, style: 'normal', data: fontFile('atkinson-hyperlegible-latin-400-normal.woff') },
  { name: 'Atkinson', weight: 700, style: 'normal', data: fontFile('atkinson-hyperlegible-latin-700-normal.woff') },
];

/** h('div', {style}, ...children): satori's element shape without JSX. */
export function h(type, style = {}, ...children) {
  const kids = children.flat().filter((c) => c !== null && c !== undefined && c !== false);
  return {
    type,
    props: {
      style: { display: 'flex', ...style },
      children: kids.length === 0 ? undefined : kids.length === 1 ? kids[0] : kids,
    },
  };
}

const img = (svg, width, height, style = {}) => ({
  type: 'img',
  props: { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, width, height, style: { width, height, ...style } },
});

/**
 * The 815 ticket stub (src/components/Mark815.astro), `height` px tall.
 * `admit: false` drops the small "ADMIT ONE" (profile picture: no small text).
 */
export function ticket(height, { admit = true, rotate = -4 } = {}) {
  const u = height / 80; // viewBox units → px
  const width = 168 * u;
  const shape = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 80" width="${width}" height="${height}">
    <path d="M6 4 H162 V30 A10 10 0 0 0 162 50 V76 H6 V50 A10 10 0 0 0 6 30 Z" fill="${C.yellow}" stroke="${C.ink}" stroke-width="3"/>
    ${admit ? `<path d="M44 10 V70" stroke="${C.ink}" stroke-dasharray="3 4" stroke-width="2" fill="none"/>` : ''}</svg>`;
  return h(
    'div',
    { position: 'relative', width, height, flexShrink: 0, transform: `rotate(${rotate}deg)` },
    img(shape, width, height, { position: 'absolute', left: 0, top: 0 }),
    // "815" over the stub's right part (x 44–162), or the whole stub without the tear line.
    h('div', {
      position: 'absolute', left: (admit ? 44 : 8) * u, top: 0, width: (admit ? 118 : 152) * u, height,
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Anton', fontSize: (admit ? 50 : 60) * u, lineHeight: 1, color: C.ink, paddingTop: 3 * u,
    }, '815'),
    admit
      ? h('div', {
          position: 'absolute', left: -10 * u, top: 33 * u, width: 70 * u, height: 14 * u,
          alignItems: 'center', justifyContent: 'center', transform: 'rotate(-90deg)',
          fontFamily: 'Atkinson', fontWeight: 700, fontSize: 9.5 * u, letterSpacing: 0.6 * u, color: C.ink,
        }, 'ADMIT ONE')
      : null,
  );
}

/** The wordmark: ticket stub, then LIVE in Anton. `size` is the type size in px. */
export function wordmark(size) {
  return h(
    'div',
    { alignItems: 'center' },
    ticket(size * 1.08),
    h('div', { marginLeft: size * 0.22, fontFamily: 'Anton', fontSize: size, lineHeight: 1, color: C.ink, textTransform: 'uppercase' }, 'live'),
  );
}

/** A strip of yellow tape: black Anton on yellow, slightly crooked, offset shadow. */
export function tape(text, size, style = {}) {
  return h('div', {
    alignSelf: 'flex-start', padding: `${size * 0.16}px ${size * 0.38}px ${size * 0.1}px`,
    background: C.yellow, color: C.ink, fontFamily: 'Anton', fontSize: size, lineHeight: 1.1,
    textTransform: 'uppercase', transform: 'rotate(-1.4deg)', boxShadow: `${Math.round(size / 10)}px ${Math.round(size / 10)}px 0 ${C.ink}`,
    ...style,
  }, text);
}

// The skyline, read from the site's component so both stay identical. Each
// <g class="sk-…"> gets its DESIGN.md ink as a plain fill (resvg, no CSS vars).
const INKS = {
  far: C.accent, tree: C.ink, bld: C.ink, win: C.yellow, river: C.ink,
  ripple: C.bg, glow: C.yellow, bridge: C.accent, light: C.yellow,
};
const skySrc = readFileSync(join(ROOT, 'src/components/RockfordSkyline.astro'), 'utf8');
const skyBody = skySrc
  .slice(skySrc.indexOf('>', skySrc.indexOf('<svg')) + 1, skySrc.indexOf('</svg>'))
  .replace(/<g class="sk-(\w+)">/g, (_, k) => `<g fill="${INKS[k]}">`);

/**
 * The skyline band at `width` x `height` px, cropped like CSS
 * `xMidYMax slice`: the river stays at the bottom, the sides or the sky trim.
 */
export function skyline(width, height) {
  const [VW, VH] = [1200, 240];
  let vb;
  if (width / height >= VW / VH) {
    const vh = (VW * height) / width;
    vb = `0 ${VH - vh} ${VW} ${vh}`;
  } else {
    const vw = (VH * width) / height;
    vb = `${(VW - vw) / 2} 0 ${vw} ${VH}`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${width}" height="${height}">${skyBody}</svg>`;
  return img(svg, width, height, { flexShrink: 0 });
}

export const SKY_H = 216; // 1080 wide at the skyline's 5:1
export const STRIP_H = 84; // the black strip under the skyline: 815live.com
export const FOOTER_H = SKY_H + STRIP_H;

/**
 * The footer of the daily lineup and the intro: a 6 px rule, the skyline,
 * then an ink strip with 815LIVE.COM and `note` over shows@815live.com, inside
 * 64 px margins. `safeBottom` (Stories) continues the black under the app's UI.
 */
export function footer(width, { safeBottom = 0, note }) {
  return h(
    'div',
    { width, flexDirection: 'column', flexShrink: 0 },
    h('div', { width, height: 6, background: C.ink }),
    skyline(width, SKY_H - 6),
    // Padding would widen a box in satori, so the strip centres an inner row instead.
    h('div', { width, height: STRIP_H, background: C.ink, alignItems: 'center', justifyContent: 'center' },
      h('div', { width: width - 128, alignItems: 'center', justifyContent: 'space-between' },
        h('div', { fontFamily: 'Anton', fontSize: 54, lineHeight: 1, color: C.yellow, textTransform: 'uppercase' }, '815live.com'),
        h('div', { flexDirection: 'column', alignItems: 'flex-end', fontFamily: 'Atkinson', color: C.bg, fontSize: 22, lineHeight: 1.25 },
          h('div', {}, note),
          h('div', { fontWeight: 700, fontSize: 25 }, 'shows@815live.com'),
        ),
      ),
    ),
    safeBottom ? h('div', { width, height: safeBottom, background: C.ink }) : null,
  );
}

/** Laid-out height of `element` at `width`, from satori itself (so wrapping matches the render). */
export async function measure(element, width) {
  const svg = await satori(h('div', { width, flexDirection: 'column' }, element), { width, fonts: FONTS });
  return Number(svg.match(/height="([\d.]+)"/)[1]);
}

export async function render(element, width, height, outPath) {
  const svg = await satori(element, { width, height, fonts: FONTS });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  console.log(`wrote ${outPath}`);
}
