// Music or which kind of other event, from a listing's title (and any text
// with it). Used by adapters and as the rulebook for inbox runs (CLAUDE.md).
// Anything that could be either goes back as a question, never a guess.
import type { Category } from '../../../src/lib/categories.ts';

export type Classified = { category: Category } | { ask: string };

const KINDS: [Exclude<Category, 'live-music' | 'other'>, RegExp][] = [
  ['bingo', /\bbingo\b/i],
  ['trivia', /\b(trivia|name that tune|pub quiz|quiz night)\b/i],
  ['karaoke', /\bkaraoke\b/i],
  ['comedy', /\b(comedy|comedians?|stand-?up|improv)\b/i],
  ['open-mic', /\bopen (mic|mike|stage)\b/i],
  ['dj', /\b(dj|djs|dance party)\b/i],
];
const SPOKEN = /\b(poetry|poets?|spoken word|slam|storytelling)\b/i;
const MUSICAL = /\b(music(ians?)?|songs?|songwriters?|acoustic|guitar|bands?|jam|sing(ers?)?)\b/i;

/**
 * Bingo, trivia, karaoke and comedy win over the music words in their titles
 * ("Music Bingo", "Name That Tune" are games). An open mic is music only when
 * it says so; poetry nights are 'other', comedy open mics are comedy.
 * Returns undefined when nothing matches: the caller's default (a concert
 * listing is live music).
 */
export function classifyEvent(title: string, text = ''): Classified | undefined {
  const hits = KINDS.filter(([, re]) => re.test(title)).map(([k]) => k);
  const openMic = hits.includes('open-mic');
  if (openMic && hits.includes('comedy') && hits.length === 2) return { category: 'comedy' };
  if (hits.length > 1) return { ask: `mixed night (${hits.join(' + ')}): which is it?` };
  if (openMic) {
    const all = `${title}\n${text}`;
    if (SPOKEN.test(all) && MUSICAL.test(all)) return { ask: 'open mic for both music and spoken word' };
    if (SPOKEN.test(all)) return { category: 'other' };
    if (MUSICAL.test(all)) return { category: 'open-mic' };
    return { ask: 'open mic: music, comedy or spoken word?' };
  }
  return hits.length ? { category: hits[0] } : undefined;
}
