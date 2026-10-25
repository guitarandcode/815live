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

- **Karaoke flyers (user's screenshots, 2026-10-24).** Published weekly
  karaoke from flyers: District Thu 9 PM; Shattered Saloon open mic & karaoke
  Thu 8 PM (category `open-mic`, one listing rather than two at the same
  slot); Benny's @ Nest Thu 8–12; Murphy's Pub & Grill Thu 9 PM (the flyer's
  five-week showdown ended 10/16, but it says karaoke is every Thursday); and
  the DJ's October schedule, limited to October (`months: [10]`):
  Rock-A-Bago Sun 7–11 (all ages), Benny's Roscoe Tue and Sat 8–12 (Saturday
  is contest qualifying), Broadway Joe's Fri 9–1. Left out: DJ and bartender
  names, drink specials, gift-card giveaways, and a "District with Sammy
  Heaton" post with no date or time.
  - Addresses: Rock-A-Bago (4303 W State St, SeatGeek/Roadtrippers listings as
    "Rock A Bago Hall"), Broadway Joe's (3907 Broadway, Rock River Current via
    search result and Patch), Murphy's (510 S Perryville Rd, Rockford Chamber
    directory and iExit). Benny's Roscoe's 5328 Williams Dr comes from a 2022
    Rockton-Roscoe News listing; a 2024 report confirms the Roscoe location
    but not the street address, so confirm when possible. Census matched all
    but Murphy's, whose pin is interpolated between Census's 450 and 600
    S Perryville Rd matches.
- **Facebook "concert" search paste (2026-10-25).** From the user's paste of
  Facebook event search results, published only local-scale live music:
  - Overflowing Cup (Josiah's Place), Beloit: Rex Carroll (Nov 7), Gary
    Gilleran (Nov 28), Ken Verheecke (Dec 5), Rusty Drake (Apr 10, 2027), all
    7 PM. The venue's own site gives 1175 Madison Rd and says all events start at
    7 PM there unless noted; its concert calendar page was empty. Genres are the
    tags in the event titles. (Songkick lists an old 310 State St address; not used.)
  - Carrie Newcomer, Thu Nov 12, 7 PM, Our Savior's Lutheran Church
    (3301 Corbridge Ln, from the event's Zeffy ticket page as shown in search
    results; Census match). Zeffy answers 403, so the page wasn't read; the
    price ($25 per the search snippet) is left as unknown.
  - Diamonds with The Nielsen Trust, Thu Dec 17 at Hard Rock Live: a local
    band, so included despite the "no touring Hard Rock Live concerts" rule.
    Facts from the casino's own event page (program 7 PM; doors 6, headliner
    8). The Hard Rock adapter reads only `upcoming-events/` pages, so this
    manual file won't collide with it.
  - Left out as out of scope: TobyMac and Derek Hough (touring arena/theatre),
    Rockford Symphony, Twilight in Concert, Coronado organ tour and Matt
    Mathews organ concert, Harlem High School's Kaleidoscope concert, a male
    revue at Rock-A-Bago, and a children's museum opening.
- **Inbox run (2026-10-25).** Crossroads Blues Society's "Music Off The Rock
  2026/2027" flyer: seven free blues shows at the RPL Nordlof Center (118 N
  Main St, J.R. Sullivan Theater), 6 PM with doors at 5, Oct 28 – Apr 24.
  Free admission is stated, so `cover: null`. The May show is "TBD" and not
  listed. Source link is the society's series page (robots allows; content is
  JS-rendered, so facts are from the flyer). Food-truck and beverage lines
  left out. A Shattered Saloon October flyer was a re-save of the one already
  filed; nothing new (Oct 30 and 31 were already listed).
- **815 area only (user rule, 2026-10-25).** List shows only in the 815 area:
  Rockford, Loves Park, Machesney Park, Belvidere, Roscoe, Rockton, South
  Beloit, Beloit WI and similar nearby towns. Out-of-area flyers are moved to
  `~/815live-sources/skipped/` (renamed `YYYY-MM_description.ext`) instead of
  sitting in the inbox. The rule and the inbox procedure are in `CLAUDE.md`,
  which the unattended inbox run reads. First use: In the Flesh at Rochaus,
  West Dundee (Nov 14), skipped.
- **Pig Minds comedy (2026-10-25).** Sat Nov 21, 7 PM stand-up by Next Stop
  Comedy, from the venue's own events calendar (pasted by the user; the
  site itself is behind a bot challenge) and the promoter's flyer from the
  inbox (an AVIF, converted to read it). Bingo, "Paws on the Patio" and
  other non-performance events left out; the October comedy night is past.
  Ticket link is the promoter's site from the flyer. Calendar says 6:30 AM–9 PM
  for the event block; the show time (7 PM) is from the text and flyer.
- **Hot Rod Nellie's, Pecatonica (2026-10-25).** From the user's paste of the
  bar's Facebook events list (address 122 S Jackson Rd, Census match):
  Halloween Bash with Rollin' Whiskey (Oct 31, 8 PM), Pablo & the Rhythmix
  (Nov 7, 8:30 PM), Jupiter Sky (Nov 28, 8 PM). "Rollin' Whiskey" follows the
  bar's spelling (Shattered's October flyer wrote "Rolling Whiskey"). Left
  out: 9-ball tournament, Witch's Night Out, pub crawl, line-dance lessons,
  bingo nights, Thanksgiving dinner. Karaoke after Nov 25's candle bingo has
  no start time, so it isn't listed.
- **Mary's Place Nov–Dec (2026-10-25).** From the user's paste of the bar's
  Facebook events list: Too Deep (Nov 7), The Handcuffs with Monkeymind
  (Nov 14), Pistol Pete (Nov 21), Hogleg with Lonely Teenage (Fri Nov 27),
  Kofi Baker's Psychedelic Trip (Dec 5), all 8 PM. Halloween Hijinks (Oct 30)
  was already listed and matches. No covers in the paste, so left unknown.
- **Mulligan's Pub & Grill (2026-10-25).** From the user's paste of the bar's
  Facebook page (address 2212 N Main St, Census match): "Helloween at
  Mulligan's", Fri Oct 30, 6 PM, posted by the band Faith In Vain, so listed
  with them as the act (the rest of the bill isn't given). Left out: costume
  party, pumpkin painting, and Sat Oct 31 "Halloween Wubs and Dubs ft
  Fontaine / Lil Byte" (a DJ/dubstep night; DJ nights aren't listed so far).
