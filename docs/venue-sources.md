# Venue sources survey

Surveyed 2026-10-24. Grand Avenue Pub address (132 W Grand Ave, Beloit WI 53511)
confirmed via Travel Wisconsin and the Sunset Strip band site; coordinates from
the Census geocoder.

Originally surveyed 2026-10-24. Every request went through a robots.txt check (including
groups aimed at Anthropic agents, since Claude did the fetching). "Robots OK"
is for the specific events URL. No Facebook pages were fetched.

Approaches: **feed** (structured feed/API we can poll), **HTML** (parse the
venue's own page), **recurring** (weekly rules from the site, entered once),
**manual** (enter by hand from the venue's site), **ask** (needs the venue's
permission or a feed from them).

| Venue | Events URL | Platform | Feed | Robots OK? | Approach |
|---|---|---|---|---|---|
| Mary's Place (Rockford) | marysplacebar.com/calendar/ | WordPress + All-in-One Event Calendar (Timely) | ICS export exists but is **disallowed** (`/*controller=ai1ec_exporter_controller*`); month/stream views disallowed | Current-month page only | **ask** for feed permission; meanwhile manual + recurring (Open Stage, Sun) |
| The Music Box (Rockford) | themusicboxrockford.com | React app + DICE event-list widget | DICE partner API (`partners-endpoint.dice.fm/api/v2/events`, promoter "Music Box of Rockford LLC") with the venue's widget key; DICE venue page has schema.org JSON-LD | Venue site yes; **dice.fm disallows ClaudeBot** and `/api/` | **ask** (venue or DICE for partner access); manual paste meanwhile |
| Hard Rock Casino Rockford | casino.hardrock.com/rockford/entertainment/upcoming-events | Sitecore; server-rendered cards | None; `/rockford/sitemap.xml` lists every event page | Yes (blocks only /sitecore/, /internal/, PDFs) | **HTML**: sitemap → event pages (weekday + date, stage, time). Automatable |
| Prairie Street Brewing Co. (Rockford) | psbrewingco.com/events/ | WordPress + The Events Calendar Pro | `/wp-json/tribe/events/v1/events` (JSON) and `/events/?ical=1` (returned empty) | Yes | **feed** (Tribe REST). Calendar currently has 0 upcoming events; Dockside Live is a summer series page |
| Screw City Tavern (Rockford) | screwcitytavern.com/events/ | WordPress (agency-built), static page | None | Yes | **recurring** (Thu karaoke, Mon Name That Tune — published); acoustic Fri / band Sat posted on Facebook only |
| Whiskey's Roadhouse (Rockford) | whiskeysroadhouse.com (HTTP; HTTPS cert expired) | WordPress, no calendar | Blog RSS only | Yes (over HTTP) | **recurring** (karaoke Wed & Sun 9 PM — published); first-Friday open mic lacks a time |
| Pig Minds Brewing (Machesney Park) | pigmindsbrewing.com | Behind Cloudflare challenge | Unknown | Couldn't read robots.txt (challenge) | **ask**; not fetched further |
| Urban Forest Craft Brewing (Rockford) | urbanforestcraftbrewing.com | Squarespace one-pager, no events | None | Yes | **manual/ask** (Facebook-only events) |
| Rural on Tap (Rockford) | No website found | Facebook-only | — | — | **ask** |
| Broadway Joe's (fka Dusty Boots) (Rockford) | No website found (Facebook page only) | Facebook-only | — | — | **ask** |
| The Top, Embassy Suites Riverfront (Rockford) | hilton.com dining page; Tock for ticketed events; Toast | Hilton (bot-blocked 403); Tock & Toast behind Cloudflare challenge | None reachable | Blocked by bot protection | **ask** |
| The GOAT Pub and Grill (Rockford) | No website found | — | — | — | **skip** (no evidence of live music) |
| New Mill Tap (Rockford) | No website found | — | — | — | **ask** / verify it still has music |
| Shattered Saloon (Loves Park) | No website found | Facebook; Bandsintown venue page | Bandsintown blocks ClaudeBot | No (Bandsintown) | **ask** |
| Tad's on the Rock (Loves Park) | No website found | — | — | — | **ask** |
| Benny's at Nest (Machesney Park) | Toast page; Facebook | Toast behind Cloudflare challenge | — | Blocked by bot protection | **ask** |
| G5 Brewing (Beloit, WI) | g5brewing.com | Static HTML; "Events" = private parties | None | Yes (no robots.txt) | **ask** (weekly music posted elsewhere) |
| Cheezhead Brewing (Beloit, WI) | cheezheadbrewing.com/events | Duda; events page has no listings | None | Yes | **ask** |
| Grand Avenue Pub (Beloit, WI) | grandavenuebeloit.com | Website-builder site; says "live music every weekend" but has no calendar | None; shows posted on social media | Yes (no robots.txt) | **manual/ask** |
| Rockford Park District | rockfordparkdistrict.org/events | Squarespace + CalendarWiz embed (`crd=rpdfun`) | CalendarWiz `/calendars/` and `/eventboard/` are **disallowed** | Park site yes; calendar no | **ask** for an export; manual for big series |

## Bands

| Band | Site | Calendar source | Usable? |
|---|---|---|---|
| Sunset Strip | No official site found | Hard Rock had a (past) event page | No current dates found |
| Rebel Hearts | Not found (search hits are other bands) | — | Needs a link from you |
| The Lone Canary | thelonecanary.com (Wix) | Bandsintown widget | No: widget data comes from Bandsintown (blocks Anthropic agents; API needs the band's app id) |
| Miles Nielsen & The Rusted Hearts | milesnielsen.com (Wix) | Bandsintown widget | No (same) |
| Erik Koskinen | erikkoskinen.com (Squarespace) | Tour page is a widget, no dates in HTML | No |
| Hard Rock lounge acts (21) | Mostly no sites found | Hard Rock pages | Yes, via Hard Rock |

## Other venues found

- **Rue Marché** (620 Market St, Rockford): reported karaoke nights; no official site found.
- **Kryptonite Bar** (308 W State St): reportedly closed (space re-let in 2023).
- **Olympic Tavern** (2327 N Main St): no official site or calendar found.
- **The Office Niteclub**: reported karaoke; not verified.

## Aggregators (for reference; all block Anthropic agents or event paths)

- Bandsintown, Songkick: block ClaudeBot.
- Rock River Current: `/events/`, `/event/` and `?ical=1` disallowed.
- GoRockford: not checked in depth.
