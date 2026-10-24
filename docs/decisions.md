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
