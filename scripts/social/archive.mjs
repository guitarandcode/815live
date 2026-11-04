// Moves past daily post files out of social/ into social/archive/YYYY-MM/.
//
//   node scripts/social/archive.mjs                    # today = Chicago date
//   node scripts/social/archive.mjs --today 2026-11-04 --dir /some/social
//
// Only top-level files named tonight-YYYY-MM-DD* (png, txt, mp4, -1.png,
// -fb.txt, -reel.txt, coming-up variants, ...) dated before today move.
// Today's and future-dated files, brand images and anything else stay put.
// Safe to rerun: a file whose name already exists in its month folder is
// skipped and reported, never overwritten. Nothing is ever deleted.
// Run by the 9 AM job (~/.local/bin/815live-inbox.sh) before social:tonight.
import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from 'node:fs';
import { join } from 'node:path';

const NAME = /^tonight-(\d{4})-(\d{2})-(\d{2})\b/;

export const chicagoToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());

/** Returns { moved: [[from, to]], skipped: [name] } (paths relative to dir). */
export function archiveSocial(dir, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error(`Bad today: ${today}`);
  const moved = [];
  const skipped = [];
  if (!existsSync(dir)) return { moved, skipped };
  for (const name of readdirSync(dir).sort()) {
    const m = NAME.exec(name);
    if (!m) continue;
    const date = `${m[1]}-${m[2]}-${m[3]}`;
    if (date >= today) continue;
    const from = join(dir, name);
    if (!statSync(from).isFile()) continue;
    const month = `${m[1]}-${m[2]}`;
    const destDir = join(dir, 'archive', month);
    const to = join(destDir, name);
    if (existsSync(to)) {
      skipped.push(name);
      continue;
    }
    mkdirSync(destDir, { recursive: true });
    renameSync(from, to);
    moved.push([name, join('archive', month, name)]);
  }
  return { moved, skipped };
}

if (import.meta.filename === process.argv[1]) {
  const arg = (flag) => {
    const i = process.argv.indexOf(flag);
    return i > -1 ? process.argv[i + 1] : undefined;
  };
  const dir = arg('--dir') ?? join(import.meta.dirname, '../../social');
  const today = arg('--today') ?? chicagoToday();
  const { moved, skipped } = archiveSocial(dir, today);
  for (const [, to] of moved) console.log(`archived ${to}`);
  for (const name of skipped) console.log(`skipped ${name} (already in archive; left in social/)`);
  console.log(`social:archive: ${moved.length} moved, ${skipped.length} skipped (before ${today})`);
}
