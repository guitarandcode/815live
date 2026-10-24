# Needs review

Listings and facts that were found but not published because something is
uncertain. Each entry says what was found, where, and what's unclear.
Publish by adding the JSON under `data/` once resolved.

## The Music Box: full schedule (Oct 27 – Dec 12)

themusicboxrockford.com renders its calendar from DICE. dice.fm's robots.txt
disallows Anthropic's crawlers, so these weren't collected automatically; a
batch taken from DICE's venue page before that rule was applied was reverted.
**To publish:** paste the schedule from themusicboxrockford.com (or DICE) and
enter it by hand, or approve a per-venue exception. About 20 shows are listed,
including weekly-ish "Karaoke/Open Mic Night" Tuesdays (Nov 3, Nov 17).

## Screw City Tavern: Acoustic Fridays and Saturday live music

The venue's events page says acoustic performers play Fridays (October–May)
and bands play Saturdays, with details posted on Facebook only. No times or
performers on the venue site, so not published. Weekly karaoke (Thu 7–11) and
Name That Tune (Mon 7–9) are published.

## Whiskey's Roadhouse: monthly open mic

The venue's home page says "Open Mic night is the First Friday of every
month" with no start time. Not published: no time, and recurring rules are
weekly only (a first-Friday rule would need an `nth` field). Weekly karaoke
(Wed & Sun, 9 PM) is published.

