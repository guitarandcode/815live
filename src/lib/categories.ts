export const CATEGORIES = ['live-music', 'karaoke', 'comedy', 'open-mic'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  'live-music': 'Live music',
  karaoke: 'Karaoke',
  comedy: 'Comedy',
  'open-mic': 'Open mic',
};

/** schema.org type per category. */
export const CATEGORY_SCHEMA: Record<Category, 'MusicEvent' | 'ComedyEvent' | 'Event'> = {
  'live-music': 'MusicEvent',
  karaoke: 'Event',
  comedy: 'ComedyEvent',
  'open-mic': 'Event',
};
