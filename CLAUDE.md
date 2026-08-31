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

## This checkout is shared

A scheduled agent (`shanghai-events-refresh`, Mondays) commits
`shanghai/events.json` in this same working copy. Consequences:

- Don't leave large uncommitted diffs sitting in the tree; commit early or
  branch. If files revert unexpectedly mid-session, check `git log` /
  `git stash list` for the agent's activity before assuming user action.
- Never run `git stash`, `git reset`, `git checkout --`/`git restore`, or
  `git clean` over changes you didn't make. Stage specific files, never
  `git add -A`.
