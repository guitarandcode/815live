// Renders public/og.png (1200x630 social card: wordmark + tagline) with
// headless Chrome. Run by hand after changing the brand: node scripts/og-image.mjs
// The PNG is committed, so builds don't need a browser.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OUT = join(import.meta.dirname, '../public/og.png');
const CHROME = process.env.CHROME ?? 'google-chrome';

// The look follows DESIGN.md ("Telephone Pole"); fonts come from public/fonts
// and the skyline from src/components/RockfordSkyline.astro.
const root = join(import.meta.dirname, '..');
const font = (f) => `url('file://${join(root, 'public/fonts', f)}') format('woff2')`;
const skySrc = readFileSync(join(root, 'src/components/RockfordSkyline.astro'), 'utf8');
const skyline = skySrc
  .slice(skySrc.indexOf('<svg'), skySrc.indexOf('</svg>') + 6)
  .replace(/class:list=\{[^}]*\}/, 'class="sky"')
  .replace(/preserveAspectRatio="[^"]*"/, 'preserveAspectRatio="xMidYMax slice"');

const html = `<!doctype html><meta charset="utf-8"><style>
  @font-face { font-family: Anton; src: ${font('anton-latin-400-normal.woff2')}; }
  @font-face { font-family: Atkinson; font-weight: 700; src: ${font('atkinson-hyperlegible-latin-700-normal.woff2')}; }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  body { position: relative; background: #e4e2dd; color: #141414; font-family: Anton, sans-serif; }
  .top { padding: 64px 80px 0; }
  .mark { display: flex; align-items: center; gap: 22px; }
  .mark svg { height: 150px; width: auto; transform: rotate(-4deg); }
  .live { font-size: 150px; line-height: 1; text-transform: uppercase; }
  .tag { margin-top: 26px; font-size: 64px; line-height: 1; text-transform: uppercase; }
  .tag span { color: #b0124f; }
  .sub { margin-top: 14px; font-family: Atkinson, sans-serif; font-weight: 700; font-size: 28px; color: #45423d; }
  .sky { position: absolute; left: 0; right: 0; bottom: 0; width: 1200px; height: 190px; border-top: 6px solid #141414; }
  .sk-far, .sk-bridge { fill: #b0124f; } .sk-tree, .sk-bld, .sk-river { fill: #141414; }
  .sk-win, .sk-glow, .sk-light { fill: #ffd21a; } .sk-ripple { fill: #e4e2dd; }
</style>
<div class="top">
  <div class="mark">
    <svg viewBox="0 0 168 80"><path d="M6 4 H162 V30 A10 10 0 0 0 162 50 V76 H6 V50 A10 10 0 0 0 6 30 Z" fill="#ffd21a" stroke="#141414" stroke-width="3"/>
      <path d="M44 10 V70" stroke="#141414" stroke-dasharray="3 4" stroke-width="2"/>
      <text x="25" y="40" text-anchor="middle" transform="rotate(-90 25 40)" font-family="Atkinson" font-weight="700" font-size="9.5" fill="#141414">ADMIT ONE</text>
      <text x="104" y="61" text-anchor="middle" font-family="Anton" font-size="50" fill="#141414">815</text></svg>
    <div class="live">live</div>
  </div>
  <div class="tag">Live music in Rockford <span>&amp;</span> the 815</div>
  <div class="sub">Who's playing, where, when, and what it costs. Tonight and every night.</div>
</div>
${skyline}`;

const dir = mkdtempSync(join(tmpdir(), 'og-'));
const page = join(dir, 'og.html');
writeFileSync(page, html);
execFileSync(CHROME, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1200,630',
  `--screenshot=${OUT}`,
  `file://${page}`,
], { stdio: 'ignore' });
console.log(`wrote ${OUT}`);
