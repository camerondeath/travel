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
  only `"archived": true`. Don't "clean it up".

## The remote is shared; this checkout is not

A scheduled agent (`shanghai-events-refresh`, Mondays 08:06) refreshes
`shanghai/events.json`. It works in its own clone (`../travel-events-agent`)
and never touches this checkout — but it pushes to the same `origin/main`.
Consequences:

- This checkout falls behind on Mondays. `git pull` before starting work, or
  the first push will be rejected as behind.
- After a pull its commits appear in `git log` here as "Refresh Shanghai events
  feed (<date>)". That is the agent, not lost work of yours.
- If a pull conflicts on `shanghai/events.json`, merge both sides. The file is
  append/archive only (see above), so a conflict means combining entries —
  never resolve it by picking one version wholesale.

## Committing and pushing

Cameron has given standing authorisation to commit and push without asking.
When a change is complete and coherent, land it — do not leave finished work
sitting uncommitted, and do not ask permission first.

- **Push means deploy** (GitHub Pages, ~1 min). "Complete" therefore means the
  affected pages still render, and `CACHE_VERSION` in `shanghai/sw.js` is
  bumped if `site.css`, `site.js` or the shanghai page was touched.
- Pull before starting work; the events agent pushes on Mondays.
- Stage specific files. Never `git add -A`, and never destroy work you did not
  make.
- Still stop and ask before anything irreversible: history rewrites, force
  pushes, deleting files or events, or anything that would lose data.

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
