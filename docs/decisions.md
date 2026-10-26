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
  Fontaine / Lil Byte" (DJ night; listed later the same day once DJ nights
  were added).
- **Benny's @ Nest (2026-10-25).** From the user's paste of the bar's Facebook
  events: Rebel Hearts (Sat Jan 9, 2027, 7 PM) and LynSkynyrd (Sat May 15,
  2027, 7 PM), each posted by the band. The three Oct 31 entries are one night
  (Sunset Strip's Fangbanger's Ball with the costume contest, 8:30 PM), which
  was already listed and matches.
- **Sources folders (2026-10-25).** `~/815live-sources/inbox/` now holds only
  new files. Files with an open needs-review question move to `waiting/`,
  and files that won't be listed (out of area, or out of scope like touring
  arena concerts) move to `skipped/`. Atmosphere's Winter Carnival tour at
  Hard Rock Live (Feb 6, 2027) was skipped as a touring concert.
- **DJ nights are listed (user rule, 2026-10-25).** New `dj` category
  ("DJ", page `/dj`, schema.org `MusicEvent`), placed after live music in the
  nav and the social graphic. First listing: Mulligan's "Halloween Wubs and
  Dubs" with Fontaine and Lil Byte, Sat Oct 31, 9 PM. Broadway Joe's Halloween
  party with DJ Karlo has no start time (needs-review), and neither does
  District's Wednesday DJ battle.
- **District Nov 6 (2026-10-25).** "One Night Only", Fri Nov 6, 7 PM, from the
  user's paste of District's Facebook events: the event is marked as music
  (🎶) and the venue's site says Fridays are live music, so it's listed as
  live music under that title. The paste doesn't say whether "One Night Only" is
  a band name. "Baddies Halloween Bash" (Oct 30, 9 PM) doesn't say what it is,
  so it went to needs-review. A sweep of all data for DJ acts found none
  besides Mulligan's.
- **Inbox run (2026-10-26, unattended).** Fourteen files.
  - **Best Dam Bar, Davis** (13965 Best Rd, Yelp/directories, Census match):
    Davis is in Stephenson County next to Durand, 815 area, so it's in. From
    the bar's Facebook events paste: 12 shows Oct 30 – Dec 31. Oct 30's two
    entries (band's and bar's) are one show. A Stereotype flyer for Oct 24
    was already past.
  - **Neighbors Bar & Grill, Loves Park**: the bar's own events list gives
    7745 Forest Hills Rd (matching the iExit listing; Census match) and the
    8 PM times that the waiting flyer lacked, so Oct 30 and Oct 31 are
    published along with Nov 6, 13 and 25; the needs-review entry is closed
    (the flyer's move out of `waiting/` is pending, see needs-review). Bingo and paint parties left out.
  - **Rock-A-Bago**: seven bands Nov 6 – Dec 19 plus a Dec 18 karaoke night
    (the event is named for the host; no name stored). Fast Lane's event says
    "Rock-A-Bago Lounge" with no address; read as the same bar. The Nov 19
    male revue is out of scope. Robert Dean (Oct 24) flyer was past.
  - **Grand Avenue Pub, Beloit**: the November 2026 calendar image doesn't
    name the venue, but the first-Sunday 2 PM Jack Farina Big Band slot,
    Sunday meat raffles and Thursday bingo match Gazette and Beloit Daily
    News listings for the pub, so it's published (13 shows). Bingo, meat
    raffles, drink specials left out. The image's right edge is cropped;
    Saturday names (Shuffle This, Stereo Type, Soul 2 Soul) are read as
    shown. "Stereo Type" is linked to the existing Stereotype; "Synergy" got
    its own record rather than being merged with The Synergy Band (R&B, Hard
    Rock), since nothing says they're the same. DJ Proper (Nov 25) is a `dj`
    show.
  - **Cahoots Rockford** (new venue, 314 Prairie St per its flyer and
    Facebook events; early press gave 505 N Madison for the same building
    project; Census match on Prairie St): Decades of Rock, Nov 7, one listing
    with set times (3/6/9 PM); ticket link is only a QR code, not read.
    Karaoke Nov 14 (free, all ages, per the event) and Dec 11 (cover unknown:
    the screenshot cuts off before the price line), both 7–10 PM.
  - **Buster's Bar & Grill, Loves Park** (new venue, 7113 N Alpine Rd from
    Yelp/My Rockford Guide; Census match): Acoustic Reverie, Nov 7, 7–10 PM.
    No year on the flyer; the next Nov 7 is 2026. Two copies of the flyer.
  - **No change**: Hot Rod Nellie's paste (all already listed; Holly still
    open, file in `waiting/`), Pablo & the Rhythmix flyer (already listed),
    Benny's @ Nest paste (already listed).
- **Home page split into Today / Later this week / Coming up (user request,
  2026-10-26).** Top section is "Today" before 5 PM and "Tonight" from 5 PM,
  with the date, and lists only that night. A night runs until 4 AM: shows
  starting before 4 AM count as the previous night, and a visitor at 1 AM
  still sees last night. Nothing listed → says so and links the next night
  that has events. Second section is tomorrow through Sunday ("Later this
  week"), or the next 7 days on Saturday and Sunday so it's never a single
  day. Third is "Coming up": the next ~8 one-off shows (whole days; weekly
  nights are left to "Every week"), then a calendar link. The daily build
  runs about 3 AM and is read all day, so the build sorts by its own
  calendar date and an inline script re-sorts by the visitor's Chicago night
  on load (rules shared in `src/lib/shows.ts`: `nightOf`, `laterWindow`,
  `dayPart`). The page carries the previous night and spare days, hidden, for
  that. The day strip's first chip follows the same Today/Tonight label.
  Date picker and type filters moved below Coming up so Today and Later sit
  together.
- **Footer social icons (user request, 2026-10-26).** "Follow us" text
  replaced by Facebook "f" and Instagram glyphs as inline SVG (Font Awesome
  Free brand icons, CC BY 4.0, credited in `Base.astro`), text colour with
  accent on hover, 44px tap targets, `aria-label`s and `rel="me"`. Not added
  to the header: at 360px the wordmark row already holds "Submit a show", and
  two more 44px targets would crowd it.
- **/submit page (user request, 2026-10-26).** Who it's for, what to send,
  a mailto button (subject "Show submission", body template with the
  fields), the 815-area-only and start-time-required rules. "Submit a show"
  is a pill in the header on every page (beside the wordmark on phones, after
  the nav on wide screens). Footer and About links point to /submit; it's in
  the sitemap. No form backend.
- **Review of the 2026-10-26 unattended run (0687c84).** Checked all 42 show
  files against their sources (Best Dam Bar, Rock-A-Bago and Neighbors
  event lists; Grand Avenue November calendar; Cahoots flyer and two event
  screenshots; Buster's flyer). Every date, start/end time, venue and act
  matches, weekdays agree with the year, and there are no duplicates of
  existing listings (same venue and date, or same act and date). The four new
  venues re-geocode to the same Census coordinates. Jack Farina Big Band's
  Beloit hometown is supported by the Beloit Daily News; Farina himself died
  in Feb 2024 per the same paper, but the pub's 2026 calendar still lists the
  band, so the listing stands. One unsupported detail removed (Buster's
  "video gaming and a patio"). The cropped Grand Avenue names and the
  Synergy/Stereotype calls moved to needs-review.
- **Trust fields on listings (user request, 2026-10-26).** Every show and
  recurring rule now has `checked` (date last compared with its source) and
  `source.kind` (`venue`, `artist`, `presenter`, `roundup`) when it has a URL,
  plus optional `source.also` for other postings of the same event. The site
  links the closest source (anything over a roundup); with no URL it falls
  back to the venue's website, labelled "Venue: …". Existing files were
  backfilled with `checked` = the date of their last commit, which is a lower
  bound (the 2026-10-26 review checked more than it changed). Ingested Hard
  Rock shows get `checked` when written, and `data/ingest/checked.json` holds
  each adapter's last clean run so unchanged shows still read as checked that
  day; the daily bot will commit that file each day. Each card has a small
  "source · Checked Oct 25 · Report a change" line; the report link is a
  mailto to shows@815live.com naming the listing. Footer: "Shows change;
  check with the venue before heading out." `lineupPartial` adds "more TBA"
  after the line-up.
- **Shifty Boys Unplugged, Best Dam Bar, Oct 30 (user, 2026-10-26).** End time
  11:30 PM, "Acoustic set.", source the Facebook event the user gave (not
  fetched). Kind set to `artist`: Best Dam Bar's list shows two events that
  night, one by the band and one by the bar, and the ID can't be matched
  without opening Facebook.
- **Cahoots Decades of Rock, Nov 7: `lineupPartial` (user, 2026-10-26).** The
  user says the line-up is incomplete. The flyer on file names three acts
  (Dirty Fishnet Stockings 3 PM, That 70s Band 6 PM, Sunset Strip 9 PM), and
  those stay listed.
