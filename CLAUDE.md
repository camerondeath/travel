# Working in this repo

Static site, no build step, deployed by pushing `main` (GitHub Pages, ~1 min to
deploy, then served with `cache-control: max-age=600`). Read README.md for the
architecture; the short version:

- **Design lives in the shared engine** (`site.css` + `site.js`); **content
  lives in each trip page's embedded `TRIP` object**. Never fork engine
  behaviour into a single trip page.
- Engine changes land on every page. Before pushing one, check `shanghai/`,
  `melbourne/`, `china-april-2026.html` and `_template/` still render — the
  render functions must no-op when a page omits a section.
- `shanghai/` is a PWA. **Any change to `site.css`, `site.js` or the shanghai
  page requires bumping `CACHE_VERSION` in `shanghai/sw.js`**, or returning
  visitors keep the old shell.
- **Changing a day's events means re-reading that day's essay.** The `essay`,
  `teaser`, `title` and `arc` are prose written *about a specific plan*. Move a
  stop, cut one, or add one, and the intro copy above it is now describing a day
  that no longer exists. This has bitten repeatedly: Thursday ran for months with
  an essay about home cooking and Lan Xin, a restaurant that had been cut from the
  day; Wednesday's essay pitched M50 galleries after they were removed. After any
  schedule change, check the day's essay AND both neighbours for cross-references
  ("tomorrow ends at…", "unlike yesterday…"), then check the back pocket and
  `events.json` blurbs for the same. If the essay's argument was built on the thing
  you removed, rewrite the essay; do not just delete the event.
- **Essays and notes are different registers.** The `essay`/`teaser`/`plane` prose
  follows the long-form voice spec (no em dashes there, despite the general
  convention below). A `note` on an event is logistics with a reason attached:
  address, how to get there, hours that matter. Notes must not reach for aphorism;
  the thinking belongs in the essay.
- `shanghai/events.json` is append/archive only — entries are never deleted,
  only `"archived": true` (the listing ended) or `"hidden": true` with a short
  `"hiddenNote"` (nobody wanted it). Don't "clean it up", and **never un-hide
  an entry or re-add it under a new key**: a hide is a decision, and the weekly
  sweep re-offering something already rejected is the whole reason the flag
  exists. The × on a row is the local, per-browser version of the same thing.

## The verification pass

**Facts on these pages go stale silently.** One audit (2026-09-06) found seven wrong
opening times, closed days and addresses on the Shanghai page, a restaurant that had
shut five months earlier while still holding a 9:15am slot, and a gallery whose show
closed the day before the visit. None announced itself.

So run a verification pass on any trip page whose dates are still in the future,
periodically and not only when asked — monthly while a trip is months out, weekly
inside the final month. A cloud routine does this every Monday morning, NZ time
(see "Routines" below). **Verify against live sources, never against the page**;
the page is what is being tested.

What the pass covers, in order of how much it costs to get wrong:

1. **Is it still open at all?** Restaurants close. Check every scheduled venue.
2. **Opening hours and closing day**, against the venue's own site where one
   exists. Confirm the specific weekday the itinerary uses it on, not the general
   hours. A place open "daily" can still have a lunch service that ends at 2.
3. **Exhibitions and runs.** Anything with an end date: confirm it is still on
   for that day. A show that closes the day before is the same as a closed venue.
   Where a run ends during the trip, say so and put the visit on a day inside it.
4. **Addresses.** Where two or more circulate, resolve it or say plainly that it
   is unresolved. Do not quietly pick one.
5. **Booking state.** `state: "open"` renders a **"To book"** badge and counts in
   the progress bar, so it must correspond to a real ledger entry and a real
   action. Two museums carried it while their own notes correctly said no booking
   was needed. An open booking's `due` date counts down in the ledger and opens
   the group inside a week: check it is still the real day to act (tickets on
   sale, last safe day), and keep it in step with the booking-window reminder.
6. **Timings and transport.** Meals against the traveller's own preference, walks
   against the walking rule, and car estimates against any deadline behind them.
   A stop written in another clock (a flight out of NZ, a day spent at home)
   needs `tz` on the stop or the day, or the Now strip places it hours out.
7. **The `events.json` feed.** Part of the pass, not a separate job. Every week,
   work the whole events source list below — not one or two of them — for what
   is new, what has moved, and what has quietly ended, following "What belongs
   in the feed". Then reconcile the feed with the days: collisions (three
   concerts against a booked dinner) and near-misses (a market that ends before
   the day reaches its neighbourhood).

Fix what is unambiguous. **Anything that changes what a day is about is the
owner's call, not the agent's** — surface it and ask. Removing a stop means
rewriting that day's essay; see the rule above.

**Surfacing is not a shrug.** When a find is better than what a day currently
holds, or a show closes just before the day that would have used it, say what
the swap would cost: what he gains, what he gives up, and what else moves with
it (the essay, the neighbours, the booking). A flagged conflict with no tradeoff
attached makes him do the work twice.

Sources that work, and ones that do not:

- `rachelgouk.com` (Nomfluence) carries real opening hours per venue under
  `/listings/<slug>/`, and flags closures. Fastest first stop for restaurants.
  Its sitemaps (`/post-sitemap1..5.xml`, `/listdom-listing-sitemap1..3.xml`) list
  everything it covers.
- Museum and gallery sites are authoritative for hours and runs, and often the
  only place a run's end date appears.
- **`guide.michelin.com` blocks WebFetch and the in-app browser**, but `curl`
  with a desktop browser user-agent gets through (verified 2026-09-13). The
  address and the award are in the HTML it returns; the opening hours are
  rendered client-side and are not. Hours still have to come from elsewhere.
  It is not dependable: later that same day the same request came back HTTP
  202 with an empty body (a bot check). When it does, take the address and
  hours from Nomfluence and do not claim a current award.
- Sunrise and sunset in prose must match what `sunTime()` in `site.js` computes
  for that ISO date; run the function rather than searching for the time.

For `events.json`, the feed is only as good as the list below, and it is not a
one-stop job. Work all of it, every week, for dates inside the trip window:

- **`smartshanghai.com`** is the workhorse and the only one that is properly
  queryable: `/events/<category>/?date=YYYY-MM-DD` really does filter by date.
  Categories worth sweeping: exhibitions, concerts, livemusic, stage, musicals,
  festivals, comedy, nightlife, markets, activities. Two traps. Every category
  page also renders an "Ongoing" promo block that repeats on *every* date, so a
  hit is only a hit if the slug appears on some dates and not others. And the
  "Daily until Sep 20" strings on the cards go stale badly; confirm end dates at
  the venue. Its **Shanghai Jazz Guide** article is the standing jazz roster.
- **`artsbird.com`** is the arts festival's own site, and the festival is the
  biggest thing in the October window. Use `/en` for English and
  `/en/calendar/2026-10`, whose page payload carries the full dated programme
  with ISO dates even though the rendered calendar is client-side. Section pages
  paginate client-side and cannot be walked with curl.
- **`dancereflections-vancleefarpels.com`** co-presents a dance strand inside
  the festival and publishes exact dates that no general listing carries. The
  kind of source that only turns up if you follow a performer's name outward.
- **`english.shanghai.gov.cn`** posts a monthly "exhibitions and performances in
  <month>" roundup plus a Cultural Performances feed. Official and in English.
- **Venue primaries** for anything with an end date: Power Station of Art,
  `museumofartpd.org.cn`, Fotografiska Shanghai, `wbmshanghai.com`, Rockbund,
  `hiveart.cn`, `shcstheatre.com`.
- **The corners**: `shanghaiconcerts.com` (classical and recitals, English, with
  venue and date), `247tickets.com` (English ticketing), `e-flux.com/announcements`
  (institutional art openings, often ahead of local listings), and
  `shanghaitourism.org`'s festivals calendar.
- Do **not** use `timeoutshanghai.com`; it is dormant and its content is years
  old. And `shanghaijazz.com` is a restaurant in Madison, New Jersey.

**What belongs in the feed.** The page is a full list Cameron prunes, so be
generous with coverage and strict with facts: a wrongly dated find is worse than
a gap.

- **Only what is on inside the trip window.** Confirm a run's real closing date
  before leaving `end` off. "Reinventing Landscape" was once logged open-ended,
  rendered as running throughout, and in fact shut six days before arrival.
- **Wordless or English-accessible.** Cameron does not speak Mandarin. Music,
  dance, visual art, food and markets need no language. Mandarin-only theatre,
  talks and stand-up belong only when the company or the building is the reason,
  and then the blurb says so.
- **Not all galleries, not all evenings.** Keep art shows to about a third of a
  week's additions, and look for daytime finds (markets, matinees, walks,
  tastings) as well as evening ones.
- **No sport. Comedy is not Cameron's thing:** leave existing comedy entries
  alone, but do not spend a week's research hunting for more.
- **Empty days first.** The calendar shows every trip day; the ones with nothing
  dated are where the search should start.
- **Mechanics.** Dedupe by title and by URL against every entry, live, archived
  and hidden. `added` is the day of the find and is never rewritten. Before
  committing, check the file parses and the entry count did not go down. Field
  meanings live in the file's own `note` and in README.md.

## Routines, and where each one lives

There are two kinds, and they are not visible from the same place. **Cloud
routines** (claude.ai/code/routines) run on Anthropic's servers whether or not
Cameron's Mac is on. **Desktop scheduled tasks** run through the Claude app on
the Mac, only when it is running, and a cloud session cannot list them at all.
On 2026-09-13 a cloud session decided the events agent had been deleted because
it was missing from the cloud list. It was a desktop task, still enabled, and
three of its last four runs had stopped at the first shell command, apparently
waiting for an approval nobody was there to give, while still being marked
"succeeded". Check both lists before concluding anything about a routine.

As of 2026-09-13:

- **Travel site - weekly pass** (cloud, Monday mornings NZ time): the
  verification pass above, events feed included. The only scheduled job that
  writes to this repo.
- `shanghai-events-refresh` (desktop): **paused**, superseded by the weekly
  pass. Its instructions predate the `hidden` flag and the current source list,
  so do not switch it back on as it stands.
- `shanghai-booking-window` (1 Oct) and `shanghai-pretrip-check` (19 Oct)
  (desktop, one-off): reminders that quote the plan. When a booking changes, a
  session on the Mac should update them too; a cloud session cannot.

Other sessions push to the same `origin/main` at any time:

- `git pull` before starting work, or the first push may be rejected as behind.
- If a pull conflicts on `shanghai/events.json`, merge both sides. The file is
  append/archive only (see above), so a conflict means combining entries —
  never resolve it by picking one version wholesale.
- Commits titled "Refresh Shanghai events feed (<date>)" are the retired events
  agent, not lost work of yours.

## Committing and pushing

Cameron has given standing authorisation to commit and push without asking.
When a change is complete and coherent, land it — do not leave finished work
sitting uncommitted, and do not ask permission first.

- **Push means deploy** (GitHub Pages, ~1 min). "Complete" therefore means the
  affected pages still render, and `CACHE_VERSION` in `shanghai/sw.js` is
  bumped if `site.css`, `site.js` or the shanghai page was touched.
- Pull before starting work; the weekly pass pushes on Monday mornings, and
  other sessions push whenever.
- Stage specific files. Never `git add -A`, and never destroy work you did not
  make.
- Still stop and ask before anything irreversible: history rewrites, force
  pushes, deleting files or events, or anything that would lose data.
- **This repo is public** (`camerondeath/travel`, confirmed 2026-09-06), and so
  is every past revision of it. **Never commit a booking code, PIN, order
  number or phone number.** A `ref` holds a pointer to where the booking lives
  ("In the GetYourGuide app", "Collection code in email"), never the value.
  Two Shanghai entries broke this rule and were stripped on 2026-09-06; they
  are still in the history and cannot be removed without a force push.

## A UX or structural change lands on every trip page

Editorial copy is per-trip and stays that way: rewriting a Shanghai essay does not
oblige you to touch Melbourne. **Anything structural or interactional does.** If a
change alters how a page is used or read rather than what it says, apply it across
`shanghai/`, `melbourne/`, `china-april-2026.html` and `_template/` in the same
commit, so the site stays one thing.

That includes: a new or renamed section, a change to how a section is ordered or
labelled, a new control or affordance, a change to what a field means, and any
markup a page must carry for an engine feature to appear.

The template is the one people forget. A structural change that never reaches
`_template/` means the next trip is born already inconsistent, and the generator in
`new/` emits the same stale shape.
## Claude Code session practices (context and long-running work)

- Redirect script/command output to a log file and read a summary, not the raw output:
      command_here > some_log.log 2>&1
      tail -20 some_log.log
  Full stdout/stderr otherwise burns context fast, and this file is what survives
  compaction intact - instructions given only in conversation can be lost, so anything
  load-bearing belongs here.
- Don't re-read files already in context this session; grep for lookups instead.
- For a task that can run several turns unattended, use the native `/goal` command
  rather than a manual retry loop:
      /goal <condition Claude's own output can prove, e.g. "shanghai/events.json
      validates as JSON and the weekly source list has been worked">
  Bound it if needed: "... or stop after 20 turns". It self-clears on: condition met,
  judged impossible, an auth/credit failure, or a context overflow compaction can't
  fix - with a reason printed either way.
- For headless or scheduled runs (e.g. an events-refresh agent):
      claude -p "/goal ..." --max-turns 40 --max-budget-usd 5.00 \
        --output-format json > result.json 2> claude.err
  `--max-turns` and `--max-budget-usd` are real ceilings - set them to the cost of
  the mistake you can tolerate.
- If launching in the background with `nohup`, always pipe from `/dev/null`, or
  `claude -p` will wait ~3s for stdin, get nothing, and exit with an empty log and
  no obvious error:
      nohup claude -p "..." < /dev/null > run.log 2>&1 &
- Prefer `--permission-mode auto` over `--dangerously-skip-permissions` for
  unattended runs - a classifier reviews each tool call and blocks destructive
  actions instead of skipping review entirely.
- Running several things in parallel: `claude agents` shows every running, blocked,
  and done session in one dashboard instead of separate terminal windows.
