# Session report: unattended fill-out, 2026-10-24

## Added this session

| | Added | Site total |
|---|---|---|
| Venues | 2 (Hard Rock Casino Rockford, Whiskey's Roadhouse) | 6 |
| Artists | 21 (Hard Rock lounge acts) | 27 |
| One-off shows | 24 (Hard Rock, Oct 24 – Nov 28) | 26 |
| Weekly rules | 3 (Screw City Name That Tune; Whiskey's karaoke Wed + Sun) | 5 |

Weekly rules expand to 8 weeks of dated pages each, so the site now builds
~110 pages and ~66 event pages with JSON-LD.

Also done (item 1, finished before this session's survey started and deployed):
7-day window for weekly events on home/category pages, "Every week"
section, category pages with filter links, Screw City Tavern + Thursday
karaoke, Open Stage ending at 11 PM. New this session: a `trivia` category
("Music trivia", `/trivia`).

## Corrections made along the way

- **Robots rules aimed at Claude now apply.** Midway through, I started honoring
  robots.txt groups for ClaudeBot / Claude-User / anthropic-ai in addition to
  `*`, since Claude was doing the fetching. dice.fm blocks ClaudeBot, so the
  20 Music Box shows taken from DICE's venue page (already pushed) were
  **reverted** and moved to needs-review.
- **Geocoding.** Coordinates from earlier sessions and this one came from
  OpenStreetMap Nominatim `/search`, which its robots.txt disallows. All venue
  coordinates were re-derived from the US Census geocoder (allowed). Hard
  Rock's pin is approximate (Census matched 7800 E State St, same block).
- **Redirects.** The fetch helper originally re-checked robots.txt only on
  cross-host redirects, then only after following them. It now checks every
  hop before following. An audit of all earlier redirects found none that
  landed on a disallowed URL.

## In needs-review.md

1. **The Music Box**: ~20 shows Oct 27 – Dec 12 (DICE-sourced; DICE blocks
   ClaudeBot). Paste from the venue site to publish.
2. **Screw City Tavern**: Acoustic Fridays (Oct–May) and Saturday bands; no
   times or performers on the venue site.
3. **Whiskey's Roadhouse**: first-Friday open mic; no start time, and weekly
   rules can't express "first Friday".

## Venues that look automatable

- **Hard Rock Casino Rockford**: sitemap → event pages; consistent HTML
  (weekday, date, time, stage). Robots-allowed. Best candidate for the first
  ingestion adapter.
- **Prairie Street Brewing**: The Events Calendar REST API; allowed and
  structured, but empty right now (seasonal). Cheap adapter.
- **Mary's Place**: structured ICS exists but is robots-disallowed. Worth
  asking for permission.
- **The Music Box**: structured via DICE, but needs DICE/venue permission.

Everything else is Facebook-only, behind bot protection, or has no website
(see venue-sources.md).

## Not done / gaps

- **Band calendars**: no new shows. The band sites found (The Lone Canary,
  Miles Nielsen, Erik Koskinen) load their dates from Bandsintown or other
  widgets; Bandsintown and Songkick block Anthropic agents. Sunset Strip and
  Rebel Hearts have no official site I could find.
- **Artist profiles** have genre/hometown/one-line bio only where a venue page
  stated the facts; no socials or websites were added.
- **Mary's Place November** is only visible via robots-disallowed calendar
  views.

## Suggested next steps

1. Paste the Music Box schedule (or ask the venue whether we can read DICE).
2. Email Mary's Place asking to use their calendar feed.
3. Build the Hard Rock adapter first (sitemap-driven HTML); Prairie Street's
   Tribe REST adapter second.
4. Add an `nth` (e.g. first Friday) option to weekly rules for monthly nights.
5. Give me Facebook-free links for Sunset Strip, Rebel Hearts and any other
   bands you want tracked; a band-owned page listing dates in plain HTML is
   enough.
6. Connect the 815live.com custom domain in Cloudflare Pages (it currently has
   no DNS records; the site is live at 815live.pages.dev).
