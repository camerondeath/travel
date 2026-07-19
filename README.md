# Trip notes

Personal, editorial travel itineraries — [camerondeath.github.io/travel](https://camerondeath.github.io/travel/).
Static HTML/CSS/JS, no build step, hosted on GitHub Pages.

## Layout

```
index.html            The hub. Lists every trip with a live status pill
                      (In N days · Day X of Y · Past). Edit the TRIPS array
                      to add a card.
site.css / site.js    The shared engine: masthead, plane essay, day index,
                      "Now" strip, day chapters, bookings tracker, back-pocket,
                      sandbox, and weather. Data-driven from a TRIP object.
_template/            Copy-me skeleton for a new trip (uses the shared engine).
                      The underscore keeps it out of the published site.
melbourne/            A trip built on the shared engine (site.css + site.js).
shanghai/             The flagship. Self-contained (inline CSS+JS) because it
                      ships as an offline PWA — see note below.
china-april-2026.html An earlier self-contained trip.
```

## Adding a trip (the fast path)

1. Copy `_template/` to a folder named for the city, e.g. `tokyo/`.
2. Open `tokyo/index.html` and fill in the `TRIP` object (every placeholder is
   marked `FILL IN`). The engine reads it — no other code to touch.
3. Add one card to the `TRIPS` array in `index.html`:
   ```js
   { date: "2027-05-01", end: "2027-05-05", meta: "Japan · 2027",
     title: "Tokyo <em>2027</em>", desc: "…", dates: "1–5 May 2027",
     href: "./tokyo/", placeholder: false }
   ```
   `date` is the trip start (drives sort + the countdown); `end` closes the
   "Past / On now / Upcoming" logic. Keep `date` and the trip page's
   `meta.tripStart` on the same day so the hub and the page agree.
4. Commit and push. Done.

A trip built this way inherits every future engine improvement automatically,
because it links `../site.css` and `../site.js` rather than copying them.

## The Shanghai exception (offline PWA)

`shanghai/` inlines its CSS and JS instead of linking the shared files. That's
deliberate: it registers a service worker (`shanghai/sw.js`) so the itinerary
works offline on the trip, and a service worker can only cache files inside its
own folder — `../site.css` would be out of scope. So the flagship is a frozen,
self-contained snapshot of the engine plus a `manifest.json` and icons.

If a future trip also needs offline use, copy the `shanghai/` folder instead of
`_template/`, then swap its `TRIP` data, `manifest.json`, `<title>`, and bump
`CACHE_VERSION` in `sw.js`. Otherwise prefer the shared-engine template — it is
smaller and stays in sync on its own.

## Conventions

- Fonts: Fraunces (display), Newsreader (body serif), Inter (labels).
- Colour + type live entirely in CSS variables at the top of `site.css`; light
  and dark are both defined there. Change a token once, it lands everywhere.
- Use em dashes (—), not hyphens, in prose.
