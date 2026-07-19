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
china-april-2026.html An earlier, self-contained trip (still inlines its own copy
                      of the engine; a frozen archive — see below).
```

**The split that keeps everything cohesive:** *design* lives in the shared engine,
*content* lives in each trip's `TRIP` object. Tweaking the look while working on
the upcoming trip means editing `site.css`/`site.js`, and that lands on every
trip, past and future, automatically.

## Adding a trip

**Fast path:** open [`/new/`](https://camerondeath.github.io/travel/new/) (the
"Add a trip" link on the hub), fill in the basics, download the generated
`index.html` into a new `city/` folder, paste the one-line snippet it gives you
into the hub's `TRIPS` array, commit, push.

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
renders it as a **What's on** list and flags anything whose `added` date is
within the last 14 days as **New**. Shanghai uses this. Shape:
```json
{ "updated": "19 Jul 2026", "events": [
  { "title": "…", "when": "28 Oct", "sortDate": "2026-10-28",
    "venue": "…", "kind": "art", "blurb": "…", "url": "…", "added": "2026-07-19" }
]}
```
Refresh it however you like — by hand, or with a scheduled agent that searches
for new events in the trip window, curates, and commits the file. The page just
renders whatever `events.json` currently says.

## Offline (PWA)

`shanghai/` registers a service worker (`sw.js`) so the itinerary works offline.
It precaches the shell **and** the shared `../site.css` / `../site.js` /
`events.json` — a service worker receives fetch events for every request its
controlled pages make, including parent-directory files, so sharing the engine
does not cost offline support. Bump `CACHE_VERSION` in `sw.js` when the shell
changes. To give a new trip offline support, copy Shanghai's `manifest.json` +
`sw.js` + icons and adjust.

## Conventions

- Fonts: Fraunces (display), Newsreader (body serif), Inter (labels).
- Colour + type are CSS variables at the top of `site.css`; light and dark are
  both defined there. Change a token once, it lands everywhere.
- Use em dashes (—), not hyphens, in prose.
