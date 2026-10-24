// Post-build sanity check: every page's JSON-LD parses, and every show page's
// event (MusicEvent / ComedyEvent / Event) has the fields Google's Event rich result requires/recommends.
// Usage: node scripts/check-jsonld.mjs [dist]
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const errors = [];
let pages = 0;
let events = 0;

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(p);
    else if (p.endsWith('.html')) yield p;
  }
}

const EVENT_TYPES = ['MusicEvent', 'ComedyEvent', 'Event'];
const isoWithOffset = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/;

function checkEvent(ev, where) {
  const need = (cond, msg) => cond || errors.push(`${where}: ${msg}`);
  need(ev['@context'] === 'https://schema.org', '@context must be https://schema.org');
  need(EVENT_TYPES.includes(ev['@type']), `@type must be one of ${EVENT_TYPES.join('/')}`);
  need(typeof ev.name === 'string' && ev.name.length > 0, 'name required');
  need(isoWithOffset.test(ev.startDate ?? ''), `startDate must be ISO 8601 with offset, got ${ev.startDate}`);
  need(/-0[56]:00$/.test(ev.startDate ?? ''), `startDate offset should be Chicago (-05:00/-06:00), got ${ev.startDate}`);
  if (ev.endDate) need(isoWithOffset.test(ev.endDate) && new Date(ev.endDate) > new Date(ev.startDate), 'endDate must be after startDate');
  need(ev.eventStatus?.startsWith('https://schema.org/Event'), 'eventStatus should be a schema.org URL');
  const loc = ev.location ?? {};
  need(loc['@type'] === 'Place' && loc.name, 'location must be a named Place');
  const addr = loc.address ?? {};
  need(addr['@type'] === 'PostalAddress', 'location.address must be PostalAddress');
  for (const k of ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry']) need(addr[k], `address.${k} missing`);
  if (ev.performer !== undefined) {
    need(Array.isArray(ev.performer) && ev.performer.length > 0, 'performer must be a non-empty array');
    for (const p of ev.performer ?? []) need(['MusicGroup', 'Person'].includes(p['@type']) && p.name, 'performers must be named MusicGroup/Person');
  }
  if (ev.offers) {
    need(ev.offers['@type'] === 'Offer', 'offers must be an Offer');
    need(Number(ev.offers.price) > 0 && ev.offers.priceCurrency === 'USD', 'offers needs price > 0 and USD');
    need(/^https?:\/\//.test(ev.offers.url ?? ''), 'offers.url must be absolute');
  }
}

for await (const file of htmlFiles(dist)) {
  const html = await readFile(file, 'utf8');
  const rel = relative(dist, file);
  pages++;
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const parsed = [];
  for (const raw of blocks) {
    try {
      parsed.push(JSON.parse(raw));
    } catch (e) {
      errors.push(`${rel}: JSON-LD does not parse: ${e.message}`);
    }
  }
  if (rel.startsWith('shows/')) {
    const ev = parsed.find((o) => EVENT_TYPES.includes(o['@type']));
    if (!ev) errors.push(`${rel}: no event JSON-LD`);
    else {
      checkEvent(ev, rel);
      events++;
    }
  }
  if (rel.startsWith('venues/') && rel !== 'venues.html' && !parsed.some((o) => o['@type'] === 'MusicVenue'))
    errors.push(`${rel}: no MusicVenue JSON-LD`);
  if (rel.startsWith('artists/') && !parsed.some((o) => o['@type'] === 'MusicGroup'))
    errors.push(`${rel}: no MusicGroup JSON-LD`);
}

if (events === 0) errors.push('no show pages found');
// Cloudflare Pages serves the home page (status 200) for unknown URLs unless 404.html exists.
try {
  await readFile(join(dist, '404.html'), 'utf8');
} catch {
  errors.push('404.html missing: unknown URLs would soft-404 to the home page');
}
if (errors.length) {
  console.error(`JSON-LD check failed:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`JSON-LD OK: ${pages} pages scanned, ${events} event blocks validated.`);
