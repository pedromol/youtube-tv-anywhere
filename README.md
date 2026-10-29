# YouTube TV Anywhere

Browser extension that forces `youtube.com/tv` to identify itself as a smart TV,
allowing controlling YouTube from the desktop via the mobile app (cast /
"watch on TV").

## How it works

YouTube only allows pairing with the mobile app when the page is opened as
`youtube.com/tv`. The site detects common browsers via the `User-Agent` header,
so the extension rewrites that header on requests to `youtube.com/tv`:

- **Firefox (MV3):** `src/background.js` uses `webRequest` with blocking, which
  is still available on Firefox.

## Structure

```
manifests/
  base.json             # fields common to both browsers
  firefox.json          # Firefox differences (permissions, background, gecko)
scripts/
  build.mjs             # dependency-free build, generates dist/<browser>/
src/
  config.js             # User-Agent and URL scope (single source of truth)
  background.js         # User-Agent rewrite (Firefox only)
```

Sources live in `src/` and `manifests/`; `dist/` is always generated and not
versioned. No signed build artifact (`META-INF/`) stays in the repo.

The build combines manifests/base.json with manifests/firefox.json, uses the
version from package.json, and derives host_permissions from src/config.js.
The User-Agent and the youtube.com/tv scope are defined once, in src/config.js.

## Development

Requirements: Node.js 18+ (build only; the extension uses no bundler) and
Firefox 140+ / Firefox for Android 142+ (minimums set in the manifest because of
`data_collection_permissions`).

```bash
npm run build     # generates dist/firefox
npm run check     # syntax check of scripts
npm run clean     # removes dist/
```


## Load the extension

**Firefox**

1. `npm run build`
2. Open `about:debugging#/runtime/this-firefox`
3. "Load Temporary Add-on" and select `dist/firefox/manifest.json`

To distribute, package the contents of `dist/firefox/` as a `.xpi` (the `id` in
`browser_specific_settings.gecko` is already set).


## Usage

1. Open `https://youtube.com/tv` and click the settings icon, then "Link with
   TV code".
2. On the YouTube mobile app: Settings > Watch on TV > Enter TV code.
3. What you tap on the phone starts playing in the browser window.

If it stops working: in `youtube.com/tv` go to Settings > Linked devices and
click "unlink all devices"; on mobile, close and reopen the YouTube app and
repeat the process.
