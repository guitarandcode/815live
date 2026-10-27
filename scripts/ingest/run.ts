// Runs ingestion adapters and updates /data in place.
// Usage: node scripts/ingest/run.ts [--full] [--dry-run] [adapter-id ...]
//   --full     refetch every source page, ignoring saved lastmod state
//   --dry-run  fetch and parse, print what would change, write nothing
// One failing adapter doesn't stop the others; the exit code is 1 if any failed.
import { join } from 'node:path';
import * as hardRock from './adapters/hard-rock-rockford.ts';
import { DATA, readJson, reconcile, writeJson } from './lib/store.ts';
import { chicagoDate } from '../../src/lib/time.ts';

const ADAPTERS = [hardRock];

const args = process.argv.slice(2);
const full = args.includes('--full');
const dryRun = args.includes('--dry-run');
const only = args.filter((a) => !a.startsWith('--'));
const today = chicagoDate(new Date());
let failed = false;
// Date each adapter last ran clean; the site shows it as its listings' "last checked".
const checkedPath = join(DATA, 'ingest', 'checked.json');
const checked = readJson<Record<string, string>>(checkedPath, {});

for (const adapter of ADAPTERS) {
  if (only.length && !only.includes(adapter.id)) continue;
  const statePath = join(DATA, 'ingest', `${adapter.id}.json`);
  try {
    // Each adapter defines the shape of its own saved state.
    const result = await adapter.run(readJson<Record<string, any>>(statePath, {}), today, full);
    const changes = reconcile(adapter.id, result.refetched, result.alive, today, dryRun);
    if (!dryRun) writeJson(statePath, result.state);
    if (!result.log.some((l) => l.startsWith('WARN'))) checked[adapter.id] = today;
    console.log(`[${adapter.id}]`);
    for (const line of result.log) console.log(`  ${line}`);
    console.log(
      `  ${dryRun ? 'would write' : 'wrote'} ${changes.written.length}, deleted ${changes.deleted.length}, new artists ${changes.artistsCreated.length}` +
        (changes.deleted.length ? `\n  deleted: ${changes.deleted.join(', ')}` : '') +
        (changes.artistsCreated.length ? `\n  new artists: ${changes.artistsCreated.join(', ')}` : ''),
    );
    if (dryRun) for (const line of changes.details) console.log(`    ${line}`);
    if (result.log.some((l) => l.startsWith('WARN'))) console.log(`::warning::${adapter.id} had pages it couldn't parse`);
  } catch (e) {
    failed = true;
    console.log(`::error::[${adapter.id}] ${(e as Error).message}`);
  }
}

if (dryRun) console.log('(dry run: nothing written)');
else writeJson(checkedPath, checked);
process.exit(failed ? 1 : 0);
