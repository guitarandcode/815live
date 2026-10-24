// One JSON file per record under /data; the filename (minus .json) is the
// slug/id. Shapes are flat on purpose so each collection maps to a SQL table:
//   venues(slug PK, name, address, city, state, zip, lat, lng, website, description)
//   artists(slug PK, name, hometown, website, bio)
//     + artist_genres(artist_slug, genre) + artist_links(artist_slug, platform, url)
//   shows(id PK, date, start_time, end_time, venue_slug FK, cover_cents NULL,
//         cover_known BOOL, ticket_url, notes, status, source_type, source_url)
//     + show_artists(show_id, artist_slug, position)  -- position = array order
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const placeholder = z.boolean().default(false).describe('Sample data: rendered with a badge and noindex');

const venues = defineCollection({
  loader: glob({ pattern: '*.json', base: './data/venues' }),
  schema: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string().length(2).default('IL'),
    zip: z.string().regex(/^\d{5}$/),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    website: z.url().optional(),
    description: z.string(),
    placeholder,
  }),
});

const artists = defineCollection({
  loader: glob({ pattern: '*.json', base: './data/artists' }),
  schema: z.object({
    name: z.string(),
    genres: z.array(z.string()).default([]),
    hometown: z.string(),
    website: z.url().optional(),
    socials: z
      .object({
        facebook: z.url(),
        instagram: z.url(),
        bandcamp: z.url(),
        spotify: z.url(),
        youtube: z.url(),
        tiktok: z.url(),
      })
      .partial()
      .default({}),
    bio: z.string(),
    placeholder,
  }),
});

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM, 24-hour, Chicago time');

const shows = defineCollection({
  loader: glob({ pattern: '*.json', base: './data/shows' }),
  schema: z.object({
    date: z.iso.date().describe('Chicago calendar date, YYYY-MM-DD'),
    startTime: time,
    endTime: time.optional(),
    venue: reference('venues'),
    artists: z.array(reference('artists')).min(1).describe('Ordered bill, headliner first'),
    // null = free; omitted = unknown. Dollars here, cents in SQL later.
    cover: z.number().nonnegative().nullable().optional(),
    ticketUrl: z.url().optional(),
    notes: z.string().optional(),
    status: z.enum(['scheduled', 'cancelled', 'postponed']).default('scheduled'),
    source: z.object({
      type: z.enum(['facebook', 'venue-site', 'submission', 'manual']),
      url: z.url().optional(),
    }),
    placeholder,
  }),
});

export const collections = { venues, artists, shows };
