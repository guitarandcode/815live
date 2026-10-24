# 815live.com

Live music listings for the Rockford, IL area (the 815: Rockford, Loves Park,
Belvidere, …). Static Astro site, deployed to Cloudflare Pages.

## Local development

Requires Node 22.23+ (the repo pins 24 in `.node-version`; `fnm` picks it up).

```sh
npm install
npm run dev          # http://localhost:4321
npm test             # unit tests (date/timezone logic)
npm run build        # astro check + build to dist/ + JSON-LD validation
npm run preview      # serve dist/ locally
npm run test:build   # end-to-end: builds as if on Cloudflare (TZ=UTC) at pinned times
```

## Data

All listings are JSON files in `data/`, one record per file. **The filename is
the slug/ID and becomes the URL.** The schemas live in `src/content.config.ts`;
`npm run build` fails with a clear message if a file doesn't match, or if a show
references a venue or artist that doesn't exist.

Any record can set `"placeholder": true` for test data: it renders with a
"Sample" badge, gets `noindex`, and is left out of `sitemap.xml`.

### Add a venue: `data/venues/<slug>.json`

```json
{
  "name": "Mary's Place",
  "address": "602 N Madison St",
  "city": "Rockford",
  "state": "IL",
  "zip": "61107",
  "lat": 42.27361,
  "lng": -89.08602,
  "website": "https://example.com",
  "description": "One or two sentences."
}
```

`website` is optional. Get lat/lng from OpenStreetMap or Google Maps (right-click → coordinates).

### Add an artist: `data/artists/<slug>.json`

```json
{
  "name": "Band Name",
  "genres": ["indie rock"],
  "hometown": "Rockford, IL",
  "website": "https://example.com",
  "socials": { "facebook": "https://facebook.com/…", "instagram": "https://instagram.com/…" },
  "bio": "Short bio."
}
```

Only `name` is required; `genres`, `hometown`, `website`, `bio` and every `socials` key are optional. Allowed socials keys:
`facebook`, `instagram`, `bandcamp`, `spotify`, `youtube`, `tiktok`.

### Add a show: `data/shows/<YYYY-MM-DD>-<venue-slug>.json`

```json
{
  "date": "2026-11-14",
  "startTime": "21:00",
  "endTime": "00:30",
  "venue": "marys-place",
  "category": "live-music",
  "title": "Halloween Hijinks",
  "artists": ["headliner-slug", "opener-slug"],
  "cover": 10,
  "ticketUrl": "https://…",
  "notes": "21+",
  "status": "scheduled",
  "source": { "type": "facebook", "url": "https://facebook.com/events/…" }
}
```

- `date`/`startTime`/`endTime` are **Chicago local time**, 24-hour. An `endTime`
  earlier than `startTime` means after midnight.
- `category`: `live-music` (default), `karaoke`, `comedy` or `open-mic`. It sets
  the card label and the JSON-LD type (MusicEvent / ComedyEvent / Event).
- `artists` is the bill in order, headliner first. `title` is the event's own
  name. A show needs at least one of them; with both, the title is the heading
  and the bill shows underneath.
- `cover`: a number (dollars) = priced, `null` = **free**, leave it out = **unknown**.
- `status`: `scheduled` (default), `cancelled` or `postponed`. Cancelled shows
  stay listed, struck through.
- `source.type`: `facebook`, `venue-site`, `submission` or `manual`.
- Optional: `endTime`, `category`, `title`/`artists` (one required), `cover`,
  `ticketUrl`, `notes`, `status`, `source.url`.
- Manually entered listings use `source.type: "manual"` with `source.url`
  pointing at the venue's calendar page. Record facts only; don't copy the
  venue's description text.
- Two shows at one venue on one day: add a suffix, e.g. `2026-11-14-marys-place-late.json`.

### Add a weekly event: `data/recurring/<venue-slug>-<name>.json`

```json
{
  "venue": "marys-place",
  "category": "open-mic",
  "title": "Open Stage",
  "weekday": "sunday",
  "startTime": "19:00",
  "endTime": "23:00",
  "months": [5, 6, 7, 8, 9],
  "host": "Host name",
  "cover": null,
  "skip": ["2026-12-27"],
  "source": { "type": "manual", "url": "http://marysplacebar.com/calendar/" }
}
```

Each build expands these into dated listings for the next 8 weeks, with IDs
like `2026-10-25-marys-place-open-stage`; all 8 weeks get pages, iCal entries
and JSON-LD. The home and category pages list a weekly event's dates only
within the next 7 days, and show each rule once in an "Every week" section. `months` (season), `skip` (dates off),
`endTime`, `host`, `cover` and `notes` are optional. A one-off show at the same
venue on the same date, starting within 2 hours of the weekly slot, replaces it.

## How "upcoming" works

The site is static, so the list of upcoming shows is fixed when it's built:

- At build time, shows dated before **today in America/Chicago** are dropped.
  Cloudflare builds run in UTC; everything here uses Chicago dates
  (`src/lib/time.ts`), so a 6pm build still lists tonight's shows.
- A small inline script hides days that have passed since the build, also
  using Chicago's date, not the visitor's timezone.
- Category pages (`/live-music`, `/karaoke`, `/open-mic`, `/comedy`) always
  exist; a category's filter link on the home page is hidden while it has no
  listings, and its empty page is noindexed and left out of the sitemap.
- `/this-weekend` is the current Fri–Sun on Friday–Sunday, otherwise the next one.

**Daily rebuild.** `.github/workflows/daily-rebuild.yml` runs at 08:17 UTC
(3:17am CDT / 2:17am CST) and POSTs to a Cloudflare Pages deploy hook, so the
listings roll over each day. One-time setup:

1. Pages project → Settings → Builds → Deploy hooks → add a hook for `main`.
2. GitHub repo → Settings → Secrets and variables → Actions → new secret
   `CF_PAGES_DEPLOY_HOOK` with the hook URL.

Run it manually from the Actions tab (Daily rebuild → Run workflow). Without
the secret the job fails with a clear error. Note GitHub pauses scheduled
workflows after 60 days with no repo activity.

`BUILD_NOW=<ISO instant>` overrides the build's clock for testing, e.g.
`BUILD_NOW=2026-10-24T23:00:00Z npm run build`.

## SEO and feeds

- Show pages: `MusicEvent` JSON-LD (Place + PostalAddress, MusicGroup
  performers, Offer when priced, `isAccessibleForFree` when free).
- Venue pages: `MusicVenue`. Artist pages: `MusicGroup`. Home: `WebSite`.
- Unique title/description, canonical URL and Open Graph tags on every page.
- `/sitemap.xml`, `/robots.txt`, `/calendar.ics` (upcoming shows), `/rss.xml`.
- `scripts/check-jsonld.mjs` runs after every build and fails it if any page's
  JSON-LD is malformed or a show is missing required Event fields.

## Deploy (Cloudflare Pages)

The output is plain static files in `dist/`; no adapter is needed.

**Option A: Git-connected (recommended).** Push to GitHub, then in the
Cloudflare dashboard: Workers & Pages → Create → Pages → Connect to Git.

- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION=24`

Every push to `main` deploys; other branches get preview URLs.

**Option B: direct upload with wrangler.**

```sh
npx wrangler login
npm run build
npx wrangler pages project create 815live --production-branch main   # first time only
npx wrangler pages deploy dist
```

Then add `815live.com` under the project's Custom domains.

`public/_headers` sets content types and caching for the feeds and hashed assets.

## Moving to a database later

The collections are flat on purpose. The table mapping is at the top of
`src/content.config.ts` (`shows` plus a `show_artists` join table with an
ordered `position`). Pages read data only through `src/lib/data.ts`, so
swapping JSON for SQLite/Postgres or a live loader means changing that one module.
