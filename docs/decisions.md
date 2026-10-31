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
  "source · Report a change" line (the checked date is on show pages only;
  the user dropped it from cards the same day); the report link is a
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
- **Quiet-night graphic (user request, 2026-10-26).** When tonight has fewer
  than 3 listings, `npm run social:tonight` makes one "Tonight + this week"
  image: tonight on top (or "Nothing listed tonight."), then up to 6 one-off
  shows from the next 7 days, soonest first. It's a rolling window rather
  than "through Saturday", so Saturdays need no special case. Weekly nights
  aren't highlights. Busy nights keep the tonight-only image(s). The caption
  gets a matching "NEXT 7 DAYS" list. With nothing tonight and nothing in the
  week, no image is made.
- **Quiet-night highlights are live shows only (user, 2026-10-26).** The week
  list takes one-off `live-music` and `comedy` shows, and drops anything
  titled as a jam. Karaoke, open mics, trivia and DJ nights never appear
  there, even as one-off dates. Screw City's karaoke stays as dated shows, not
  a weekly rule: the flyer says every other Thursday and its dates aren't
  evenly spaced (11/12 is followed by 12/10).
- **Manual refresh (user request, 2026-10-26 afternoon).** 51 inbox files.
  Published: Whiskey's Roadhouse "Spooktacular Boo Bash" (Oct 30; flyer plus
  the Savage Gentlemen event for times and set order); Splitter's "Metal Night
  8" (Oct 30, fourth band unreadable, `lineupPartial`); Ashton Creek Band at
  Sheila's Daiquiri Lounge (Nov 6); Fozzy's 80's Hair Bands Music Bingo (Oct
  28, filed as `trivia`, since music bingo is a music game like Name That
  Tune) and Halloween DJ party (Oct 31); Rue Marché "Rue-Loween" karaoke (Oct
  30 and 31, 9 PM–2 AM, one-offs); Inscape Midtown Collective holiday boutique
  sets (Magtones Dec 4, Jeff Layng Dec 5); Hotel Goodwin rooftop Halloween
  Zombie Prom DJ night (Oct 31; the screenshot's "Saturday" was taken Mon Oct
  26, so Oct 31); Murphy's weekly Wednesday open mic, 7 PM (featured
  performers are first names only, left out). New venues: Fozzy's Bar & Grill
  (6246 E Riverside Blvd, Loves Park, the 2019 location per Northwest
  Quarterly), Sheila's, Splitter's, Inscape, Hotel Goodwin rooftop; all Census
  geocoded. Mary's Place Oct 30 gained the $10 cover and the cover-set names.
  Re-confirmed and `checked` bumped: Reverend Raven, Mike Owens at Tad's,
  Rollin' Whiskey at Hot Rod Nellie's, Harpo's Revue and Shifty Boys at Best
  Dam Bar, Cahoots Decades of Rock, Broadway Joe's Friday karaoke (9 PM).
  Skipped: past dates (14), out of area (Sterling, Elizabeth, Ottawa,
  Hampshire, Janesville, Chicago area), plain bingo and a joker drawing.
  Highway 20 Brewing turned out to be in Elizabeth (Jo Daviess County), not
  Freeport. Oregon and Freeport shows wait on an area decision.
- **Area rule: about 30 minutes from downtown Rockford (user, 2026-10-26).**
  Freeport, Oregon, Belvidere, Davis, Roscoe and Beloit are in; Sterling,
  Dixon, Ottawa and farther are out. CLAUDE.md and /submit updated. Added the
  Oregon/Freeport Halloween shows: Burn N' Bush at Tipsy Hog (101 S 3rd St,
  address from the Oregon Area Chamber directory), Sheez-It at Chrissy's Corner
  (17 N River Rd, from the city of Oregon's listing; the full band, not the
  Sheez It Duoz acoustic act), The Real Deal at Kings Bar & Grill, Freeport
  (linked to the existing The Real Deal record from Best Dam Bar; same name,
  not otherwise verified). No earlier skipped files were from Freeport or
  Oregon.
- **Maxine's Social, Oct 29–31: listed at doors (user, 2026-10-26).** The flyer
  gives only "doors open at 6 PM", so the three nights are listed at 6 PM with
  the note "Doors 6 PM; start time not announced." Tipsy's Tavern's Halloween
  DJ party is skipped until a time and address turn up.
- **Mary's Place Oct 30: the newer flyer wins (user).** Joie De Vivre dropped
  from the bill.
- **Quiet-night graphic title** now reads "Tonight + Next 7 Days" (user), to
  match its section heading; the caption's first line matches.
- **Grand Avenue Pub blues night moves to Thursdays (user, from Rockford's
  Local Music Scene daily post, 2026-10-26).** Tonight's "Last Monday Night
  Blues with Billy Flynn" (7 PM) is a one-off. The weekly Thursday 7 PM rule
  starts Oct 29 and is titled "Blues Night", the venue's name on its November
  calendar, which also names other acts on Nov 5, 12 and 19 (those one-offs
  take precedence over the rule) and has no Thursday Nov 26 (Thanksgiving,
  added to `skip`). Source kind `roundup` as the user asked; the post has no
  URL on file, so nothing is linked and the cards fall back to the venue's
  website.
- **No visible time zone (user, 2026-10-26).** Readers are local, so "All
  times Central" (home, date, category and this-weekend pages), the "CT" after
  show-page times and the footer's "Listings updated" stamp, and the RSS item
  text are gone. Graphics and captions had none. JSON-LD and the .ics feed
  keep the Chicago offset/TZID so search engines and calendars read times
  correctly. (Cards already dropped "Checked [date]" earlier the same day.)
- **Inbox run (scheduled, 2026-10-26 evening).** 6 files, nothing published.
  Skipped as past: Kurt Karaoke at Rock-A-Bago (Oct 23), Chad Foster at
  Neighbors (Oct 23), Stereotype at Best Dam Bar (Oct 24), The Tom Mac Group at
  Inscape (Oct 24). Skipped as out of scope: Mulligan's pumpkin painting (Oct
  28). Addison Johnson at Boxcars Pub & Grub, Clinton WI (Oct 28) waits on an
  area call, since Clinton is about 30 minutes or more away (see needs-review).
- **Inbox run (scheduled, 2026-10-27).** 8 files. Published: Grand Avenue Pub
  "Spooky Bash" with DJ Audiboi (Sat Oct 31, 9 PM–1 AM, `dj`, new artist);
  Shattered Saloon "Zombie Prom Karaoke" (Thu Oct 29, 8 PM), filed as a one-off
  `karaoke` show that takes precedence over the Thursday open mic & karaoke
  rule that night. Shattered's Oct 30 (Mothman) and Oct 31 (Stereotype) re-confirmed,
  `checked` bumped; its Wed Oct 28 Halloween bingo left out (plain bingo).
  Skipped: Alex Wilson Band at the Uptowner, Milwaukee (out of area); Rusty
  Fox open mic, Sterling (out of area); Stereotype at Best Dam Bar Oct 24
  (past, a second copy). Waiting: Grand Avenue Pub's Fri Oct 30 Mr. Pink (DJ or
  band?), Regal Beagle at "Morts Pub" (no town; maybe Mort's Bar & Grill,
  Freeport), Rascals' Halloween party with The Wolfman (DJ or performer; Loves
  Park address from directories only).
- **Quiet-night graphic heading is now "Coming Up" (user, 2026-10-27).** The
  title reads "Tonight + Coming Up" and the week's section label "Coming up";
  the caption's first line and its list heading ("COMING UP") match. The
  window is still the next 7 days and the cap still 6 shows. The home page's
  weekend "Next 7 days" section label is a different feature and is unchanged.
- **Social captions: no repeated town (user, 2026-10-27).** The town in
  parentheses after a venue (and after the "·" on the image) is left out when
  the venue's name already contains it, so "Benny's Roscoe", not "Benny's
  Roscoe (Roscoe)". Rockford is still never shown. Of the current venues only
  Benny's Roscoe was affected (Cahoots Rockford and Hard Rock Casino Rockford
  are in Rockford). The user also asked for one display name per venue in the
  caption; it already uses each venue's `name` from `data/venues` in both
  sections, and "The Music Box of Rockford" appears nowhere in the data (only
  as DICE's promoter name in docs/venue-sources.md), so nothing changed there.
- **Daily Reel (user, 2026-10-27).** `npm run social:reel` turns the day's
  graphic (page 1 on busy nights; no graphic means no reel) into
  `social/tonight-YYYY-MM-DD.mp4` (1080x1920, H.264 High, yuv420p, 30 fps,
  15 s, `-preset veryfast`, CRF 18) and a short `-reel.txt` caption (the
  post's title line, the site and email, the hashtags). The graphic sits at
  84% on the brand background (#12110f, no bars), centered at (470, 900)
  rather than mid-frame, so at full zoom its content spans x 45–895 and
  y 346–1454: clear of the Reels UI in the right 15% (x > 918) and bottom 20%
  (y > 1536). Zoom is linear 100→108% over all 450 frames, with 0.6 s fades in
  and out to the background color. Frames are drawn by resvg with a
  fractional transform and piped to ffmpeg: zoompan, even on a 4x canvas,
  jittered by up to 1.5 px between frames; the resvg version measured smooth
  (under 0.1 px off the curve, lossless). Audio is
  `~/815live-sources/audio/reel.m4a`, outside the repo because it's the user's
  own recording and the repo is public; missing means a silent video. That
  file is 1:12–1:27 of the user's track "Chirp", with a 0.3 s fade in (no
  click at the cut) and a 1.5 s fade out, two-pass loudnorm to -14 LUFS
  (linear gain, so the fades keep their shape), AAC 192k; the generator
  copies it in as-is. Music is never
  downloaded. The 9 AM / 5 PM timer script (`~/.local/bin/815live-inbox.sh`)
  runs it right after the graphic; a reel failure is noted in the
  notification but doesn't fail the run. `/social/` was already gitignored,
  so videos are never committed.
- **Event image in JSON-LD is the site card (2026-10-27).** Google recommends
  `image` for Event rich results. Venues have no image field and we never copy
  venue images, so every event uses `/og.png`. `check-jsonld.mjs` now requires
  an absolute `image` on every event.
- **/tonight, /tomorrow and /free (2026-10-27).** "Tonight" and "tomorrow" use
  the build's Chicago date and the 4 AM night rule (a 1 AM set is part of the
  night before), like the home page. The daily workflow already rebuilds every
  day at 08:17 UTC (deploy hook when data is unchanged), so no new cron is
  needed; a hidden note links to the right /date page if a build is missed.
  "Free" means `cover` null or 0; an omitted (unknown) cover isn't claimed as
  free. Weekly nights appear only for the next 7 days, as on the home page.
- **robots.txt blocks AI training crawlers only (user, 2026-10-27).** GPTBot,
  CCBot, Google-Extended, ClaudeBot, Bytespider, Meta-ExternalAgent are
  disallowed; search and user-initiated agents stay allowed.
- **Ingest: Crawl-delay honored, dry run, hand-entered shows win (2026-10-27).**
  `http.ts` waits the site's Crawl-delay between requests (Mendelssohn sets
  60 s). `run.ts --dry-run` prints each show it would add, change or delete
  and writes nothing. When a hand-entered show exists at the same venue on the
  same date, an adapter leaves it alone and logs any time mismatch, rather
  than adopting it as the Hard Rock adapter does by id. Adapters match
  performer names against data/artists (ignoring case, punctuation and a
  leading "The") and log `ASK` when a new name shares its first two words
  with an existing act.
- **Tiered prices (2026-10-27).** Where a venue lists advance, door and
  student prices, `cover` is the advance (lowest general) price and the full
  line goes in notes ("Tickets: $20 In Advance / $25 At the Door / $6
  Student.").
- **Music Box stays manual (2026-10-27).** Re-checked: the venue's own API
  (api.themusicboxrockford.com) has no events endpoint; listings come only
  from the DICE widget. DICE's partner API has no robots.txt but needs the
  widget's partner key, which was issued to the venue for its site, and every
  other DICE host disallows ClaudeBot/anthropic-ai with `ai-train=no`. Not
  automated without permission from the venue or DICE.
- **New adapters (2026-10-27).** `mendelssohn-pac` (Event Organiser iCal +
  event pages), `rpl-nordlof` (Communico iCal, Nordlof Center only, keyword
  music filter), `inscape-collective` (Wix event sitemap + Event JSON-LD).
  Details and fallbacks are in each adapter's header and in venue-sources.md.
  The daily workflow's timeout went from 15 to 25 minutes because the
  Mendelssohn crawl delay makes its first run about 7 minutes.
- **Palace Wine Bar (user, 2026-10-27).** Venue added (202 N Main St, from the
  bar's site; Census coordinates). Every item came from the bar's own
  calendar page (palacewinebar.com/calendar): weekly "Downtown After Dark"
  (Fri 8:30–10:30 PM, jazz) and "Local Sounds" (Sat 7–9 PM), each held every
  week from late July through Oct 24, are recurring rules; Halloween Eve with
  The Vintage Beau (Fri Oct 30, 8:30–10:30) and Halloween Night with DJ Rated
  AG (Sat Oct 31, 8–11, `dj`, DJ as the billed act) are one-offs and replace
  that week's series nights through the usual 2-hour dedupe. No cover stated.
  Comedy and poetry nights there aren't regular enough to add. Abreo stays
  out until there's a flyer or post for "Dive Bar Live" (its site 403s).
- **Mary's Market Roscoe (user, 2026-10-27).** Venue added (4866 Bluestem Rd,
  Census). Weekly Thursday "Live Music at Mary's", 5:30–7:30 PM, skipping
  Nov 26 (closed) and Dec 24/31 ("Holiday Hours", see needs-review). Named
  performers through Dec 17 are one-offs; Clark Kelly and Emilio Salinas
  reuse existing artists. Dec 10 is titled "Christmas Jazz".
- **Trinadora and the Abram Collier Nonet (user, 2026-10-27).** Trinadora
  (also billed "Trinadora Rocks") is a performer: artist added and the
  Inscape Halloween Party (Sat Oct 31, 2–4 PM) hand-entered with them, so the
  adapter leaves it alone. The Abram Collier Nonet is a separate act from the
  Quintet; the adapter created it and it was filled in (jazz, Chicago).
- **Recurring horizon: 8 weeks (user, 2026-10-27).** Weekly rules are
  expanded only 8 weeks out from the build's Chicago date
  (`RECURRING_HORIZON_WEEKS` in src/lib/data.ts, the one place to change it):
  at most 8 dated listings per rule, all within the next 56 days, in pages,
  the sitemap, iCal and RSS. Before this it was 9 weeks (to cover all 60 date
  pages). The daily build moves the window forward. Dated one-offs (adapters
  and hand-entered shows) are not limited, so date pages 57–60 list one-offs
  only. No show files had to go: everything dated past the horizon is a
  one-off with a named act. Build tests that rely on weekly rules now build
  against tests/fixtures/data (`SITE_DATA`) instead of real listings.
- **Every "today" is America/Chicago (user, 2026-10-27).** Cloudflare and
  GitHub Actions build in UTC, so no page uses the host clock's date. "Today"
  is always `chicagoDate(NOW)` (src/lib/time.ts) at build time, and
  `nowNight` (Chicago, 4 AM rule) in the browser. That covers /tonight,
  /tomorrow, /this-weekend, the home page, the calendar, date pages and the
  sitemap's /date/ URLs (both from `datePageDates()`), iCal and RSS, and
  ingest's `today`. Calendar arithmetic on dates stays timezone-free (UTC
  noon/midnight on date strings). A build test pins 02:00 UTC (9 PM the
  previous day in Chicago) and checks every one of these uses the Chicago
  date.
- **Date pages end at the recurring horizon (user, 2026-10-27).**
  `DATE_PAGE_DAYS` is now `RECURRING_HORIZON_WEEKS * 7` (56, was 60), so no
  date page is missing its weekly nights. The sitemap, calendar, date picker,
  day strip, prev/next links and day-heading links all come from the same
  window and stop there. Shows beyond it keep their own show pages.
- **4 AM Chicago rebuild Worker (user, 2026-10-27).** GitHub's scheduled
  ingest has been starting 5–7 hours late (8–10 AM Chicago), and a failed
  test or build skips the rebuild. `workers/daily-rebuild/` is a cron-only
  Cloudflare Worker (crons 09:05 and 10:05 UTC; it posts only on the one that
  is 4 AM in Chicago, so CDT uses 09:05 and CST 10:05) that POSTs the Pages
  production deploy hook, rebuilding main as it is. The hook URL is the
  Worker secret `DEPLOY_HOOK_URL`, never in the repo; no fetch handler and
  `workers_dev = false`, so it has no public URL. The user deploys it by hand
  (commands in its README); the GitHub workflow is unchanged.
- **Inbox run (scheduled, 2026-10-27 afternoon).** 11 files. Published:
  Sheila's Daiquiri Lounge "Thirsty Thursday Karaoke", a weekly rule (Thu
  7–11 PM, from the bar's own "Every Thursday" flyer; host names and phone
  numbers left out), which closes the Sheila's karaoke tip in needs-review;
  Sheila's Halloween Costume Party with DJ Solow Dolo (Sat Oct 31, 8 PM–midnight,
  `dj`, new artist). From Stereotype's own dates post (weekdays all match
  2026): Benny's @ Nest (Sat Nov 21, 7 PM, stuffed animal drive) and
  "Blackout Wednesday" at Splitter's inside Park Lanes (Nov 25, 8 PM). The
  post's "Shattered Bar Loves Park" is read as Shattered Saloon. It also
  confirms the band behind Grand Avenue's cropped Nov 14 "Stereo Type" (it
  calls the night Emo Night, now the title), so that needs-review item is
  closed. Re-confirmed and `checked` bumped: Stereotype at Shattered Oct 31,
  Reverend Raven at the Nordlof Oct 28 (band's event: 6 PM, doors 5), Rue
  Marché karaoke Oct 30–31. Skipped (out of area): open jam at Red's on 7th,
  Delavan WI; El Lobo Acoustic Experience at Studio Winery, Lake Geneva WI.
  Waiting: Stereotype's HydeOut Bar (no location), Whiskey's Dec 12 and
  Shattered Dec 31 dates (no times); Sensations at Grand Avenue Tue Oct 27
  (no time); Rockton Inn "Hard Dance Halloween" ("This Saturday", undated);
  Buchanan St Pub Halloween party (no entertainment named); Polly Says at
  Genoa Veterans Home (Genoa is borderline on distance).
- **Internal links to /tonight, /tomorrow and /free (2026-10-27).** The
  header's "Tonight" now goes to /tonight; the home link is the wordmark.
  "Tomorrow" didn't fit the header: on phones the nav already needed 339px
  of a 313–328px row (360–375px screens), and Tomorrow made it 427px, pushing
  Venues and Artists off-screen. It goes on the home page instead: a link row
  under the day strip (Tonight's full list, Tomorrow, This weekend, Free
  shows), and the strip's own Tomorrow chip. One rule (`dayHref` in
  src/lib/data.ts) sends links to the build's today and tomorrow to /tonight
  and /tomorrow and every other day to its date page. It applies to the day
  strip, the home page's night headings and "Next up". Base's inline script
  repeats it with `data-day-link`: on a page older than the visitor's night,
  /tonight would be stale too, so every day link falls back to its date page.
  "Free" is the last chip in the category filter row (always shown, since
  /free always exists), and /free shows the row with Free selected. The
  pages aren't near-duplicates. The home page is "815live: Live music in
  Rockford, IL" with h1 "Tonight in the 815" and covers the week, coming up
  and weekly nights. /tonight is "Live Music in Rockford Tonight" with h1
  "Live music in Rockford tonight" and covers only tonight. Date pages keep
  "Live music in Rockford on <day>" and the date as h1. So no canonical
  changes. /date/<today> keeps a self-canonical instead of pointing to
  /tonight, because that canonical would flip every day on a static page
  (Google tends to ignore unstable canonicals). It would also hide the date
  page on the one day "Rockford music October 31" searches matter most.
  Today's and tomorrow's date pages link to /tonight and /tomorrow instead,
  so internal links favor the landing pages. Past shows are dropped from the
  sitemap: their pages stay up for old links, but no listing links to them.
  `tests/build.e2e.ts` fails if any sitemap URL has no plain `<a href>` from
  another page; it found exactly those past shows.
- **Other events are a side door; music stays the core (user, 2026-10-27).**
  No new field: the `category` decides music vs. other (`src/lib/categories.ts`),
  so the two can't disagree. Music is `live-music`, `dj` and `open-mic` (music
  open stages); other is `trivia`, `bingo` (new), `karaoke`, `comedy` and
  `other` (new catch-all, e.g. a poetry open mic). Weekly rules already handle
  repeating nights. Per the user, games are other even when musical: Fozzy's
  "Music Bingo" moved from `trivia` to `bingo`, and Name That Tune stays `trivia`.
  Shattered's "Open Mic & Karaoke" and Maxine's unspecified open mic stay music
  `open-mic` as before and are flagged in needs-review instead of re-filed by guess.
  - Pages. The home page, /tonight, /tomorrow, date pages and /free list
    music first, then an "Also happening" (or "Also free") block. If there's no
    music, the page says "No live music listed" and shows the other events
    below. On the home page only Tonight shows a night's other events: a night
    with no music is left out of Later this week and Coming up, "Next up" skips
    to the next music night, and "Every week" splits into music then "Also
    every week".
  - The filter row is All, the music categories, Free, then a dashed "Other
    events" chip linking to the new /other-events. That page and the other
    category pages add a second row (Trivia, Bingo, Karaoke, Comedy). At 360px
    the main row wraps to two lines (checked by screenshot). 'other' has no
    page of its own.
  - /trivia is now "Trivia nights in Rockford, IL" (was music trivia). /bingo
    is new. /karaoke and /comedy titles are unchanged, as are every music
    page's titles and canonicals. Empty category pages stay noindexed and out
    of the sitemap. Category pages are linked from /other-events and every
    "Also happening" block, not the header.
  - JSON-LD: `MusicEvent` for music (open mics included, previously `Event`),
    `ComedyEvent` for comedy, `SocialEvent` for trivia, bingo and karaoke,
    `Event` for other. Bands are performers only on music; comedians become
    `Person`; trivia and karaoke hosts aren't listed as performers.
    check-jsonld rejects a `MusicGroup` performer on a non-music event.
  - Social graphic (replaced 2026-10-28, see "Tonight graphic lists every
    category" below): busy nights are music only. On quiet nights (under 3
    music listings) other events fill whatever room the music and the week
    leave, at the bottom under a muted "Also tonight" in smaller rows. If they
    don't fit, the last row reads "+ N more on 815live.com". The caption lists
    them last. Coming-up highlights are live music only; comedy was dropped.
  - Ingestion: `scripts/ingest/lib/classify.ts` returns a category or a
    question. Inscape and Hard Rock use it, and CLAUDE.md carries the same
    rules for inbox runs, where a question goes to needs-review.
- **Show page titles: time, then stage, only on collisions (user, 2026-10-27).**
  Same act, venue and day happens with two sets (Music Box early and late) and
  with Hard Rock's two stages, and those pages shared a `<title>`. Colliding
  indexable pages now add their Chicago start time ("…, Friday, November 27,
  9 PM"), and their stage too if the times also match ("…, 8 PM, Main stage",
  from the "On the X stage." note; the description names the stage as well).
  `og:title` uses the same string. All other titles are byte-for-byte
  unchanged; URLs, canonicals, the sitemap and robots.txt didn't change. In a
  pinned before/after build, 8 titles changed (4 pairs), all resolved by time.
  `showPageTitles()` in src/lib/data.ts. A build test fails if two indexable
  pages share a title or meta description, on real and fixture data.
- **Inbox run (scheduled, 2026-10-28 morning).** 5 Facebook screenshots, no
  new listings. Re-confirmed: Cahoots "Decades of Rock" Sat Nov 7 (same flyer,
  reposted by Rockford's Local Music Scene; `checked` bumped) and The Stevee
  Nix at Hard Rock Sat Nov 7, 9 PM (a RAWLE share calling it "Farewell show 1
  of 2"; the record is the Hard Rock adapter's, so it's left to the bot).
  Skipped: The Spins at Danny's on Douglas, Elgin (out of area); Highway 20
  Brewing's open mic and Cowboy Neil posts (Elizabeth, out of area, as on
  10-26); Crazy Times Pub & Grub's weekly specials board (its only listable
  item, Tue 10/27 bingo at 6:30, is past; the rest is food, a meat raffle, a
  joker drawing and a pub crawl). The board doesn't say the bingo is weekly;
  if it is, it could become a `bingo` rule. Waiting: a cropped Crossroads
  Blues Society post for Fri Oct 30 (see needs-review). This run couldn't
  switch to `main` (switching branches needs approval), so it was committed
  on `other-events` and not pushed.
- **Daily job order (user, 2026-10-28).** `~/.local/bin/815live-inbox.sh`
  (timer `815live-inbox.timer`, 9 AM and 5 PM) runs in this fixed order
  (step 0, the branch guard, was added later the same day; see "Daily job runs
  only on a clean main" below):
  1. Inbox: `claude -p "process the inbox"` (skipped when the inbox is
     empty), retried on a non-zero exit. The run commits its own changes.
  2. Gate: `npm run social:tonight` runs only if step 1 finished (claude
     exited 0, or there was nothing to do) and its work is committed
     (`git status --porcelain -- data docs` is empty). Otherwise the graphic
     and reel are skipped, today's existing files are left alone, and a
     critical notification says why. A file left in the inbox after a
     successful, committed run is still reported but doesn't block it.
  3. `git pull --rebase` (best effort, for the ingest bot's commits), then
     `npm run social:tonight`, regenerated from scratch (today's PNGs and
     caption are deleted first). This is the last step that reads listing
     data, so nothing that changes listings runs after it.
  4. `npm run social:reel`, which only reads the graphic and caption from
     step 3 (it has to come after it), then the notification.
  The gate applies to the 5 PM run too. Keep this order if the script changes;
  an uncommitted edit in `data/` or `docs/` now blocks the day's graphic.
- **Tonight graphic lists every category (user, 2026-10-28).** Karaoke,
  trivia and bingo were on /tonight but missing from the graphic, which showed
  other events only on quiet nights, in small muted rows that no longer fit
  once the week list was full. Now `npm run social:tonight` uses the same
  night as /tonight (the 4 AM rule, recurring dedupe) and shows all of it,
  grouped by category in `CATEGORIES` order: live music, DJ, open mic, then
  trivia, bingo, karaoke, comedy, other events. Other events use full-size
  rows under their own category labels, not "Also tonight", and the caption
  lists every one. Checked against the build for Oct 28 to Nov 7: same
  number of listings each night.
  - Room: music always fits (busy nights still spill onto more images).
    Other events take the room left on the last image. When they don't fit,
    rows are dropped karaoke first, then trivia, bingo, other, comedy (latest
    start first within each), and a "+ N more at 815live.com" line is added.
    Text never shrinks. The last music row leaves room under it for that
    line, so it can move to a new image instead of crowding the line out (Oct
    30: 3 images, all three karaoke nights shown).
  - Quiet nights (under 3 music listings): tonight comes first, all
    categories, then "Coming up" in whatever room is left. If none is left,
    the header reads "Tonight in the 815" instead of "+ Coming up". The
    coming-up list keeps its exclusions: one-off live music only, no weekly
    nights, open mics, jams or DJs.
  - Titles wrap to two lines instead of being cut off ("Reverend Raven & the
    Chain Smokin' Altar Boys"). Rows with a wrapped title are 48 px taller.
    satori measures each title (`measure()` in scripts/social/lib.mjs), so
    pagination knows the real height. Past two lines the title ends in an
    ellipsis (`lineClamp`). The venue line still truncates on one line.
  - Section labels are the category names from `CATEGORY_LABEL` ("Trivia",
    "Bingo", "Karaoke"). Music trivia and music bingo show under Trivia and
    Bingo, as on the site.
- **Daily job runs only on a clean main (user, 2026-10-28).** The morning
  inbox run committed its listings on `other-events`, where the site never
  sees them, because the repo had been left on that branch. Before the inbox
  step, `~/.local/bin/815live-inbox.sh` now checks that the repo is on `main`
  with a clean tree. If not, it skips the whole run (no inbox, no graphic, no
  reel) and sends a critical notification naming the current branch, logged
  in `runs.log`. "Clean" means no changes to tracked files and no untracked
  files in `data/` or `docs/`. Untracked files elsewhere (e.g. a stray
  `.patch` at the root) don't block it. After fixing, rerun with
  `systemctl --user start 815live-inbox.service`.
  - Same day: `other-events` (non-music events, show title disambiguation,
    the tonight graphic changes, the 10-28 inbox run) was finished (tests and
    build passing, no TODOs) and went to `main` in full. The script's
    `git pull --rebase` before the graphic linearized the local merge commit,
    so `main` ended up as a fast-forward to `other-events` (same commits,
    same tree). Any unpushed local merge commit will be flattened the same way.
- **Three calls from the user (2026-10-28).**
  - Open mics at Shattered Saloon (its Thursday "Open Mic & Karaoke Night")
    and Maxine's Social are music: `open-mic`, under Open mic like Murphy's.
    Both were already filed that way pending this answer, so no listing
    changed. The two needs-review items are closed, and CLAUDE.md says not to
    flag them again.
  - Crossroads Blues Society: only their 815-area events are listed (the
    usual coverage rule, Oregon and Freeport included); out-of-area ones are
    skipped. The pending Fri Oct 30 post (hosts Paul Prue and Peter Chase)
    is neither added nor skipped. The screenshot cuts off the venue,
    Crossroads' site loads its events with JavaScript (not readable),
    and a web search found nothing. It stays in `waiting/`, with the rule
    noted in needs-review. Added to CLAUDE.md for inbox runs.
  - Tonight graphic labels: joining artist names with "+" ("The Forty Twos +
    King Falcon") is intentional, even where the site shows an event title
    ("The Forty Twos with King Falcon"). Not a mismatch to fix.
- **Inbox run (scheduled, 2026-10-28 evening).** 16 files (one an exact
  duplicate of another, filed next to it in the Maxine's folder). Published: Mustang's Bar & Grill, South
  Beloit (new venue, 482 Gardner St, from local event listings that agree;
  Census geocoded), "Spooky Movies Trivia" Wed Oct 28, 6:30 PM, a one-off
  `trivia` show. The flyer says "the game always starts at 6:30", but not that
  it's weekly, so no rule; the host company is left out. Mulligan's
  "Helloween" Fri Oct 30 updated from the full flyer: music 7 PM (was 6, the
  door time, now in notes), with Reckless Redemption (new artist), Faith In
  Vain and Lights Out Alaska; Blood & Bone Burlesque named in notes, not as a
  music act; "bring a non-perishable item" left out (no cover stated).
  Re-confirmed, `checked` bumped: Sheez-It at Chrissy's Corner (Oct 31),
  End Fight Scene at Maxine's (Oct 31; still no start time), Murphy's
  Wednesday open mic, Whiskey's Wednesday karaoke. Skipped: Wisconsin Comedy
  Takeover at the Rusty Fox, Sterling, and HitWave 80's at Sundance Saloon,
  Mundelein (out of area); Durand's Halloween on the Square (kids' parade and
  trunk-or-treat); Hot Rod Nellie's Witch's Night Out (costume contest, left
  out on 10-25 too) and blind-draw darts tournament (like the 9-ball
  tournament); the Thanksgiving Eve bar crawl (a bus between bars, no
  entertainment). Waiting: Regal Beagle at "Morts Pub" (second copy, still no
  town) and Rascal's "Bingo for a Cause" Nov 19 (venue unconfirmed, as for
  its Halloween party).
- **Inbox run (scheduled, 2026-10-29).** 15 files. Published: On The Rocks
  (new artist) at Splitter's, Sat Oct 31, 8 PM–midnight (closes that part
  of the Splitter's needs-review item); Marco's Slots (new venue, 7164
  Cherryvale N Blvd, Rockford, from the event page; the Census geocoder only
  matched it as "7164 N Cherryvale Mall Dr", the same block near the mall)
  "Halloween Bangaroo 4", Sat Oct 31, 8 PM, as `dj` (the DJ isn't named);
  Valley Tap, German Valley (new venue, 45 Church St from the bar's own
  flyer, Census geocoded; about 25 minutes west of Rockford, so in area)
  Halloween karaoke Fri Oct 30, 9 PM–midnight (DJ name left out); Whiskey's
  Roadhouse first-Friday open stage Nov 6 and Dec 4, 7:30 PM, `open-mic`
  (PA, drums and bass amp provided, so it's for musicians). The host band
  and the featured act ("12-& lightning", name unclear) are left off.
  Re-confirmed, `checked` bumped: Gang of Martians at the Music Box,
  Rollin' Whiskey at Hot Rod Nellie's and Stereotype at Shattered (Oct 31;
  the last two gained an 8 PM–midnight end time), Murphy's Wednesday open
  mic. Skipped: The Hurricane Project at Johnny's Blitz, Westmont (out of
  area); the Rusty Fox open mic (the Rusty Fox is in Sterling, out of area,
  as on 10-28); The Groove Hotel's band page (no upcoming dates). Waiting:
  Mullarkey's Pistol Whip (no town; the only match is Mount Morris, borderline),
  Mustang's Halloween DJ (no time), On A Roll's open mic (kind not stated),
  Trifecta Trio at Hidden Creek Estates (not a known public venue).
- **Inbox run (scheduled, 2026-10-30).** 7 files. Published: Mister Pink's
  Halloween Show at Grand Avenue Pub, Fri Oct 30, 8 PM–midnight, as
  `live-music` (new artist). The Facebook event's cover photo shows a
  five-piece group, one in a drumsticks shirt, so it's a band, not a DJ.
  That closes the 10-27 Mr. Pink item; the costume-contest prizes are left
  out. The Synergy Band's 2026 schedule graphic and Grand Ave flyer: Sheila's
  Daiquiri Lounge Nov 21 and Dec 12, Screw City Tavern Dec 5 (all 8:30 PM),
  and "Inscape, Rockford" Dec 19, 8 PM, read as Inscape Midtown Collective,
  the only Inscape in Rockford. The Nov 13 Grand Ave show ("Synergy" on the
  pub's cropped calendar) is the same act per the band's own flyer, so it now
  points to `the-synergy-band`. Hard Rock's Nov 28 (adapter-owned) matches.
  "Mothman" renamed to Mothmen (slug `mothmen`): a hand-drawn "Mothmen at
  Shattered, Oct 30th 2026, 8:00 PM" flyer makes two sources against one.
  Re-confirmed, `checked` bumped: Gang of Martians at the Music Box Oct 31
  (gained an 8 PM–midnight end time; still free). Waiting: the Lyran Society
  fish fry with Blind Eye Willis (members-and-friends event, no address),
  New Mill Tap's Halloween karaoke (no date shown), and The Synergy Band's
  Jul 9, 2027 Music on Chicago in Freeport (no location). Nothing skipped.
- **Inbox run (scheduled, 2026-10-30 afternoon).** 5 files. Published: DJ Dez
  (new artist) at Tad's on the Rock, "Halloween Neon Creepy Carnival Party",
  Fri Oct 30, 9 PM–2 AM, as `dj` (the bartender, drink specials and
  costume-contest prizes are left out). Re-confirmed, `checked` bumped:
  Stereotype's Emo Night at Grand Avenue Pub, Nov 14, 8 PM–midnight (band's
  own post). Skipped: "Keys for Kids" dueling pianos at the Sandwich Moose
  Lodge, Sandwich IL (out of area); Brass From The Past at McCormick Place,
  Chicago, Oct 29 (out of area and past). Waiting: a third copy of the Regal
  Beagle "Morts Pub" flyer (still no town).
- **Inbox run (scheduled, 2026-10-31).** 2 files. Published: Katie's Cup
  (new venue, 504 7th St, Rockford, Census-geocoded) Acoustic Open Mic,
  first Thursdays 7–8:30 PM, Sept 2026–May 2027 per the flyer in the
  Facebook event screenshot. `open-mic` because the flyer says acoustic,
  with sound and an acoustic guitar provided. Recurring rules are weekly
  only, so the seven remaining dates (Nov 5, Dec 3, Jan 7, Feb 4, Mar 4,
  Apr 1, May 6; weekdays checked) are separate show files. Host names left
  out. Waiting: New Mill Tap "Open Mic Open Jam" with Monarch Blues Band
  (flyer says only "Friday", no date). Nothing skipped.
