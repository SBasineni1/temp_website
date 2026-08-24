# CU GeoData — cornellgeodata.com

The website for Cornell's GeoData project team: a three.js globe hero, project and
member sections, a posts/blog page, a sponsorship page, live air-quality data from the
team's Air Quality Eggs, and privacy/terms pages. **React 19 + TypeScript + Vite**,
plain inline styles, no CSS framework.

## Commands

```bash
npm install
npm run dev          # dev server with HMR
npm run build        # vite build + precompress dist (does NOT type-check)
npm run preview      # serve the production bundle locally
npm run lint         # oxlint
npm start            # production server (server.mjs): serves dist + /api/aqi
npx tsc --noEmit     # type-check; run before calling work done
```

There is no test suite. `vite build` strips types without checking them, so run
`npx tsc --noEmit` separately whenever touching `.ts`/`.tsx` files.

## Layout

```
index.html           # meta/OG/JSON-LD, font + model preloads
server.mjs           # production server: static dist (precompressed) + /api/aqi proxy
scripts/compress.mjs # emits .br/.gz next to dist assets at build time
src/
  main.tsx           # React root
  App.tsx            # the whole page: hash routing, content data, all sections
  Globe.tsx          # thin React wrapper around the globe engine
  globeEngine.ts     # framework-agnostic three.js engine
  members.json       # member roster (name, subteam, photo, email, ...)
  index.css          # fonts, resets, responsive overrides
public/              # photos, badges, alumni logos, fonts, GLB models, packet PDF
```

### Routing and content

`App.tsx` routes on `location.hash`: `#/posts`, `#/posts/<slug>`, `#/sponsors`,
`#/sensors`, `#/privacy`, `#/terms`; anything else renders the landing page
(`#projects`, `#members`, `#join` are plain anchors on it). Content lives in data
tables at the top of the file (`PROJECTS`, `POSTS`, `TIERS`, `ALUMNI`, legal text) —
edit those, not the JSX. Members are mass-edited in `src/members.json`; photos go in
`public/members/`.

### The globe (`Globe.tsx` / `globeEngine.ts` split)

`GlobeEngine` owns the three.js scene: a GLB earth with an orbiting satellite,
starfield, drag-to-rotate, and wheel/pinch zoom (clamped 0.2–5x). It has **no React
dependency** — `Globe.tsx` hands it a raw canvas via `mount({ canvasEl, onNoWebGL })`
and calls `unmount()` on cleanup. Keep new 3D/animation logic in the engine and keep
`Globe.tsx` limited to refs, JSX, and the lifecycle call.

Degradation paths: phones never load three.js (text hero only); if WebGL is
unavailable, `mount` reports `onNoWebGL` and `Globe.tsx` swaps in
`/globe-fallback.webp`. Don't remove the `try/catch` around `WebGLRenderer`
construction — it's what makes that fallback work.

### Sensors page

`server.mjs` proxies the Air Quality Egg API at `/api/aqi` so the API key stays
server-side; `EGG_SERIAL` (comma-separated) and `EGG_API_KEY` live in the host's
environment, and eggs are re-keyed to stable `egg1`/`egg2` slots. The client parse
(`eggSeries`) is shape-tolerant on purpose — a portal-side format change should
degrade to "no chart", not a crash — and averages the ~1-minute samples into
15-minute buckets. The US AQI badge is computed client-side from the PM2.5/PM10 24h
means using EPA breakpoints. In dev, vite proxies `/api` to `localhost:4173` — run
`node server.mjs` (or a mock on that port) alongside `npm run dev`.

## Fonts

All fonts are self-hosted in `public/fonts/` (Intan, Resiple, Manti Sans, Parachutes
Sans) — no Google Fonts. Two font quirks are load-bearing:

- **Manti Sans has no period glyph** — decimals render as tofu, so numbers are always
  set in Resiple.
- **Resiple ships a broken "M"+"1" kern pair** that draws the 1 under the M ("PM10"
  becomes "PMO"), so `font-kerning: none` is set site-wide in `index.css`.

## Conventions

- No new abstractions or file splits without a reason — it's a small site; content
  changes should mostly touch data tables, not components.
- Comments explain non-obvious *why*, never *what*; keep the existing sparse density.
- No `any` / `@ts-ignore` in `globeEngine.ts`; mesh fields use concrete generics so
  material properties type-check without casts.
