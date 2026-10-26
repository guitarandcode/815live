// Shared bits for the social images: brand colors, fonts, a tiny element
// helper for satori, and render-to-PNG. No browser needed.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const require = createRequire(import.meta.url);
const font = (pkg, file) =>
  readFileSync(join(dirname(require.resolve(`${pkg}/package.json`)), 'files', file));

export const C = {
  bg: '#12110f',
  panel: '#1c1a17',
  ink: '#f2eee7',
  muted: '#a59d91',
  accent: '#ff6a4d',
  line: 'rgba(255,255,255,0.09)',
};

const FONTS = [
  { name: 'Cond', weight: 700, data: font('@fontsource/roboto-condensed', 'roboto-condensed-latin-700-normal.woff') },
  { name: 'Cond', weight: 800, data: font('@fontsource/roboto-condensed', 'roboto-condensed-latin-800-normal.woff') },
  { name: 'Cond', weight: 900, data: font('@fontsource/roboto-condensed', 'roboto-condensed-latin-900-normal.woff') },
  { name: 'Sans', weight: 400, data: font('@fontsource/inter', 'inter-latin-400-normal.woff') },
  { name: 'Sans', weight: 600, data: font('@fontsource/inter', 'inter-latin-600-normal.woff') },
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

/** The wordmark: "815" in a coral pill, then "live" and a glowing dot. `size` is the type size in px. */
export function wordmark(size) {
  const dot = Math.round(size * 0.24);
  return h(
    'div',
    { alignItems: 'center', fontFamily: 'Cond', fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: -size / 84, color: C.ink },
    h('div', {
      background: C.accent, color: C.bg, borderRadius: size * 0.155,
      padding: `${size * 0.08}px ${size * 0.18}px ${size * 0.06}px`,
    }, '815'),
    h('div', { marginLeft: size * 0.13 }, 'live'),
    h('div', {
      width: dot, height: dot, borderRadius: dot, background: C.accent, marginLeft: size * 0.08,
      alignSelf: 'flex-start', marginTop: size * 0.06,
      boxShadow: `0 0 0 ${Math.round(dot * 0.3)}px rgba(255,106,77,0.18)`,
    }),
  );
}

export async function render(element, width, height, outPath) {
  const svg = await satori(element, { width, height, fonts: FONTS });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  console.log(`wrote ${outPath}`);
}
