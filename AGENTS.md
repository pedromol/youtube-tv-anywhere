# agents.md — YouTube TV Anywhere

Purpose: browser extension that forces `youtube.com/tv` to report a smart-TV
`User-Agent` so a phone can remote-control YouTube on desktop (cast / "watch on
TV"). Firefox (MV3) uses blocking `webRequest`; Chrome (MV3) uses
`declarativeNetRequest` with a generated `rules.json`.

## Key files

| File | Role |
|---|---|
| `src/config.js` | Single source of truth: `TV_USER_AGENT`, `TV_PAGE_PATTERN`, `TV_PAGE_URL_FILTER` |
| `src/background.js` | Firefox-only User-Agent rewrite via `webRequest.onBeforeSendHeaders` |
| `manifests/base.json` | Fields common to both browsers |
| `manifests/firefox.json` | Firefox: `webRequestBlocking`, background script, gecko ids/min versions |
| `manifests/chrome.json` | Chrome: `declarativeNetRequest` permission + `rules.json` resource |
| `scripts/build.mjs` | Dependency-free build: merges manifests, derives `host_permissions` from `src/config.js`, generates `rules.json`, copies `src/` + `assets/` to `dist/<browser>/` |
| `package.json` | Scripts: `build`, `clean`, `check` (syntax), `test` (node --test) |

## Commands

- `npm run build` — generates `dist/firefox` and `dist/chrome`
- `npm run clean` — removes `dist/`
- `npm run check` — `node --check` on all scripts
- `npm test` — `node --test` (runs `*.test.js`)

## Build invariants

- `dist/` is generated, never versioned; no signed artifact (`META-INF/`) is
  kept in the repo.
- User-Agent and `youtube.com/tv` scope live only in `src/config.js` — changing
  them elsewhere diverges Firefox and Chrome behavior.

## Loading for development

Firefox: `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on" →
`dist/firefox/manifest.json`. Distribute as `.xpi` (gecko `id` already set).

Chrome: `chrome://extensions` → developer mode → "Load unpacked" →
`dist/chrome/`.

## Usage flow

1. Open `https://youtube.com/tv`, settings → "Link with TV code".
2. Mobile YouTube app: Settings > Watch on TV > Enter TV code.
3. Taps on the phone play in the browser window.

If it breaks: `youtube.com/tv` Settings > Linked devices → "unlink all devices",
then restart the mobile app and repeat.

## When editing

- Prefer editing `src/config.js` for User-Agent/scope changes; regenerate
  Chrome's `rules.json` via `npm run build`.
- Keep `manifests/` in sync: base fields in `base.json`, browser differences in
  their own file.
- Run `npm run build && npm run check` after any change.
- Tests: `npm test`; add cases under the existing `*.test.js` convention only
  for uncertain edge behavior.
