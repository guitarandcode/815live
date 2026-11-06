// source.file points at the original under ~/815live-sources/ (outside the repo).
// The path format is always checked; that the file exists is checked only
// where that folder is present (the user's machine, not CI).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const DATA = new URL('../data/', import.meta.url).pathname;
const SOURCES = process.env.SOURCES_DIR ?? join(homedir(), '815live-sources');
const FORMAT = /^(venues|bands)\/[^/]+\/[^/]+$|^(waiting|skipped|kevin)\/[^/]+$/;

function withFile() {
  const out: { id: string; file: string }[] = [];
  for (const dir of ['shows', 'recurring']) {
    for (const f of readdirSync(join(DATA, dir))) {
      if (!f.endsWith('.json')) continue;
      const file = JSON.parse(readFileSync(join(DATA, dir, f), 'utf8')).source?.file;
      if (file !== undefined) out.push({ id: `${dir}/${f}`, file });
    }
  }
  return out;
}

test('source.file: relative path under ~/815live-sources', () => {
  for (const { id, file } of withFile()) assert.match(file, FORMAT, `${id}: ${file}`);
});

test('source.file: the original exists (local only)', { skip: !existsSync(SOURCES) && 'no ~/815live-sources here' }, () => {
  const missing = withFile().filter(({ file }) => !existsSync(join(SOURCES, file)));
  assert.deepEqual(missing, [], 'moved or renamed a source file? update source.file to match');
});
