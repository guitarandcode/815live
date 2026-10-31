// Venue tagging for the "Tonight in the 815" captions.
//
// Handles live in data/venues/<slug>.json under `social`
// ({ ig, fb, verified, large }). Only verified handles are ever used.
//
// Priority (for the Instagram 20-mention cap, the Facebook "tag by hand" top 5
// and the order of the image-tag list): category in TAG_ORDER, with the Coming
// Up list last; within that, smaller venues before `large` ones; then the
// order the venue first appears in the caption. A venue's priority is its
// best appearance, and each venue is counted once.

export const TAG_ORDER = ['live-music', 'dj', 'open-mic', 'karaoke', 'trivia', 'bingo', 'comedy', 'other'];
export const IG_CAP = 20;
export const FB_TOP = 5;

export const igHandle = (v) => (v?.social?.verified && v.social.ig ? v.social.ig : null);
export const fbPage = (v) => (v?.social?.verified && v.social.fb ? v.social.fb : null);

// appearances: [{ venue: slug, category, coming?: boolean }] in caption order.
// Returns unique venue slugs, best first.
export function rankVenues(appearances, venues) {
  const best = new Map();
  appearances.forEach((a, i) => {
    const cat = TAG_ORDER.indexOf(a.category);
    const rank = a.coming ? TAG_ORDER.length : cat === -1 ? TAG_ORDER.length - 1 : cat;
    const key = [rank, venues[a.venue]?.social?.large ? 1 : 0, i];
    const prev = best.get(a.venue);
    if (!prev || cmp(key, prev) < 0) best.set(a.venue, key);
  });
  return [...best.entries()].sort((a, b) => cmp(a[1], b[1])).map(([slug]) => slug);
}
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

export function planTags(appearances, venues, { cap = IG_CAP, top = FB_TOP } = {}) {
  const ranked = rankVenues(appearances, venues);
  const withIg = ranked.filter((s) => igHandle(venues[s]));
  const igTagged = new Set(withIg.slice(0, cap));
  return {
    ranked,
    igTagged,
    // Image tags: the handles that didn't fit in the caption first, then the rest.
    imageTags: [...withIg.slice(cap), ...withIg.slice(0, cap)],
    fbTop: ranked.filter((s) => fbPage(venues[s])).slice(0, top),
    // Venues in this caption whose handles need filling in or checking.
    needsWork: ranked.filter((s) => !igHandle(venues[s]) || !fbPage(venues[s])),
  };
}

// One line per venue describing what's missing, for the report.
export function handleStatus(slug, v) {
  const s = v?.social;
  if (!s) return `${v?.name ?? slug} (${slug}): no social entry`;
  const bits = [];
  if (!s.verified) bits.push(`unverified (ig: ${s.ig ? '@' + s.ig : 'none'}, fb: ${s.fb ?? 'none'})`);
  else {
    if (!s.ig) bits.push('no Instagram');
    if (!s.fb) bits.push('no Facebook');
  }
  return bits.length ? `${v.name} (${slug}): ${bits.join(', ')}` : null;
}

// Never put an em-dash in anything we write.
export const noEmDash = (text) => text.replace(/\s*\u2014\s*/g, ', ');
