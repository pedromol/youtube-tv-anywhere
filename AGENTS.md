# agents.md — YouTube TV Anywhere

Purpose: browser extension that forces `youtube.com/tv` to report a smart-TV
`User-Agent` so a phone can remote-control YouTube on desktop (cast / "watch on
TV"). Firefox (MV3) uses single `manifest.json` with content script for
visibility override and webRequest API for header rewriting.

## Key files

|File|Role|
|-|-|-|
|`src/config.js`|Single source of truth: `TV_USER_AGENT`, `TV_PAGE_PATTERN`, `TV_PAGE_URL_FILTER`|
|`src/background.js`|Firefox-only User-Agent rewrite via `webRequest.onBeforeSendHeaders`|
|`src/content_scripts/visibility.js`|Content script for tab visibility override + navigator.userAgent spoofing|
|`manifest.json`|Extension manifest with webRequest permissions and content script injection|
|`scripts/bump-version.js`|Version bumping helper for package.json and manifest.json|
|`package.json`|Scripts: `build` (web-ext), `clean`, `check` (syntax), `test` (node --test)|

## Commands

- `npm run build` — generates .xpi via web-ext (for distribution)
- `npm run clean` — removes `web-ext-artifacts/`
- `npm run check` — `node --check` on all scripts
- `npm run test` — `node --test` (runs `*.test.js`)

## Build invariants

- `manifest.json` is at root, versioned directly
- No build artifacts in repo
- User-Agent and `youtube.com/tv` scope live only in `src/config.js`.

## Loading for development

Firefox: `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on" →
`manifest.json` (at repo root). Distribute as `.xpi` via `npm run build`.

Note: The extension injects a content script (`visibility.js`) at `document_start`
to override tab visibility properties and JavaScript-accessible `navigator.userAgent`.
The actual HTTP request header rewriting is done by `background.js` via the
`webRequest` API.

## Usage flow

1. Open `https://youtube.com/tv`, settings → "Link with TV code".
2. Mobile YouTube app: Settings > Watch on TV > Enter TV code.
3. Taps on the phone play in the browser window.

If it breaks: `youtube.com/tv` Settings > Linked devices → "unlink all devices",
then restart the mobile app and repeat.

## When editing

- Prefer editing src/config.js for User-Agent/scope changes; run npm run check after changes.
- Content scripts: Edit `src/content_scripts/visibility.js` for visibility/UX overrides.
- Background script: Edit `src/background.js` for User-Agent header rewriting.
- Run `npm run check && npm test` after any change.
- Tests: `npm test`; add cases under the existing `*.test.js` convention only
  for uncertain edge behavior.

## Branches

Use always the `main` branch. Do not create branches unless explicitly requested.
