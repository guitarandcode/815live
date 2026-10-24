export const CATEGORIES = ['live-music', 'karaoke', 'open-mic', 'trivia', 'comedy'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  'live-music': 'Live music',
  karaoke: 'Karaoke',
  comedy: 'Comedy',
  'open-mic': 'Open mic',
  trivia: 'Music trivia',
};

/** schema.org type per category. */
export const CATEGORY_SCHEMA: Record<Category, 'MusicEvent' | 'ComedyEvent' | 'Event'> = {
  'live-music': 'MusicEvent',
  karaoke: 'Event',
  comedy: 'ComedyEvent',
  'open-mic': 'Event',
  trivia: 'Event',
};

/** Category page copy, keyed by URL slug (/live-music, /karaoke, …). */
export const CATEGORY_PAGE: Record<Category, { heading: string; title: string; description: string }> = {
  'live-music': {
    heading: 'Live music',
    title: 'Live music in Rockford, IL',
    description: 'Upcoming live music in Rockford, Loves Park and Belvidere: local bands at bars, breweries and small venues.',
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
    heading: 'Music trivia',
    title: 'Music trivia nights in Rockford, IL',
    description: 'Music trivia and name-that-tune nights at bars in Rockford, Loves Park and Belvidere.',
  },
  comedy: {
    heading: 'Comedy',
    title: 'Comedy shows in Rockford, IL',
    description: 'Upcoming stand-up and comedy shows at bars and small venues in Rockford, Loves Park and Belvidere.',
  },
};
