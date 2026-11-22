// Generates src/components/RockfordSkyline.astro: an original, hand-built flat
// illustration of the Rock River through downtown Rockford (bridges, skyline,
// "Forest City" trees, a sawtooth-roof factory). Colours come from CSS custom
// properties so each theme can ink it differently. Run: node scripts/design/skyline.mjs
import { writeFileSync } from 'node:fs';

const W = 1200, H = 240, BANK = 178;
let seed = 815;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const r = (n) => Math.round(n * 10) / 10;
const out = { far: [], tree: [], bld: [], win: [], river: [], ripple: [], glow: [], bridge: [], light: [] };

// Far ridge of trees behind everything (the Forest City canopy).
let d = `M0 ${BANK}`;
for (let x = 0; x <= W; x += 18) d += ` Q${x + 9} ${r(BANK - 34 - rnd() * 22)} ${x + 18} ${r(BANK - 26 - rnd() * 10)}`;
out.far.push(`<path d="${d} L${W} ${BANK} Z"/>`);

// Buildings: [x, w, top, kind]
const B = [
  [236, 26, 150, 'church'], [300, 46, 118, 'flat'], [350, 38, 96, 'step'], [392, 60, 70, 'tower'],
  [456, 34, 128, 'flat'], [494, 70, 104, 'flat'], [568, 42, 98, 'dome'], [614, 52, 124, 'theater'],
  [670, 44, 90, 'step'], [718, 58, 112, 'tank'], [780, 36, 134, 'flat'], [820, 50, 120, 'flat'],
];
for (const [x, w, t, k] of B) {
  let p = `M${x} ${BANK} V${t} H${x + w} V${BANK} Z`;
  if (k === 'step') p += ` M${x + 5} ${t} V${t - 10} H${x + w - 5} V${t} Z M${x + 12} ${t - 10} V${t - 18} H${x + w - 12} V${t - 10} Z`;
  if (k === 'tower') p += ` M${x + 6} ${t} V${t - 9} H${x + w - 6} V${t} Z M${x + 14} ${t - 9} V${t - 17} H${x + w - 14} V${t - 9} Z M${x + 22} ${t - 17} V${t - 24} H${x + w - 22} V${t - 17} Z M${x + w / 2 - 1.5} ${t - 24} V${t - 44} H${x + w / 2 + 1.5} V${t - 24} Z`;
  if (k === 'dome') p += ` M${x + 6} ${t} A${w / 2 - 6} ${w / 2 - 8} 0 0 1 ${x + w - 6} ${t} Z M${x + w / 2 - 1} ${t - (w / 2 - 8)} V${t - w / 2 - 6} H${x + w / 2 + 1} V${t - (w / 2 - 8)} Z`;
  if (k === 'church') p += ` M${x} ${t} L${x + w / 2} ${t - 52} L${x + w} ${t} Z`;
  if (k === 'tank') p += ` M${x + 34} ${t} V${t - 10} H${x + 52} V${t} Z M${x + 31} ${t - 10} L${x + 43} ${t - 17} L${x + 55} ${t - 10} Z`;
  if (k === 'theater') p += ` M${x + 6} ${t - 30} H${x + 16} V${t + 20} H${x + 6} Z`; // vertical blade sign
  out.bld.push(`<path d="${p}"/>`);
  if (k === 'theater') { // marquee box + bulbs
    out.light.push(`<rect x="${x - 4}" y="${t + 30}" width="${w + 8}" height="9"/>`);
    for (let i = 0; i < 6; i++) out.light.push(`<circle cx="${x + 11}" cy="${t - 24 + i * 8}" r="2"/>`);
  }
  // windows
  const cols = Math.max(2, Math.floor((w - 8) / 9));
  const gap = (w - cols * 4) / (cols + 1);
  for (let y = t + 8; y < BANK - 8; y += 10)
    for (let c = 0; c < cols; c++) if (rnd() < 0.42) out.win.push(`<rect x="${r(x + gap + c * (4 + gap))}" y="${y}" width="4" height="5"/>`);
}
// Sawtooth-roof factory + smokestack (Rockford's machine-shop past).
let f = `M880 ${BANK} V146`;
for (let x = 880; x < 1000; x += 20) f += ` L${x} 132 L${x + 20} 146`;
f += ` V${BANK} Z M1010 ${BANK} V86 H1020 V${BANK} Z`;
out.bld.push(`<path d="${f}"/>`);
for (let x = 884; x < 1000; x += 20) out.win.push(`<rect x="${x}" y="135" width="3" height="9"/>`);

// Foreground trees on the banks: round crowns and pines.
const trees = [[14, 'p'], [40, 'r'], [70, 'p'], [104, 'r'], [138, 'p'], [176, 'r'], [205, 'p'], [276, 'r'], [870, 'r'], [1036, 'p'], [1062, 'r'], [1094, 'p'], [1124, 'r'], [1156, 'p'], [1184, 'r']];
for (const [x, k] of trees) {
  const h = 26 + rnd() * 18;
  if (k === 'p') out.tree.push(`<path d="M${x} ${BANK} V${r(BANK - 6)} H${x - 2} L${x + 1} ${r(BANK - h - 8)} L${x + 4} ${r(BANK - 6)} H${x + 2} V${BANK} Z M${x - 9} ${r(BANK - 6)} L${x + 1} ${r(BANK - h)} L${x + 11} ${r(BANK - 6)} Z M${x - 7} ${r(BANK - h / 2)} L${x + 1} ${r(BANK - h - 6)} L${x + 9} ${r(BANK - h / 2)} Z"/>`);
  else out.tree.push(`<path d="M${x - 1.5} ${BANK} V${r(BANK - h / 2)} H${x + 1.5} V${BANK} Z"/><circle cx="${x}" cy="${r(BANK - h / 2 - 8)}" r="${r(h / 3 + 3)}"/>`);
}

// River.
out.river.push(`<rect x="0" y="${BANK}" width="${W}" height="${H - BANK}"/>`);
for (let i = 0; i < 70; i++) {
  const y = BANK + 10 + rnd() * (H - BANK - 14), x = rnd() * W, l = 10 + rnd() * 40;
  out.ripple.push(`<rect x="${r(x)}" y="${r(y)}" width="${r(l)}" height="1.6" rx=".8"/>`);
}
// Window light reflected on the water under the downtown blocks.
for (let x = 300; x < 870; x += 7) if (rnd() < 0.5) out.glow.push(`<rect x="${x}" y="${r(BANK + 6 + rnd() * 30)}" width="${r(3 + rnd() * 6)}" height="2"/>`);

// Arched road bridge (left) and truss rail bridge (right).
const deck = 198;
let a = `M40 ${deck - 5} H440 V${deck + 3} H40 Z`;
for (let i = 0; i < 4; i++) {
  const x0 = 40 + i * 100, x1 = x0 + 100;
  a += ` M${x0} ${deck + 3} H${x1} V${H} H${x1 - 8} V${deck + 34} Q${x0 + 50} ${deck + 2} ${x0 + 8} ${deck + 34} V${H} H${x0} Z`;
}
out.bridge.push(`<path d="${a}" fill-rule="evenodd"/>`);
for (let x = 60; x <= 420; x += 60) {
  out.bridge.push(`<rect x="${x - 1}" y="${deck - 20}" width="2" height="15"/>`);
  out.light.push(`<circle cx="${x}" cy="${deck - 21}" r="2.6"/>`);
}
let t = `M760 ${deck - 2} H1200 V${deck + 4} H760 Z M760 ${deck - 26} H1200 V${deck - 22} H760 Z`;
for (let x = 760; x < 1200; x += 22) t += ` M${x} ${deck - 2} L${x + 2} ${deck - 2} L${x + 24} ${deck - 24} L${x + 22} ${deck - 24} Z M${x + 20} ${deck - 2} L${x + 22} ${deck - 2} L${x} ${deck - 24} L${x - 2} ${deck - 24} Z`;
for (const x of [800, 920, 1040, 1160]) t += ` M${x - 6} ${deck + 4} H${x + 6} V${H} H${x - 6} Z`;
out.bridge.push(`<path d="${t}"/>`);

const g = (cls, arr) => `  <g class="sk-${cls}">${arr.join('')}</g>`;
const svg = `---
// GENERATED by scripts/design/skyline.mjs; edit the script, not this file.
// Original flat illustration: the Rock River through downtown Rockford.
interface Props { class?: string }
const { class: cls } = Astro.props;
---
<svg class:list={['rockford-skyline', cls]} viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
${g('far', out.far)}
${g('tree', out.tree)}
${g('bld', out.bld)}
${g('win', out.win)}
${g('river', out.river)}
${g('ripple', out.ripple)}
${g('glow', out.glow)}
${g('bridge', out.bridge)}
${g('light', out.light)}
</svg>

<style>
  .rockford-skyline { display: block; width: 100%; height: auto; }
  .sk-far { fill: var(--sk-far, #333); }
  .sk-tree { fill: var(--sk-tree, #222); }
  .sk-bld { fill: var(--sk-bld, #111); }
  .sk-win { fill: var(--sk-win, #fc3); }
  .sk-river { fill: var(--sk-river, #135); }
  .sk-ripple { fill: var(--sk-ripple, #fff3); }
  .sk-glow { fill: var(--sk-glow, #fc36); }
  .sk-bridge { fill: var(--sk-bridge, #000); }
  .sk-light { fill: var(--sk-light, #fc3); }
</style>
`;
writeFileSync(new URL('../../src/components/RockfordSkyline.astro', import.meta.url), svg);
console.log('wrote RockfordSkyline.astro', svg.length, 'bytes');
