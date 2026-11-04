import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { archiveSocial } from '../scripts/social/archive.mjs';

const setup = (names: string[]) => {
  const dir = mkdtempSync(join(tmpdir(), 'social-archive-'));
  for (const n of names) writeFileSync(join(dir, n), n);
  return dir;
};

test('social:archive moves only past-dated tonight files into archive/YYYY-MM', () => {
  const dir = setup([
    'cover.png',
    'tonight-2026-10-31-2.png',
    'tonight-2026-10-31-fb.txt',
    'tonight-2026-11-03.mp4',
    'tonight-2026-11-04.png',
    'tonight-2026-11-05.txt',
    'notes.txt',
  ]);
  const { moved, skipped } = archiveSocial(dir, '2026-11-04');
  assert.equal(moved.length, 3);
  assert.deepEqual(skipped, []);
  assert.deepEqual(readdirSync(join(dir, 'archive', '2026-10')).sort(), [
    'tonight-2026-10-31-2.png',
    'tonight-2026-10-31-fb.txt',
  ]);
  assert.deepEqual(readdirSync(join(dir, 'archive', '2026-11')), ['tonight-2026-11-03.mp4']);
  assert.deepEqual(readdirSync(dir).sort(), [
    'archive',
    'cover.png',
    'notes.txt',
    'tonight-2026-11-04.png',
    'tonight-2026-11-05.txt',
  ]);
});

test('social:archive is a no-op on rerun and never overwrites an archived file', () => {
  const dir = setup(['tonight-2026-10-30.txt']);
  archiveSocial(dir, '2026-11-04');
  assert.deepEqual(archiveSocial(dir, '2026-11-04'), { moved: [], skipped: [] });

  // Same name shows up again at the top level: left in place, archive copy untouched.
  writeFileSync(join(dir, 'tonight-2026-10-30.txt'), 'new');
  const { moved, skipped } = archiveSocial(dir, '2026-11-04');
  assert.deepEqual(moved, []);
  assert.deepEqual(skipped, ['tonight-2026-10-30.txt']);
  assert.equal(readFileSync(join(dir, 'tonight-2026-10-30.txt'), 'utf8'), 'new');
  assert.equal(readFileSync(join(dir, 'archive', '2026-10', 'tonight-2026-10-30.txt'), 'utf8'), 'tonight-2026-10-30.txt');
});

test('social:archive ignores directories and a missing social/ folder', () => {
  const dir = setup([]);
  mkdirSync(join(dir, 'tonight-2026-10-01'));
  assert.deepEqual(archiveSocial(dir, '2026-11-04'), { moved: [], skipped: [] });
  assert.ok(existsSync(join(dir, 'tonight-2026-10-01')));
  assert.deepEqual(archiveSocial(join(dir, 'nope'), '2026-11-04'), { moved: [], skipped: [] });
});
