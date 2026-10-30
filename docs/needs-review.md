# Needs review

Listings and facts that were found but not published because something is
uncertain. Each entry says what was found, where, and what's unclear.
Publish by adding the JSON under `data/` once resolved.

## Music Box: "Tuesday Night Music Club" (Oct 27)

Listed as live music from the venue listing the user pasted ("Hosted by Mossy
Vaughn", free). Unclear whether it's a weekly night, and whether it's a jam or
open session (which would make it `open-mic` and keep it out of the quiet-night
graphic's highlights) or a booked show. The venue site renders its listings in
JavaScript and a web search found nothing. If it's weekly, make it a
recurring rule.

## Best Dam Bar: Halloween Music Bingo, Mon Oct 26

The bar's Facebook post (about 1:27 PM on Oct 26) says "Tonight's Halloween
Music Bingo". No time, and no regular music bingo night is on file, so it
isn't listed.

## Screw City Tavern: Acoustic Fridays and Saturday live music

The venue's events page says acoustic performers play Fridays (October–May)
and bands play Saturdays, with details posted on Facebook only. No times or
performers on the venue site, so not published. Karaoke (every other Thursday, 7–11)
and Name That Tune (Mon 7–9) are published.

## Whiskey's Roadhouse: monthly open stage after December

The host band's Facebook event (2026-10-29 inbox) gives the dates Sept 4,
Oct 2, Nov 6 and Dec 4, sign-up 7:30 PM, so Nov 6 and Dec 4 are published as
one-off `open-mic` shows. Recurring rules are weekly only (a first-Friday rule
would need an `nth` field), so 2027 dates need adding when they're posted.
Weekly karaoke (Wed & Sun, 9 PM) is published.


## Town Hall Lounge: Halloween party, Sat Oct 31

A flyer (inbox, 2026-10-24) says Town Hall Lounge has a Halloween party on
Saturday, October 31, 8 PM to 1 AM, with live music by Sturm & Ricotta (Mark
Sturm and David Ricotta), and that it's part of a pub crawl. Not published:
the flyer gives no town or address, and searches found no "Town Hall Lounge"
in the Rockford area. Needs the venue's location (and a website, if any).
The flyer is in `waiting/`.



## Rue Marché: karaoke Thursday–Saturday

The River District's bars & nightlife page (riverdistrict.com/bars-nightlife/)
says Rue Marché "dominates karaoke on Thursdays, Fridays, and Saturdays". The
bar has no website of its own. Its "Rue-Loween" flyer (2026-10-26 inbox) gives
karaoke Fri Oct 30 and Sat Oct 31, 9 PM–2 AM; those two nights are published as
one-off shows. Whether 9 PM holds every week (and for Thursdays) is unconfirmed,
so the weekly rules still wait for a regular start time.

## District: Tuesday jam night

District's own home page lists a Tuesday "District jams night" and a
Wednesday DJ battle, both with no time. Thursday karaoke is
published (9 PM, from a District flyer the user sent). The events page and
its TicketWeb page had no upcoming shows (2026-10-24).

## Karaoke tips not confirmed (Facebook thread, 2026-10-24)

A "What's Happening in Rockford IL?" group thread the user pasted named these.
None could be confirmed from a source we're allowed to use, so nothing is published:
- **The Filling Station** (New Milford): Fri/Sat 9–2 per commenters; no venue site found.
- **Windsor Pizza Parlor**, **Attitudes Bar & Grill** (Machesney Park),
  **The Office Niteclub** (513 E State St, Sundays), **Rockton Inn**
  (Tue–Fri after 8), the Loves Park food park: no venue source found.

## J&A Karaoke: November schedule

The DJ's flyer is an "October Schedule" (Rock-A-Bago Sun, Benny's Roscoe
Tue/Sat, Benny's @ Nest Thu, Broadway Joe's Fri), so the Rock-A-Bago, Benny's
Roscoe and Broadway Joe's rules carry `"months": [10]` and stop after Oct 31.
Benny's @ Nest's Thursday is weekly per the bar's own "Every Thursday" flyer.
Extend or replace the rules when the November schedule is out.


## Rock and Roll Institute: winter camp show, Sat Jan 2, 2027

The user pasted the group's July post about its summer show (Sun Jul 26, at
Hard Rock; $20 at the door, doors 2 PM). That show is past. The group's site
(rocknrollinstitute.com, robots allows) lists a 2026 Winter Camp, Dec 29 –
Jan 2, ending in a show on Sat Jan 2, 2027 at Hard Rock Live Rockford, with no
showtime or ticket price yet. Publish under hard-rock-casino-rockford once a
time is posted (the Hard Rock adapter may also pick it up from the casino's
event pages). Student bands, so list it as one show with the group as the act.

## From the Facebook "concert" search (2026-10-25)

- **Benefit for Knott Us Band**, Fri Jan 8, 2027, 6 PM, Lyran Society
  (Rockford). Knott Us looks like a Chicago youth blues band, and no address
  for the Lyran Society was found. Needs the hall's address.
- **A Tribute to Elvis by Logan Ramey**, Sun Nov 8, 3 PM, "575 Beloit Rd":
  the paste gives no venue name or town, and the address didn't turn up in
  searches.

## Splitter's Bar & Grill: Oct 30 fourth band

Splitter's is the bar inside Park Lanes, 5318 N 2nd St, Loves Park (venue now
published). Fri Oct 30 "Metal Night" is published from C&L Sound's flyer
(2026-10-26 inbox: music 8 PM, free, 21+): Our Dying Whisper, Sworn to None,
Thorgrim, plus a fourth band whose logo is unreadable (looks like "Ixdaunh"),
so it's marked `lineupPartial`. (Sat Oct 31 On The Rocks is now published,
8 PM–midnight, from the band's Facebook event, 2026-10-29 inbox.) The
October flyer stays in `waiting/`.

## Hot Rod Nellie's: "Halloween Pre-Game with Holly", Fri Oct 30, 8:30 PM

From the bar's events list (user paste; pasted again 2026-10-26, now in
`waiting/2026-10_hot-rod-nellies-events.txt`). It isn't clear whether Holly
is a musician, a DJ or a bartender. Publish as live music if Holly performs.
The same list's Nov 25 "candle bingo & karaoke following" still has no
karaoke start time.

## Broadway Joe's: Halloween party with DJ Karlo, Sat Oct 31 (no start time)

From the user's paste of the Facebook event "Nightmare on Broadway": DJ Karlo
(EJ DJ's), costume contest at 11 PM, 7 hours long. No start time is given, so
it isn't published. Add as a `dj` show once the start time is known.

## District: "Baddies Halloween Bash", Fri Oct 30, 9 PM

From the user's paste of District's Facebook events. The listing doesn't say
whether it's a DJ night, a band or a party, so it isn't published. Add it
(likely as `dj`) once the format is known.

## DJ nights mentioned but not publishable (2026-10-25 sweep)

- **The Office Niteclub** (513 E State St): directory and guide listings
  mention DJs on Friday and Saturday nights; no times and no venue source.
- **Sheila's Daiquiri Lounge**: "DJs on the weekends" appears only in a Rock
  River Current article (blocks Claude).

## Grand Avenue Pub, November: names read from a cropped calendar

Published as read; confirm when there's a second source (the pub's site or
the bands' pages). The calendar image's right edge is cut off through the
Saturday column, so these names may be incomplete:
- **Nov 7 "Shuffle This"**, **Nov 21 "Soul 2 Soul"**: published under those
  names.
- **Nov 13 "Synergy"**: resolved 2026-10-30. The Synergy Band's own flyer
  shows that date and time, so the show now points to `the-synergy-band`. The old
  `data/artists/synergy.json` has no shows left but is still in the repo; the
  scheduled run wasn't allowed to delete it. Delete it.

## Boxcars Pub & Grub (Clinton, WI): Addison Johnson, Wed Oct 28

A screenshot of a post in the "Support The Live Music Experience in Freeport,
IL, Rockford, IL and Beyond!" group (2026-10-26 inbox) says Addison Johnson
plays "The Room" at Boxcars Pub & Grub on Wed Oct 28 at 7:30 PM, with $25
tickets at the bar, online, or at the door. The weekday matches 2026. Not
published: Clinton is about 10 miles east of Beloit, so it's probably a bit
more than 30 minutes from downtown Rockford, a borderline call under the area
rule. Also, the venue's address and ticket link are unverified. The screenshot
is in `waiting/`.

## Mort's Pub: The Regal Beagle, Sat Oct 31, 8–11 PM

A Halloween flyer (2026-10-27 inbox) says "Regal Beagle" plays "Morts Pub" on
Saturday, October 31 (weekday matches 2026), 8–11 PM. The flyer gives no town.
The only nearby match found is Mort's Bar & Grill, 114 S Chicago Ave, Freeport
(Enjoy Illinois listing), a different name. Confirm it's the same place (and
that the band is local) before publishing. The flyer is in `waiting/`. A
second copy came in the 2026-10-28 evening inbox, still with no town; a web
search found no link between the band and Mort's in Freeport. Also in
`waiting/`.

## Rascals Bar and Grill: Halloween party with "The Wolfman", Sat Oct 31, 8 PM–midnight

A screenshot of the bar's Facebook post (2026-10-26 inbox) says live
entertainment by "the one and only Wolfman", 8–12 PM, on Halloween night. The
graphic shows DJ decks, so it's unclear whether Wolfman is a DJ or a
performer. The post gives no town; directories (Superpages, Sirved, BringFido)
list Rascals Bar & Grill at 5223 Torque Rd, Loves Park 61111, but the bar has
no website to confirm it's the same Rascals. No venue record yet. The
screenshot is in `waiting/`.

Also waiting on the venue: **"Bingo for a Cause"** (Christmas for Kids
benefit), Thu Nov 19, 7 PM, at "Rascal's Bar & Grill" (flyer, 2026-10-28
evening inbox; no weekday stated, no town). It would be a one-off `bingo`
show. A Thanksgiving Eve bar-crawl flyer in the same inbox puts Rascals on a
bus route with Ashley's Dirty Martini, Neighbors, Top Dog, Legends, Easy Tiger
and Windsor Pizza Parlor, which supports the Loves Park location but still
isn't the bar's own word. In `waiting/`.


## RPL Nordlof Center: library times vs. Crossroads times

The library calendar lists every Music Off the Rock show at 5 PM (Oct 28 at
5:30 PM), while our entries, from Crossroads Blues Society, say 6 PM with
doors at 5. The `rpl-nordlof` adapter keeps the hand-entered shows and logs
the mismatch each run. Oct 28 (5:30 vs 6:00) is the only one that isn't
simply the door time. The band's own Facebook event (2026-10-27 inbox) says
"Doors at 5pm, Show at 6pm", matching our entry.

## Mary's Market Roscoe: Dec 24 and Dec 31

The venue's list says "Christmas Eve — Holiday Hours" and "New Year's Eve —
Holiday Hours" for those Thursdays, with no performer. Both are in the weekly
rule's `skip` list until the venue says there's music. (Its Dec 5 "Fireside
Jazz Lunch" is at the Rockford cafe, 2636 McFarland Rd, a venue we don't have.)

## Stereotype: Nov 7 HydeOut Bar, Dec 12 Whiskey's, Dec 31 Shattered

The band's Facebook post (2026-10-27 inbox, now in `waiting/`) lists its
dates through New Year's Eve; Oct 31, Nov 14, Nov 21 and Nov 25 are published.
Not published:
- **Sat Nov 7, HydeOut Bar, 8 PM**: no town or address given, and a search
  found no HydeOut Bar in the Rockford area.
- **Sat Dec 12, Whiskey's Roadhouse "Toys for Tots" show**: Stereotype opens
  ("early for us"), so other acts follow; no start time given.
- **Thu Dec 31, Shattered Saloon, NYE masquerade party**: no start time given.

## Grand Avenue Pub: Sensations, Tue Oct 27 (no time)

A screenshot of a "Stuff to do in Rockford, IL" group share (2026-10-27
inbox) shows a Facebook event "Sensations at Grand Avenue Pub", Beloit, Tue
Oct 27, with no time. A Tuesday is unusual for the pub, and the event page
wasn't opened. Not published; past once today is over. In `waiting/`.

## Rockton Inn: "Hard Dance Halloween 1.0", "This Saturday", 9 PM–1 AM

The bar's flyer (2026-10-27 inbox) gives 102 E Main St, Rockton; hardstyle,
techno and EDM DJ night; 9 PM–1 AM; no cover. It says "This Saturday" with no
date and the file has no post date, so it could be Oct 31 or the Saturday
before (Oct 24, past). The DJ isn't named. Publish as a `dj` show on Oct 31
(and create the venue, Census geocoded) if the date is confirmed. In
`waiting/`.

## Buchanan St Pub (Belvidere): Halloween Party, Sat Oct 31, 8:30 PM

The pub's flyer (2026-10-27 inbox) gives 111 Buchanan St, Belvidere,
10-31-2026, 8:30 PM, "Halloween Party", and nothing about music, a DJ or
karaoke. Publish if there's entertainment we list (and create the venue). In
`waiting/`.

## Genoa Veterans Home: Polly Says, Sat Oct 31, 7:30–10:30 PM (area call)

A Facebook event screenshot (2026-10-27 inbox): Halloween costume party with
live music by Polly Says - A 90s Experience (event also by Tim Logsdon), at
Genoa Veterans Home, 311 S Washington St, Genoa IL. Genoa is past Belvidere
in DeKalb County, roughly 35–40 minutes from downtown Rockford: borderline
under the 30-minute rule, like Clinton WI above. In `waiting/`.

## Outreach: The Music Box (DICE)

The Music Box's listings come only from its DICE event widget (promoter "Music
Box of Rockford LLC"). Automating them needs the venue's (or DICE's)
permission to use the DICE partner feed with the venue's widget key; DICE's
sites block Anthropic agents, so we don't fetch them. Until then, Music Box
shows are entered by hand from pastes. Ask the venue; see venue-sources.md.

## Crossroads Blues Society: Friday evening, Oct 30 (cropped)

A screenshot (2026-10-28 inbox) cuts off a Crossroads Blues Society post
(by Peter Chase) at its top: "Friday evening 10/30/26", hosts Paul Prue and
Peter Chase, special guests Parker Wheeler and Ken Brierley. The venue, time
and cover are cut off, and it isn't one of the Music Off the Rock dates.
Per the user (2026-10-28), Crossroads events are listed only when they're
in the 815 area. The venue is what decides it, and it's cut off. Crossroads'
own site loads its events with JavaScript (nothing readable without a
browser), and a web search found nothing. Publish if the full post shows a
local venue; skip it if not. In `waiting/` (the same screenshot also
re-confirmed Cahoots' Decades of Rock).

## Mullarkey's Bar & Grill: Pistol Whip, Sat Oct 31, 7 PM (venue town unconfirmed)

The bar's "Winnerween" flyer (2026-10-29 inbox): live music by Pistol Whip
starting 7 PM on Saturday, October 31 (weekday matches 2026), plus hourly
prize drawings. The flyer gives no town. The only match found is Mullarkey's
Bar & Grill, 12 W Main St, Mount Morris (Enjoy Illinois listing). Mount
Morris is just north of Oregon, about 35 minutes from downtown Rockford,
so it's a borderline area call even if it's the same bar. Publish (new venue
and artist) if both check out. In `waiting/`.

## Mustang's Bar & Grill: Halloween Bash with a DJ, Sat Oct 31 (no time)

The bar's flyer (2026-10-29 inbox) gives October 31, "Sounds by" a DJ,
482 Gardner St, South Beloit. No start time, so it isn't published. Add as a
`dj` show once a time is known. In `waiting/`.

## On A Roll Spirits and Slots (Machesney Park): Open Mic Night, Thu Oct 29

The bar's flyer (2026-10-29 inbox) gives 7007 N 2nd St, Machesney Park;
Thursday, October 29 (weekday matches); sign-up 6:30 PM, show 7 PM;
"10 spots / 3 winners". It doesn't say whether it's for musicians, comics or
anyone, so the category is unclear and it isn't published (no venue record
yet). Past after tonight; if it turns out to be a regular music open mic,
add a rule. In `waiting/`.

## Trifecta Trio at "Hidden Creek Estates", Thu Oct 29, 5:30–8:30 PM

The band's Facebook post (2026-10-29 inbox) says they play Hidden Creek
Estates tonight. The name sounds like a residential or senior community,
not a public venue, and no address or town is given. Not published (no
artist or venue record). Past after tonight. In `waiting/`.

## Lyran Society Fish Fry: Blind Eye Willis and the Blue Notes, Fri Oct 30, 7–10 PM

A Crossroads Blues Society / Lyran Society flyer (2026-10-30 inbox): Blind
Eye Willis and the Blue Notes at the Lyran Club, Friday Oct 30 (weekday
matches 2026), 7–10 PM, with a fish fry before. Not published: the flyer
says it's "open to all Lyran and Crossroads members, their families and
friends", so it may not be a public show, and the Lyran Society's address
is still unconfirmed (see the Knott Us benefit item above). It may also be
the event in the cropped Crossroads "Friday evening 10/30/26" post. Past
after tonight. In `waiting/`.

## New Mill Tap (Rockford): Halloween karaoke, date not shown

The bar's Facebook post (screenshot, 2026-10-30 inbox) shows a Halloween
Party flyer: costume contest 6–8 PM, karaoke 7–11 PM, 6935 11th St,
Rockford. The visible flyer and post text give no date (the post is cut off
at "See more"), so it could be Fri Oct 30 or Sat Oct 31. No venue record
yet (address from the flyer; Census geocode it when adding). Add as a
`karaoke` show once the date is known. In `waiting/`.

## The Synergy Band: Music on Chicago, Freeport, Fri Jul 9, 2027, 8 PM

The band's 2026 schedule graphic (2026-10-30 inbox) lists "Music on Chicago,
Freeport IL, showtime 8:00 PM" for Jul 9, 2027 (a Friday). Freeport is in
area, but "Music on Chicago" looks like a downtown series, not a venue with
a known address. Publish once the location is confirmed. The graphic's other
upcoming dates are published (Nov 13, 21, 28, Dec 5, 12, 19). Left out:
private events (Nov 12 at Ho-Chunk, Apr 24, 2027 wedding) and Jun 19, 2027
"Rising Queens Juneteenth" (no place or time). In `waiting/`.
