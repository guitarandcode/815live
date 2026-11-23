// Renders public/favicon.svg: the yellow 815 ticket stub, with "815" in Anton
// turned into paths by satori so the icon doesn't depend on installed fonts.
// Run by hand after changing the mark: node scripts/design/favicon.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import satori from 'satori';

const anton = readFileSync(new URL('../social/fonts/anton-latin-400-normal.woff', import.meta.url));
const h = (type, style, children) => ({ type, props: { style, children } });
const svg = await satori(
  h('div', { width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' },
    h('div', {
      width: 60, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#ffd21a', border: '3px solid #141414', transform: 'rotate(-6deg)',
      fontFamily: 'Anton', fontSize: 34, lineHeight: 1, color: '#141414', paddingTop: 2,
    }, '815')),
  { width: 64, height: 64, fonts: [{ name: 'Anton', data: anton, weight: 400, style: 'normal' }] },
);
writeFileSync(new URL('../../public/favicon.svg', import.meta.url), svg + '\n');
console.log('wrote public/favicon.svg', svg.length, 'bytes');
