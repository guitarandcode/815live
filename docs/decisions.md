# Decisions log

Calls made while filling out listings unattended (session of 2026-10-24).

- **Robots rules aimed at Claude apply.** The fetching is done by Claude, so
  robots.txt groups for `ClaudeBot`, `Claude-User`, `Claude-SearchBot`,
  `Claude-Web` or `anthropic-ai` are honored as well as `*`; a disallow there
  wins. This rules out dice.fm, Bandsintown, Songkick and Rock River Current
  (all block Anthropic agents). It was adopted mid-session, after the DICE
  venue page had already been read and 20 Music Box shows pushed; that commit
  was reverted (see needs-review.md).
- **Geocoding source.** Earlier coordinates came from OpenStreetMap Nominatim's
  `/search`, which its robots.txt disallows. All venue coordinates were
  re-derived from the US Census geocoder (no robots.txt). Hard Rock didn't
  match; its pin uses Census's 7800 E State St (same block, approximate).
- **Robots-checked fetching.** Every request went through a helper that reads
  robots.txt first (Google-style matching: wildcards, `$`, longest rule wins)
  and refuses disallowed URLs. User-Agent: `815liveBot/1.0 (+https://815live.com/about)`.
- **Bot challenges are a stop sign.** Sites behind a Cloudflare "Just a moment"
  challenge (e.g. Pig Minds) were not fetched any further; no workarounds.
- **Hard Rock Casino Rockford: what counts as "local acts".** Published every
  act on the lounge stages (Hard Rock Cafe stage, Council Oak).
  Touring Hard Rock Live concerts weren't in the casino's upcoming-events list
  and aren't included.
- **Hard Rock year inference.** Pages give weekday + month/day without a year.
  All dates are within ~5 weeks and every stated weekday matches 2026, so
  the year is unambiguous.
- **Hard Rock double slots.** Emily Wendy, Kayla Seeber and Silk & Satin each
  list a 6 PM Hard Rock Cafe set and a 9 PM Council Oak set the same night.
  On each of those nights another act holds the opposite stage at the same
  hour, so these were read as two separate sets and published as two shows.
- **Hard Rock ZIP.** Casino pages say 61108; another source said 61107. Used
  the venue's 61108.
- **Cover unknown ≠ free.** Where a venue doesn't state a price, `cover` is
  omitted (unknown) rather than set to free.
- **Artist bios** are one line in my own words, built only from facts the
  venue or band states (hometown, genre, line-up type). Unknown hometowns are
  left blank rather than guessed.
- **New `trivia` category.** Added for music trivia (Screw City's Monday
  "Name That Tune"), labelled "Music trivia", JSON-LD type `Event`, page
  `/trivia`. General pub trivia without a music angle isn't listed.
- **Music Box (published from the user's paste).** 20 shows entered from the
  venue-site listing the user pasted: date, start time, title/artists, price
  ("From $X" recorded as X; "Free" as free). No ticket links or end times,
  since the paste had none and the earlier DICE-derived values were dropped.
- **Sunset Strip shows (from the user's paste of the band's Shows page).**
  Oct 24 at Grand Avenue Pub (Beloit) and Oct 31 at Benny's @ Nest. The paste
  had no URL and sunsetstripband.com / sunsetstriprocks.com are parked
  domains, so `source.url` is blank until the band's real URL is known.
  Added Grand Avenue Pub and Benny's @ Nest venue records (Census coordinates).
- **Hard Rock adapter (approved).** `scripts/ingest/adapters/hard-rock-rockford.ts`
  took over the 24 hand-entered Hard Rock shows (same file ids, identical
  facts; only `source` changed to `venue-site` + `uid`). It fetches robots.txt
  and the sitemap daily and only event pages whose `lastmod` changed. The
  bot's own User-Agent is `815liveBot`; the Anthropic-agent robots rule is for
  fetches Claude makes interactively.
- **Screw City karaoke is every other Thursday.** The venue's events page
  just says "Thursdays", but the venue's own karaoke flyer (same phone number
  as the events page) says every other Thursday and lists the dates: 9/3,
  9/17, 10/1, 10/15, 10/29, 11/12, 12/10. The weekly rule was replaced with
  one show per listed date (10/29, 11/12, 12/10 still upcoming). The flyer
  names the host, but no name is stored.
- **First inbox run (2026-10-24).** From flyers the user collected:
  Amp-O-Calypse at Screw City (Oct 24, free), Shattered Saloon's last three
  October dates, Mike Owens at Tad's on the Rock (Oct 29, 5:30–7:30), and
  Rural On Tap's Saturday karaoke (9 PM, weekly) plus its Oct 31 Halloween
  karaoke party (the calendar's "every Saturday 9PM" covers that date).
  - Years: the Shattered flyer and the Rural On Tap calendar give October
    dates; the calendar says 2026, and the Shattered dates all fall on the
    weekdays a bar would book in 2026 (Fri/Sat, plus two Wednesdays). Tad's
    flyer says "Thursday the 29th"; Oct 29, 2026 is a Thursday.
  - Addresses: Rural On Tap from several directory listings, Shattered
    Saloon from Rock River Current's 2022 opening story, Tad's from
    directories and a 2025 WIFR list. All three matched exactly in the Census
    geocoder. None has a working website (ruralontap.com is parked), so these
    shows have no `source.url`.
  - Left out: Rural On Tap's non-music events (bingo, darts, movie trivia,
    paint night, food specials); the going-away-party details on Tad's flyer;
    the bartenders' names on the Town Hall flyer.
- **Friendlier home page (2026-10-24).** Leads with "Tonight in the 815"
  (or tomorrow when tonight is empty) with the 7-day strip directly under the
  heading, so it's visible without scrolling past tonight's list on a phone.
  Added `/date/YYYY-MM-DD` for 60 days and `/calendar`; weekly rules now
  expand 9 weeks so every date page includes them. "This weekend" is labelled
  "Weekend" in the header so five links fit at phone width. No web fonts:
  headings use a condensed system-font stack (Avenir Next Condensed on iOS,
  Roboto Condensed on Android, Bahnschrift on Windows) and fall back to the
  plain sans elsewhere. The og:image is rendered once with headless Chrome
  and committed, so builds don't depend on fonts on the build machine.

