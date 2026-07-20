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
