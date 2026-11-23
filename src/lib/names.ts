// Show titles that repeat the act's name. A show can carry both a title and
// artists, and sometimes the title is just the artist with extra words
// ("Mana Kintorso (Black Wednesday)"). Anything that prints the title next
// to the artist names uses these so the name appears once (2026-11-23).
//
// Names are compared ignoring case, accents and punctuation, whole words only
// ("Ash" doesn't match "Clash"), and "AC/DC" equals "ACDC".

/** Lower-case words: accents dropped, "&" as "and", punctuation as spaces. */
export const normName = (s: string): string =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const within = (hay: string, needle: string) => ` ${hay} `.includes(` ${needle} `);

/** True when the names match or one contains the other (see above). */
export function namesOverlap(a: string, b: string): boolean {
  const x = normName(a);
  const y = normName(b);
  if (!x || !y) return false;
  return x.replace(/ /g, '') === y.replace(/ /g, '') || within(x, y) || within(y, x);
}

/** The artist names the title doesn't already show. */
export const namesNotInTitle = (title: string | undefined, names: string[]): string[] =>
  title ? names.filter((n) => !namesOverlap(title, n)) : names;

// Connectors left dangling once the name is taken out: "with the", "'s", "(".
const LEAD = /^(?:\s|[-–—:|/,+&([{]|['’]s\b|\bat\b|@)+/i; // after the name: "(Black Wednesday)", "'s Halloween Show"
const TRAIL = /(?:\s|[-–—:|/,+&([{]|\b(?:with|w\/|featuring|feat\.?|ft\.?|presents|starring)(?:\s+the)?\b)+$/i; // before it

/**
 * What a title adds beside the artist names: the title itself when it doesn't
 * name them, otherwise what's left once the names are taken out, minus the
 * words that only joined them ("Mana Kintorso (Black Wednesday)" and "Black
 * Wednesday: Mana Kintorso" give "Black Wednesday", "NYE Bash with Land of
 * Linkin" gives "NYE Bash"). Undefined when nothing is left, or when a name
 * sits in the middle of a phrase ("Rock with Mana Kintorso and Friends").
 */
export function titleBesideNames(title: string | undefined, names: string[]): string | undefined {
  let rest = title?.trim();
  const hasText = (s: string) => /[a-z0-9]/i.test(s);
  for (const name of names) {
    if (!rest) return undefined;
    if (!namesOverlap(rest, name)) continue;
    // The name's words with any punctuation (or none) between them; "and" may be "&".
    const words = normName(name).split(' ').map((w) => (w === 'and' ? '(?:and|&)' : w));
    const m = new RegExp(`(?<![a-z0-9])${words.join('[^a-z0-9]*')}(?![a-z0-9])`, 'i').exec(rest);
    if (!m) return undefined; // the title is part of the name, or accents differ
    const before = rest.slice(0, m.index);
    const after = rest.slice(m.index + m[0].length);
    if (hasText(before) && hasText(after)) return undefined;
    if (hasText(after)) {
      // A bracket opened right after the name closes at the end: "Name (Event)".
      const opened = /^\s*[([{]/.test(after);
      rest = after.replace(LEAD, '');
      if (opened) rest = rest.replace(/[)\]}]\s*$/, '');
    } else {
      rest = before.replace(TRAIL, '');
    }
    rest = rest.trim();
  }
  return rest && hasText(rest) ? rest : undefined;
}
