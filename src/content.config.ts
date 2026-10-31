// One JSON file per record under /data; the filename (minus .json) is the
// slug/id. Shapes are flat on purpose so each collection maps to a SQL table:
//   venues(slug PK, name, address, city, state, zip, lat, lng, website, description)
//     + venue_aliases(venue_slug, name)
//     + venue_social(venue_slug, ig, fb, verified BOOL, large BOOL)
//   artists(slug PK, name, hometown, website, bio)
//     + artist_genres(artist_slug, genre) + artist_links(artist_slug, platform, url)
//   shows(id PK, date, start_time, end_time, venue_slug FK, category, title NULL,
//         cover_cents NULL, cover_known BOOL, ticket_url, notes, status,
//         lineup_partial BOOL, checked DATE,
//         source_type, source_url, source_kind, source_uid UNIQUE NULL)
//     + show_artists(show_id, artist_slug, position)  -- position = array order
//     + show_sources(show_id, url, kind)              -- source.also
//   recurring(slug PK, venue_slug FK, category, title, weekday, start_time,
//             end_time, months, host, cover_cents NULL, cover_known BOOL, notes,
//             checked DATE, source_type, source_url, source_kind)
//     + recurring_skips(recurring_slug, date)
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './lib/categories.ts';
import { DATA_DIR } from './lib/paths.ts';
import { SOURCE_KINDS } from './lib/sources.ts';

const placeholder = z.boolean().default(false).describe('Sample data: rendered with a badge and noindex');

const venues = defineCollection({
  loader: glob({ pattern: '*.json', base: `${DATA_DIR}/venues` }),
  schema: z.object({
    name: z.string(),
    // Other names the venue goes by (old names still on flyers); match inbox files against these too.
    aliases: z.array(z.string()).default([]),
    address: z.string(),
    city: z.string(),
    state: z.string().length(2).default('IL'),
    zip: z.string().regex(/^\d{5}$/),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    website: z.url().optional(),
    description: z.string(),
    // Used by the social caption (scripts/social/venue-tags.mjs) to tag venues.
    // Handles are only used when verified; large rooms are tagged last.
    social: z
      .object({
        ig: z.string().regex(/^[A-Za-z0-9._]{1,30}$/).optional().describe('Instagram username, no @'),
        fb: z.string().optional().describe('Facebook Page URL or name'),
        verified: z.boolean().default(false).describe('Account clearly matches the venue (name, city, address)'),
        large: z.boolean().optional().describe('Big room (casino, theater): tagged after smaller venues'),
      })
      .optional(),
    placeholder,
  }),
});

const artists = defineCollection({
  loader: glob({ pattern: '*.json', base: `${DATA_DIR}/artists` }),
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

const sourceKind = z.enum(SOURCE_KINDS);

const source = z.object({
  type: z.enum(['facebook', 'venue-site', 'submission', 'manual']).describe('How the listing got here'),
  url: z.url().optional().describe('Omitted for flyers and emails with no public page'),
  kind: sourceKind.optional().describe('Required with url'),
  also: z
    .array(z.object({ url: z.url(), kind: sourceKind }))
    .default([])
    .describe('Other places the same event is posted'),
  uid: z.string().optional().describe('Set by ingestion: "<adapter>:<page>:<detail>"; marks the file as adapter-owned'),
}).refine((s) => !s.url || s.kind, { message: 'source.kind is required when source.url is set', path: ['kind'] });

const checked = z.iso.date().describe('Chicago date the listing was last checked against its source');

const shows = defineCollection({
  loader: glob({ pattern: '*.json', base: `${DATA_DIR}/shows` }),
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
      lineupPartial: z.boolean().default(false).describe('More acts to be announced'),
      checked,
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
  loader: glob({ pattern: '*.json', base: `${DATA_DIR}/recurring` }),
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
    checked,
    source,
  }),
});

export const collections = { venues, artists, shows, recurring };
