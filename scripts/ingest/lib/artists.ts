// Matches performer names from a listing against data/artists, so an adapter
// reuses "Emily Hurd" instead of minting a duplicate. Names that only share
// their first words with an existing act ("Abram Collier Nonet" vs "Abram
// Collier Quintet") are new acts, but flagged for a person to confirm.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DATA, readJson } from './store.ts';

export interface ArtistMatch {
  slug: string;
  name: string;
  existing: boolean;
  /** Existing artists this might be (same first two words); worth a manual look. */
  near: string[];
}

export const slugify = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Comparison key: slug without a leading "the". */
const key = (name: string) => slugify(name).replace(/^the-/, '');

let index: Map<string, { slug: string; name: string }> | undefined;

function artists() {
  if (!index) {
    index = new Map();
    const dir = join(DATA, 'artists');
    for (const f of existsSync(dir) ? readdirSync(dir) : []) {
      if (!f.endsWith('.json')) continue;
      const slug = f.slice(0, -5);
      const { name } = readJson<{ name: string }>(join(dir, f), { name: slug });
      index.set(key(name), { slug, name });
      index.set(key(slug), { slug, name });
    }
  }
  return index;
}

export function matchArtist(name: string): ArtistMatch {
  const found = artists().get(key(name));
  if (found) return { ...found, existing: true, near: [] };
  const prefix = key(name).split('-').slice(0, 2).join('-');
  const near = prefix.includes('-')
    ? [...new Set([...artists().values()].filter((a) => key(a.name).startsWith(`${prefix}-`) || key(a.name) === prefix).map((a) => a.slug))]
    : [];
  return { slug: slugify(name), name, existing: false, near };
}
