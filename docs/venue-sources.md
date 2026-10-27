# Venue sources survey

Surveyed 2026-10-24. Every request went through a robots.txt check (including
groups aimed at Anthropic agents, since Claude did the fetching). "Robots OK"
is for the specific events URL. No Facebook pages were fetched.

Approaches: **feed** (structured feed/API we can poll), **HTML** (parse the
venue's own page), **recurring** (weekly rules from the site, entered once),
**manual** (enter by hand from the venue's site), **ask** (needs the venue's
permission or a feed from them).

| Venue | Events URL | Platform | Feed | Robots OK? | Approach |
|---|---|---|---|---|---|
| Mary's Place (Rockford) | marysplacebar.com/calendar/ | WordPress + All-in-One Event Calendar (Timely) | ICS export exists but is **disallowed** (`/*controller=ai1ec_exporter_controller*`); month/stream views disallowed | Current-month page only | **ask** for feed permission; meanwhile manual + recurring (Open Stage, Sun) |
| The Music Box (Rockford) | themusicboxrockford.com | React app + DICE event-list widget; own API (api.themusicboxrockford.com) has no events endpoint (re-checked 2026-10-27) | DICE partner API (`partners-endpoint.dice.fm/api/v2/events`, no robots.txt) needs the widget's partner key, issued to the venue; other DICE hosts block ClaudeBot/anthropic-ai | Venue site yes; **dice.fm and widgets.dice.fm disallow ClaudeBot** | **ask** (venue or DICE for permission to use the feed); manual paste meanwhile |
| Hard Rock Casino Rockford | casino.hardrock.com/rockford/entertainment/upcoming-events | Sitecore; server-rendered cards | None; `/rockford/sitemap.xml` lists every event page | Yes (blocks only /sitecore/, /internal/, PDFs) | **Automated**: `hard-rock-rockford` adapter (sitemap → event pages) |
| Prairie Street Brewing Co. (Rockford) | psbrewingco.com/events/ | WordPress + The Events Calendar Pro | `/wp-json/tribe/events/v1/events` (JSON) and `/events/?ical=1` (returned empty) | Yes | **feed** (Tribe REST). Calendar currently has 0 upcoming events; Dockside Live is a summer series page |
| Screw City Tavern (Rockford) | screwcitytavern.com/events/ | WordPress (agency-built), static page | None | Yes | **recurring** (Mon Name That Tune) + **manual** from venue flyers (karaoke every other Thu; Amp-O-Calypse 10/24); acoustic Fri / band Sat posted on Facebook only |
| Whiskey's Roadhouse (Rockford) | whiskeysroadhouse.com (HTTP; HTTPS cert expired) | WordPress, no calendar | Blog RSS only | Yes (over HTTP) | **recurring** (karaoke Wed & Sun 9 PM — published); first-Friday open mic lacks a time |
| Pig Minds Brewing (Machesney Park) | pigmindsbrewing.com | Behind Cloudflare challenge | Unknown | Couldn't read robots.txt (challenge) | **ask**; not fetched further |
| Urban Forest Craft Brewing (Rockford) | urbanforestcraftbrewing.com | Squarespace one-pager, no events | None | Yes | **manual/ask** (Facebook-only events) |
| Rural On Tap (Rockford) | No website (ruralontap.com is parked) | Facebook-only; monthly calendar image | — | — | **manual** from flyers (Sat karaoke 9 PM published) / **ask**. Address 1710 Rural St, 61107 (directories + Census) |
| Broadway Joe's (fka Dusty Boots) (Rockford) | No website found (Facebook page only) | Facebook-only | — | — | **ask** |
| The Top, Embassy Suites Riverfront (Rockford) | hilton.com dining page; Tock for ticketed events; Toast | Hilton (bot-blocked 403); Tock & Toast behind Cloudflare challenge | None reachable | Blocked by bot protection | **ask** |
| The GOAT Pub and Grill (Rockford) | No website found | — | — | — | **skip** (no evidence of live music) |
| New Mill Tap (Rockford) | No website found | — | — | — | **ask** / verify it still has music |
| Shattered Saloon (Loves Park) | No website found | Facebook; Bandsintown venue page | Bandsintown blocks ClaudeBot | No (Bandsintown) | **manual** from monthly flyers / **ask**. Address 5440 N 2nd St, 61111 (Rock River Current + Census) |
| Tad's on the Rock (Loves Park) | No website found | — | — | — | **manual** from flyers / **ask**. Address 10 E Riverside Blvd, 61111 (directories, WIFR + Census) |
| Benny's at Nest (Machesney Park) | Toast page; Facebook | Toast behind Cloudflare challenge | — | Blocked by bot protection | **ask** |
| G5 Brewing (Beloit, WI) | g5brewing.com | Static HTML; "Events" = private parties | None | Yes (no robots.txt) | **ask** (weekly music posted elsewhere) |
| Cheezhead Brewing (Beloit, WI) | cheezheadbrewing.com/events | Duda; events page has no listings | None | Yes | **ask** |
| Grand Avenue Pub (Beloit, WI) | grandavenuebeloit.com | Website-builder site; says "live music every weekend" but has no calendar | None; shows posted on social media | Yes (no robots.txt) | **manual/ask**. Address (132 W Grand Ave, 53511) confirmed via Travel Wisconsin |
| Rockford Park District | rockfordparkdistrict.org/events | Squarespace + CalendarWiz embed (`crd=rpdfun`) | CalendarWiz `/calendars/` and `/eventboard/` are **disallowed** | Park site yes; calendar no | **ask** for an export; manual for big series |
| Mendelssohn Performing Arts Center (Rockford) | mendelssohnpac.org/concerts/ | WordPress + Event Organiser (not The Events Calendar: Tribe REST 404s) | iCal `/feed/eo-events/` (all events, Chicago TZID, URL, LAST-MODIFIED); cover + ticket link (Arts People) only on event pages | Yes, but **Crawl-delay: 60** | **Automated**: `mendelssohn-pac` (feed daily; an event page only when its LAST-MODIFIED changes, at most 6 per run) |
| RPL Nordlof Center (Rockford) | services.rockfordpubliclibrary.org/events (Communico) | Communico | Public "Add to Calendar" iCal `/feeds?data=<base64 filters>`, location 930; no URLs or types in the feed (event page is `/event/<UID>`); internal JSON `/eeventcaldata` not used | Yes (only /results, /sitesearch disallowed; api.communico.co has none) | **Automated**: `rpl-nordlof`, keyword music filter; hand-entered Crossroads shows win (library times are door times) |
| Inscape Collective (Rockford) | inscapecollective.org/events | Wix Events | None; `/event-pages-sitemap.xml` (lastmod) + schema.org Event JSON-LD on each event page (~850 KB each) | Yes | **Automated**: `inscape-collective` (concerts "X in Concert" and open mics; other music mentions logged) |
| Palace Wine Bar (Rockford, 202 N Main St) | palacewinebar.com/calendar | Squarespace events | `?format=json` and `?format=ical` **disallowed** by robots.txt; list page HTML is allowed and well structured | List page yes | Weekly music: **Fri "Downtown After Dark"** jazz 8:30 PM, **Sat "Local Sounds"** singer-songwriters 7 PM (every week since late July 2026); also comedy and poetry nights. Candidate HTML adapter or recurring rules |
| Mary's Market Cafe & Bakery (Roscoe, 4866 Bluestem Rd) | marysmarket.com/upcoming-events/ | WordPress page (no events plugin) | None; static list of Thursday performers | Yes | **recurring** (Thu 5:30–7:30 PM "Live Music at Mary's") + per-date performers; lineup posted through Dec 3, closed Nov 26 |
| Abreo (Rockford, 515 E State St) | abreorockford.com | — | — | **403 to our bot** (stop) | Wednesday "Dive Bar Live" not confirmed anywhere public; needs a flyer/post from you |

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

- **Rue Marché** (620 Market St, Rockford): venue published; River District page says karaoke Thu–Sat, no times (see needs-review.md). No official site.
- **Kryptonite Bar** (308 W State St): reportedly closed (space re-let in 2023).
- **Olympic Tavern** (2327 N Main St): no official site or calendar found.
- **The Office Niteclub**: reported karaoke; not verified.
- **District** (205 W State St, districtdowntown.com): venue published. Home page lists weekly nights without times; events page + TicketWeb (allowed by robots) had no upcoming shows on 2026-10-24. Check it again for one-off shows.

## Aggregators (for reference; all block Anthropic agents or event paths)

- Bandsintown, Songkick: block ClaudeBot.
- Rock River Current: `/events/`, `/event/` and `?ical=1` disallowed.
- GoRockford: not checked in depth.
