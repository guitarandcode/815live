// "Tonight in the 815" Reel: today's graphic as a 1080x1920 video with a slow
// zoom, plus a short caption. Needs ffmpeg (with libx264) on PATH.
//
// One page: 15 s, zoom 100→108%, 0.6 s fades. Several pages (busy nights):
// each page in order, 7.5 s apiece (30 s cap; more than 4 pages split it),
// each zooming 100→105% from its own start and fading in from and out to the
// background over 0.5 s. See reel-timing.mjs.
//
//   node scripts/social/reel.mjs                 # today (Chicago)
//   node scripts/social/reel.mjs --date 2026-10-31
//
// Reads social/tonight-YYYY-MM-DD.png (or -1.png, -2.png, ... on busy
// nights) and its .txt caption from `npm run social:tonight`. Writes
// social/tonight-YYYY-MM-DD.mp4 and social/tonight-YYYY-MM-DD-reel.txt.
// No graphic for the date (nothing listed) means no reel, and exit 0.
//
// Layout: the graphic is scaled down onto a brand-background canvas and placed
// left of and below center, so that even at full zoom its content stays out
// of the Reels UI: the bottom 20% (caption, audio) and the right 15% (buttons).
// Frames are drawn by resvg with an exact fractional transform per frame and
// piped to ffmpeg, which only fades and encodes. (ffmpeg's zoompan rounds the
// crop every frame and jittered visibly even on a 4x canvas.)
//
// Audio (outside the repo, because the repo is public; see docs/decisions.md):
// one page copies ~/815live-sources/audio/reel.m4a as-is (already cut to 15 s,
// faded and loudness-normalized). Several pages trim
// ~/815live-sources/audio/reel-30s.flac (30 s of "Chirp" from the same 1:12
// start, 0.3 s fade in, normalized, no fade out) to the video length with a
// 2 s fade out, as AAC 192k. If that clip is shorter than the video the run
// fails rather than looping it. A missing file means a silent video. Music is
// never fetched from anywhere.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { C } from './lib.mjs';
import { FPS, SINGLE, multiTiming, multiFrame } from './reel-timing.mjs';

const ROOT = join(import.meta.dirname, '../..');
const OUT = join(ROOT, 'social');

const chicagoToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const date = arg('--date') ?? chicagoToday();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Bad --date: ${date}`);

const W = 1080;
const H = 1920;
// The 1080x1350 graphic's content box is x 72-1008, y 64-1286 (centered at
// 540, 675). At 0.84 scale and 108% zoom it is 849 px wide, 1109 tall; centered
// at (470, 900) it spans x 45-895 (< 918, the right 15%) and y 346-1454
// (< 1536, the bottom 20%). The zoom is anchored on that center. Multi-page
// reels only reach 105%, so they stay inside the same box.
const SCALE = 0.84;
const CX = 470;
const CY = 900;

// Pages in order: the single graphic, or -1, -2, ... until one is missing.
const single = join(OUT, `tonight-${date}.png`);
const pages = [];
if (existsSync(single)) pages.push(single);
else for (let i = 1; existsSync(join(OUT, `tonight-${date}-${i}.png`)); i++) pages.push(join(OUT, `tonight-${date}-${i}.png`));
if (!pages.length) {
  console.log(`no graphic for ${date} (nothing listed?); no reel`);
  process.exit(0);
}

const ff = spawnSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' });
if (ff.error) throw new Error('ffmpeg not found; install it (sudo apt install ffmpeg)');
if (!/libx264/.test(ff.stdout)) throw new Error('ffmpeg has no libx264 encoder');

const multi = pages.length > 1;
const timing = multi ? multiTiming(pages.length) : null;
const SECONDS = multi ? timing.seconds : SINGLE.seconds;
const FRAMES = multi ? timing.frames : FPS * SINGLE.seconds;

const AUDIO = join(homedir(), '815live-sources/audio', multi ? 'reel-30s.flac' : 'reel.m4a');
const audio = existsSync(AUDIO) ? AUDIO : null;
if (audio && multi) {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audio], { encoding: 'utf8' });
  const length = Number(probe.stdout.trim());
  if (!(length > 0)) throw new Error(`couldn't read the length of ${audio}`);
  if (length + 1e-3 < SECONDS) {
    throw new Error(`audio ${audio} is ${length.toFixed(2)} s but the video is ${SECONDS} s; not looping it (cut a longer clip)`);
  }
}
const bg = `0x${C.bg.slice(1)}`;
// One page: ffmpeg fades. Several: the fades are drawn per frame (opacity).
const video = multi
  ? '[0:v]format=yuv420p[v]'
  : [
    `[0:v]fade=t=in:st=0:d=${SINGLE.fade}:color=${bg}`,
    `fade=t=out:st=${SECONDS - SINGLE.fade}:d=${SINGLE.fade}:color=${bg}`,
    'format=yuv420p[v]',
  ].join(',');
const audioOut = !audio ? []
  : multi
    ? ['-af', `atrim=0:${SECONDS},afade=t=out:st=${SECONDS - 2}:d=2`, '-c:a', 'aac', '-b:a', '192k']
    : ['-c:a', 'copy'];

const mp4 = join(OUT, `tonight-${date}.mp4`);
const args = [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
  ...(audio ? ['-t', String(SECONDS), '-i', audio] : []),
  '-filter_complex', video,
  '-map', '[v]', ...(audio ? ['-map', '1:a', ...audioOut] : []),
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-r', String(FPS),
  '-t', String(SECONDS), '-movflags', '+faststart',
  mp4,
];
const enc = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((resolve) => enc.on('close', resolve));
// Linear zoom over every frame (of each page), so each step is the same tiny size.
const pngs = pages.map((p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`);
const [pw, ph] = [1080, 1350];
for (let n = 0; n < FRAMES; n++) {
  const f = multi ? multiFrame(n, timing.pageFrames) : { page: 0, zoom: 1 + ((SINGLE.zoomEnd - 1) * n) / (FRAMES - 1), opacity: 1 };
  const png = pngs[f.page];
  const s = SCALE * f.zoom;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}">`
    + `<rect width="${W}" height="${H}" fill="${C.bg}"/>`
    + `<image xlink:href="${png}" width="${pw}" height="${ph}" ${f.opacity < 1 ? ` opacity="${f.opacity}"` : ''} transform="translate(${CX - (s * pw) / 2} ${CY - (s * ph) / 2}) scale(${s})"/>`
    + '</svg>';
  const frame = new Resvg(svg).render().pixels;
  if (!enc.stdin.write(frame)) await new Promise((r) => enc.stdin.once('drain', r));
}
enc.stdin.end();
const status = await done;
if (status !== 0) throw new Error(`ffmpeg exited ${status}`);
console.log(`wrote ${mp4} (${pages.length} page${multi ? 's' : ''}, ${SECONDS} s)${audio ? ` (audio: ${audio})` : ' (silent)'}`);

// ---------- caption ----------
// The post caption's title line and hashtags; the video carries the listings.
const post = join(OUT, `tonight-${date}.txt`);
const postLines = existsSync(post) ? readFileSync(post, 'utf8').split('\n') : [];
const title = postLines[0] || 'Tonight in the 815 🎶';
const tags = postLines.find((l) => l.startsWith('#')) ?? '#Rockford #RockfordIL #LiveMusic #815';
const reelTxt = join(OUT, `tonight-${date}-reel.txt`);
writeFileSync(reelTxt, [title, 'Times, covers and the full calendar: 815live.com', 'Got a show? shows@815live.com', '', tags, ''].join('\n'));
console.log(`wrote ${reelTxt}`);
