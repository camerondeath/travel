# Trip notes

Personal, editorial travel itineraries — [camerondeath.github.io/travel](https://camerondeath.github.io/travel/).
Static HTML/CSS/JS, no build step, hosted on GitHub Pages.

## How it fits together

Every trip page is a thin shell plus a `TRIP` data object. All the behaviour and
all the design live in **one shared engine** — `site.css` + `site.js` — which
every trip links. Change the engine once and every trip updates together
(masthead, plane essay, day index, "Now" strip, day chapters, bookings tracker,
"What's on" events, back pocket, sandbox, weather).

```
index.html            The hub. Lists every trip with a live status pill
                      (In N days · Day X of Y · Past). Edit the TRIPS array
                      to add a card, or use the generator (below).
new/                  "Add a trip" generator — a form that builds a ready-to-edit
                      trip shell + the hub snippet. Linked from the hub.
site.css / site.js    The shared engine. Data-driven from each page's TRIP object.
_template/            Copy-me skeleton for a new trip (what the generator emits).
                      The underscore keeps it out of the published site.
shanghai/             The canonical upcoming trip. Runs on the shared engine and
                      ships as an offline PWA (manifest.json + sw.js + icons +
                      events.json).
melbourne/            A past trip on the shared engine.
china-april-2026.html An earlier trip, also on the shared engine (it sits at the
                      repo root, so its paths are site.css / site.js, no ../).
```

Every page is on the shared engine, so there is exactly one place to change how
the site looks. The render functions tolerate a page omitting a section (China
April has no sandbox, for instance) — they no-op when their container is absent.

**The split that keeps everything cohesive:** *design* lives in the shared engine,
*content* lives in each trip's `TRIP` object. Tweaking the look while working on
the upcoming trip means editing `site.css`/`site.js`, and that lands on every
trip, past and future, automatically.

## Adding a trip

**Fast path:** open [`/new/`](https://camerondeath.github.io/travel/new/) (the
"Add a trip" link on the hub). Search for the cities — add as many as the trip
covers — and pick the dates. Country, timezone, coordinates, folder name, slug
and the hub card are all derived from the city lookup (Open-Meteo geocoding, the
same provider as the weather), so there is nothing else to type. Download the
generated `index.html` into the new folder, paste the one-line snippet into the
hub's `TRIPS` array, commit, push. The first city sets the timezone and the
weather point.

**By hand:** copy `_template/` to `city/`, fill in the `TRIP` object (placeholders
are marked `FILL IN`), then add the hub card:
```js
{ date: "2027-05-01", end: "2027-05-05", meta: "Japan · 2027",
  title: "Tokyo <em>2027</em>", desc: "…", dates: "1–5 May 2027",
  href: "./tokyo/", placeholder: false }
```
`date` is the trip start (drives sort + countdown); `end` closes the
Past/On-now/Upcoming logic. Keep `date` and the trip page's `meta.tripStart`
on the same day so the hub and the page agree.

## "What's on" — the events feed

A trip can carry an `events.json` and add a `#site-events` section; the engine
renders it as a **What's on** feed and flags anything whose `added` date is
within the last 14 days as **New**. Shanghai uses this. Shape:
```json
{ "updated": "24 Jul 2026", "events": [
  { "title": "…", "when": "evening", "sortDate": "2026-10-28",
    "start": "2026-10-28", "end": "2026-10-28",
    "venue": "…", "kind": "music", "blurb": "…", "url": "…", "added": "2026-07-19" }
]}
```
The layout splits on `start`/`end` (ISO dates; either may be omitted for an
open-ended run — no dates at all means "on the whole time"):

- An event covering **most of the trip** (60%+ of the window) renders under
  **Running throughout** — exhibitions, permanent shows, festivals.
- A **short run** slots into a **day-by-day calendar** of the trip window,
  under its first in-window day. Every trip day gets a row, so the days with
  nothing found yet stay visible — they're the gaps a refresh should aim at.
  `when` is the display label; for one-day events use a time-ish label
  ("evening", "8 pm"), since the calendar already shows the date.

**The list is full-then-pruned, not opt-in.** Every find is shown; the × on a
row hides it into a "Hidden (N)" disclosure (localStorage, per trip slug) where
it can be restored. Refresh the file however you like — by hand, or with a
scheduled agent that searches multiple sources for events in the trip window
and commits the file.

**Nothing is ever lost to a refresh.** Four layers, deliberately:

1. **Entries are never deleted, only archived.** A listing that has ended gets
   `"archived": true` (plus `archivedOn`) instead of being removed.
2. **Archived entries stay on the page**, behind an "Earlier finds (N)"
   disclosure under the live list — muted, but one tap away.
3. **Hiding is local and reversible** — a hidden entry sits in the "Hidden"
   disclosure, never leaves the file, and restores with one tap.
4. **Git history** holds every past version of `events.json`, so even a bad
   write is recoverable with `git log -p -- shanghai/events.json`.

The weekly agent is instructed never to delete, never to rewrite an existing
entry's `added` date or blurb, and to verify the entry count hasn't decreased
before committing. To correct a wrong entry it archives it and adds a new one.

## Offline (PWA)

`shanghai/` registers a service worker (`sw.js`) so the itinerary works offline.
It precaches the shell **and** the shared `../site.css` / `../site.js` /
`events.json` — a service worker receives fetch events for every request its
controlled pages make, including parent-directory files, so sharing the engine
does not cost offline support. Bump `CACHE_VERSION` in `sw.js` when the shell
changes. To give a new trip offline support, copy Shanghai's `manifest.json` +
`sw.js` + icons and adjust.

## Printing

`@media print` in `site.css` opens every collapsed day, panel and back-pocket
group, drops the interactive chrome (chips, scratchpad, toggles), and prints map
and booking links with their URLs spelled out — so a trip can be carried on
paper without losing the addresses.

## Conventions

- Fonts: Fraunces (display), Newsreader (body serif), Inter (labels), served
  from `fonts/` as variable woff2 with `font-display: block` — text isn't painted
  until the real font is ready, so nothing resizes on load, and there's no
  dependency on Google Fonts (blocked in mainland China). See the note at the
  top of `site.css` before changing any of that.
- Colour + type are CSS variables at the top of `site.css`; light and dark are
  both defined there. Change a token once, it lands everywhere.
- Use em dashes (—), not hyphens, in prose.
