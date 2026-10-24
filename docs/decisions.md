# Decisions log

Calls made while filling out listings unattended (session of 2026-10-24).

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
- **Hard Rock ZIP.** Casino pages say 61108; OpenStreetMap says 61107. Used the
  venue's 61108. Coordinates from OpenStreetMap.
- **Cover unknown ≠ free.** Where a venue doesn't state a price, `cover` is
  omitted (unknown) rather than set to free.
- **Artist bios** are one line in my own words, built only from facts the
  venue or band states (hometown, genre, line-up type). Unknown hometowns are
  left blank rather than guessed.
- **The Music Box source.** The venue's own site renders its calendar from
  DICE (via DICE's partner API with the venue's widget key, which we don't
  use; `dice.fm/api/` is also robots-disallowed). Listings were taken from
  DICE's public venue page `dice.fm/venue/the-music-box-p3nl`, which robots.txt
  allows and which carries the same events as schema.org JSON-LD. Treated as
  the venue's own listing.
- **Music Box prices.** `cover` is DICE's listed all-in price (fees included,
  e.g. $15.08). DICE's `$0.00` events are recorded as free. Every show links
  its DICE event page as `ticketUrl`.
- **Music Box names.** DICE titles are in caps ("AN EVENING with ERIK
  KOSKINEN"); artist names were set in normal case except `BAMM`, kept as-is
  because the caps may be the band's styling. "Karaoke/Open Mic Night with
  Riley Sanders" is filed as karaoke (it's both) with the host in notes.
  End times are DICE's.
