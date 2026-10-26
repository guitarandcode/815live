// Renders public/og.png (1200x630 social card: wordmark + tagline) with
// headless Chrome. Run by hand after changing the brand: node scripts/og-image.mjs
// The PNG is committed, so builds don't need a browser.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OUT = join(import.meta.dirname, '../public/og.png');
const CHROME = process.env.CHROME ?? 'google-chrome';

const html = `<!doctype html><meta charset="utf-8"><style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  body {
    box-sizing: border-box; padding: 84px 96px; display: flex; flex-direction: column; justify-content: space-between;
    background: #12110f; color: #f2eee7; font-family: 'Roboto Condensed', 'Arial Narrow', sans-serif;
  }
  .mark { display: flex; align-items: center; font-weight: 800; font-size: 168px; line-height: 1; letter-spacing: -2px; }
  .num { background: #ff6a4d; color: #12110f; padding: 14px 30px 10px; border-radius: 26px; }
  .live { margin-left: 22px; }
  .live::after { content: ''; display: inline-block; width: 40px; height: 40px; margin-left: 14px; border-radius: 50%;
    background: #ff6a4d; vertical-align: 78px; box-shadow: 0 0 0 12px rgba(255,106,77,.18); }
  .tag { font-size: 60px; font-weight: 700; line-height: 1.1; text-transform: uppercase; letter-spacing: 1px; }
  .tag span { color: #ff6a4d; }
  .sub { margin-top: 18px; font-family: system-ui, sans-serif; font-size: 30px; color: #a59d91; }
</style>
<div class="mark"><span class="num">815</span><span class="live">live</span></div>
<div><div class="tag">Live music in Rockford <span>&amp;</span> the 815</div>
<div class="sub">Who's playing, where, when, and what it costs. Tonight and every night.</div></div>`;

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
