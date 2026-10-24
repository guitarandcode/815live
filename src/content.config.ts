// One JSON file per record under /data; the filename (minus .json) is the
// slug/id. Shapes are flat on purpose so each collection maps to a SQL table:
//   venues(slug PK, name, address, city, state, zip, lat, lng, website, description)
//   artists(slug PK, name, hometown, website, bio)
//     + artist_genres(artist_slug, genre) + artist_links(artist_slug, platform, url)
//   shows(id PK, date, start_time, end_time, venue_slug FK, category, title NULL,
//         cover_cents NULL, cover_known BOOL, ticket_url, notes, status,
//         source_type, source_url, source_uid UNIQUE NULL)
//     + show_artists(show_id, artist_slug, position)  -- position = array order
//   recurring(slug PK, venue_slug FK, category, title, weekday, start_time,
//             end_time, months, host, cover_cents NULL, cover_known BOOL, notes)
//     + recurring_skips(recurring_slug, date)
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './lib/categories.ts';

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
    hometown: z.string().optional(),
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
    bio: z.string().optional(),
    auto: z.boolean().optional().describe('Created by ingestion from a listing title; worth a manual look'),
    placeholder,
  }),
});

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM, 24-hour, Chicago time');

const category = z.enum(CATEGORIES).default('live-music');

// null = free; omitted = unknown. Dollars here, cents in SQL later.
const cover = z.number().nonnegative().nullable().optional();

const source = z.object({
  type: z.enum(['facebook', 'venue-site', 'submission', 'manual']),
  url: z.url().optional(),
  uid: z.string().optional().describe('Set by ingestion: "<adapter>:<page>:<detail>"; marks the file as adapter-owned'),
});

const shows = defineCollection({
  loader: glob({ pattern: '*.json', base: './data/shows' }),
  schema: z
    .object({
      date: z.iso.date().describe('Chicago calendar date, YYYY-MM-DD'),
      startTime: time,
      endTime: time.optional(),
      venue: reference('venues'),
      category,
      title: z.string().optional().describe('Event name; required when there are no artists'),
      artists: z.array(reference('artists')).default([]).describe('Ordered bill, headliner first'),
      cover,
      ticketUrl: z.url().optional(),
      notes: z.string().optional(),
      status: z.enum(['scheduled', 'cancelled', 'postponed']).default('scheduled'),
      source,
      placeholder,
    })
    .refine((s) => s.artists.length > 0 || s.title, {
      message: 'A show needs at least one artist or a title',
      path: ['artists'],
    }),
});

// Weekly events, expanded at build time into dated listings (src/lib/shows.ts).
const recurring = defineCollection({
  loader: glob({ pattern: '*.json', base: './data/recurring' }),
  schema: z.object({
    venue: reference('venues'),
    category,
    title: z.string(),
    weekday: z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
    startTime: time,
    endTime: time.optional(),
    months: z.array(z.number().int().min(1).max(12)).optional().describe('Active months; omit for year-round'),
    host: z.string().optional(),
    cover,
    notes: z.string().optional(),
    skip: z.array(z.iso.date()).default([]).describe('Dates with no event, e.g. holidays'),
    source,
  }),
});

export const collections = { venues, artists, shows, recurring };
