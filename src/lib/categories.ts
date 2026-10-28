// Music is the site; other events are a side door. A listing's category alone
// decides which side it's on, so the two can never disagree.
export const MUSIC_CATEGORIES = ['live-music', 'dj', 'open-mic'] as const;
/** Listed under "Also happening", after the music. 'other' is the catch-all (e.g. a poetry open mic). */
export const OTHER_CATEGORIES = ['trivia', 'bingo', 'karaoke', 'comedy', 'other'] as const;
export const CATEGORIES = [...MUSIC_CATEGORIES, ...OTHER_CATEGORIES] as const;
export type Category = (typeof CATEGORIES)[number];
export type OtherCategory = (typeof OTHER_CATEGORIES)[number];

export const isMusic = (c: Category) => (MUSIC_CATEGORIES as readonly string[]).includes(c);

/** Categories with their own page (/live-music, /trivia, …); 'other' is only on /other-events. */
export const PAGE_CATEGORIES = CATEGORIES.filter((c): c is Exclude<Category, 'other'> => c !== 'other');

export const CATEGORY_LABEL: Record<Category, string> = {
  'live-music': 'Live music',
  dj: 'DJ',
  'open-mic': 'Open mic',
  trivia: 'Trivia',
  bingo: 'Bingo',
  karaoke: 'Karaoke',
  comedy: 'Comedy',
  other: 'Event',
};

/** schema.org type per category: music is a MusicEvent, games and karaoke are social nights. */
export const CATEGORY_SCHEMA: Record<Category, 'MusicEvent' | 'ComedyEvent' | 'SocialEvent' | 'Event'> = {
  'live-music': 'MusicEvent',
  dj: 'MusicEvent',
  'open-mic': 'MusicEvent',
  trivia: 'SocialEvent',
  bingo: 'SocialEvent',
  karaoke: 'SocialEvent',
  comedy: 'ComedyEvent',
  other: 'Event',
};

/** Category page copy, keyed by URL slug (/live-music, /karaoke, …). */
export const CATEGORY_PAGE: Record<Exclude<Category, 'other'>, { heading: string; title: string; description: string }> = {
  'live-music': {
    heading: 'Live music',
    title: 'Live music in Rockford, IL',
    description: 'Upcoming live music in Rockford, Loves Park and Belvidere: local bands at bars, breweries and small venues.',
  },
  dj: {
    heading: 'DJ nights',
    title: 'DJ nights in Rockford, IL',
    description: 'DJ nights and dance parties at bars and clubs in Rockford, Loves Park and Belvidere.',
  },
  karaoke: {
    heading: 'Karaoke',
    title: 'Karaoke nights in Rockford, IL',
    description: 'Where to sing karaoke in Rockford, Loves Park and Belvidere: weekly karaoke nights and upcoming dates.',
  },
  'open-mic': {
    heading: 'Open mic',
    title: 'Open mic nights in Rockford, IL',
    description: 'Open mic and open stage nights in Rockford, Loves Park and Belvidere for musicians and performers.',
  },
  trivia: {
    heading: 'Trivia nights',
    title: 'Trivia nights in Rockford, IL',
    description: 'Trivia nights in Rockford, Loves Park and Belvidere: weekly bar trivia and name-that-tune games, tonight and this week.',
  },
  bingo: {
    heading: 'Bingo',
    title: 'Bingo in Rockford, IL: tonight and this week',
    description: 'Where to play bingo in Rockford, Loves Park and Belvidere tonight and this week: music bingo and bingo nights at bars.',
  },
  comedy: {
    heading: 'Comedy',
    title: 'Comedy shows in Rockford, IL',
    description: 'Upcoming stand-up and comedy shows at bars and small venues in Rockford, Loves Park and Belvidere.',
  },
};
