// Report of every venue's social handles: what's verified, what's missing.
//   npm run social:handles
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleStatus } from './venue-tags.mjs';

const dir = join(import.meta.dirname, '../../data/venues');
const venues = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => [f.slice(0, -5), JSON.parse(readFileSync(join(dir, f), 'utf8'))]);

const todo = venues.map(([slug, v]) => handleStatus(slug, v)).filter(Boolean);
const ok = venues.filter(([, v]) => v.social?.verified && v.social.ig && v.social.fb).length;
console.log(`${venues.length} venues: ${ok} with verified Instagram and Facebook, ${todo.length} to fill in or check.`);
for (const t of todo) console.log(`  - ${t}`);
