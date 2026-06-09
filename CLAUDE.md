# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OrbiTerra** — a serverless web app that automatically syncs a cyclist's (Vincent Morisetti's) Strava activities and Flickr photos onto an interactive Leaflet map, tracking his Alaska → Ushuaia cycling journey (~30 000 km). The app is live and actively developed at [orbiterra.ch](https://orbiterra.ch).

## Version

The app version is defined in `lib/version.ts` (`APP_VERSION`). Increment it on **every commit** that touches user-visible features or fixes. It is displayed in the About modal footer. Current: `1.5.2`.

## Tech Stack

- **Framework:** Next.js 15 (App Router — server components + client components, API routes)
- **Database:** Supabase (PostgreSQL) — no PostGIS needed, coordinates stored as JSONB
- **Mapping:** Leaflet.js (loaded dynamically, SSR disabled)
- **Auth:** NextAuth.js with credentials provider (bcrypt-hashed admin password in env)
- **i18n:** next-intl — French default, English toggle; messages in `messages/fr.json` and `messages/en.json`
- **Hosting:** Vercel (free tier) with Vercel Cron jobs

## Database Schema

Seven tables in Supabase:

- **`trips`** — `id, name, strava_id, start_date, end_date, distance_m, coordinates jsonb ([lng,lat][]), elevation jsonb ([distanceMeters,altMeters][]), start_lat, start_lng, visible, journal_fr, journal_en, last_synced_at, country, max_speed_ms, max_speed_distance_m, max_speed_lat, max_speed_lng, elev_high, elev_high_lat, elev_high_lng, breaks jsonb, comments jsonb`
- **`waypoints`** — `id, trip_id, lat, lng, url_large, title, flickr_id, taken_at` — `trip_id` links photos to their trip for display in the trip side panel
- **`planned_routes`** — `id, name, coordinates jsonb ([lng,lat][]), color, elevation jsonb, countries jsonb ([distanceM, countryName][])`
- **`videos`** — `id, youtube_id (unique), title, published_at, sort_order`
- **`tokens`** — `id, access_token, refresh_token, expires_at, last_synced_at` (previously called `strava_tokens` in docs)
- **`route_cities`** — `id, name, country, lat, lng, wiki_slug` — cities along the Pan-American route; unique on `(name, country)`
- **`route_pois`** — `id, name, country, lat, lng, wiki_slug, type` — mountains/passes/lakes; `type IN ('mountain','pass','lake')`; unique on `(name, country)`

## Architecture

### Sync Engine
- **Strava cron** (`/api/cron/strava`) — runs every ~4h via Vercel Cron; refreshes OAuth token, fetches activities since `last_synced_at`, decodes polylines, samples elevation streams to 200 points, populates `start_lat`/`start_lng` from first coordinate, syncs last 30 days of Strava comments
- **YouTube cron** (`/api/cron/youtube`) — runs hourly; fetches public RSS feed (no API key needed), upserts by `youtube_id`. Channel: `UCxOaBkNDFV1BRL_eUMWuQyQ`
- **Flickr** — synced via Strava cron using `flickr.photos.geo.getLocation`; stored as waypoints with `trip_id`

### Frontend Pages
- **`/`** — landing page with full-bleed background image, animated globe (`GlobeMap`), stats, coffee link. On mobile: small globe top-right when main globe is off-screen.
- **`/map`** — main map page; stats overlay (rides, km, elevation gain, countries, Americas crossing % + km left); About modal; gear button opens layer/tool picker
- **`/trips/[id]`** — trip detail page; header with elevation profile + map below; bidirectional hover sync; trip photos grid

### Key Components
- **`Map.tsx`** — core Leaflet component (~3500 lines). Features: polylines, waypoint markers, planned route (dashed cyan), trip detail side panel with photos + journal + videos, elevation ↔ map bidirectional hover, basemap switcher (dark/light/topo), callout markers (max speed, max altitude, pauses) on map, geo tools panel (measure, Switzerland overlay, timezone, day/night, pop. density, fires, lightning, wildlife), Wikipedia side panel for cities/POIs, StatHunter modal, contour lines overlay (OpenTopoMap tiles with CSS blend mode at zoom ≥ 10), trip hover tooltip showing interpolated time in CET + local timezone
- **`ElevationProfile.tsx`** — custom SVG chart with ResizeObserver. 2-row stagger + per-row force layout for event markers (max alt, max speed, breaks) with angled SVG leader lines. Shows gain, min/max alt, hover crosshair indicator. Supports `riddenUpToM` for partial progress display and `countries` for country labels.
- **`TripViewClient.tsx`** — client wrapper for `/trips/[id]`; owns shared `hoveredDistance` state; shows journal (expandable), YouTube video (hover preview + fullscreen modal), elevation profile, and map
- **`MapClient.tsx`** — thin client wrapper that dynamically imports `Map` (SSR disabled); accepts optional `externalHover` prop
- **`AboutModal.tsx`** — rendered via `createPortal` to `document.body` (escapes header `backdrop-filter` stacking context). **Five tabs:** About (goal, bio, stats, sponsors), Media (photo+video gallery with fullscreen lightbox), Guide (feature explainer, data sources), Setup (bike config with Fairlight frame + full kit), Journal (version changelog with Swiss 4000m peaks). Displays `APP_VERSION` in footer.
- **`GlobeMap.tsx`** — miniature SVG/canvas globe showing the planned route and ridden progress; used on landing page
- **`BikeSetup.tsx`** — bike equipment list with product links, photos, logos
- **`AboutButton.tsx`** — receives translated label as prop (avoids `useTranslations` hydration issue in client component)
- **`lib/version.ts`** — single source of truth for `APP_VERSION`; increment on every user-visible change

### About Modal Changelog (Journal tab)
Hardcoded in `AboutModal.tsx`. Each entry: version number + Swiss 4000m peak name + elevation + date + translated description. Last prod entry is "Pascale push" (v1.3.6, no peak name). Add new entries here for each significant release. Peak names assigned so far: Jungfrau (v1.0), Matterhorn (v1.1), Weisshorn (v1.2), Dom (v1.3).

## Key Implementation Notes

### Coordinate format
Coordinates are stored as `[lng, lat][]` (GeoJSON convention). When passing to Leaflet, always convert: `coords.map(([lng, lat]) => [lat, lng])`.

### Elevation hover sync
Bidirectional: hovering the Leaflet polyline updates the elevation profile indicator, and hovering the SVG profile moves an orange `circleMarker` on the map. Uses `useRef` for Leaflet closure access (`setHoveredDistanceRef`, `externalHoverRef`, `cumDistsRef`). `circleMarker` extends `Path` — use `setStyle({opacity, fillOpacity})` not `setOpacity()`.

### Elevation profile event markers
`ElevationProfile.tsx` uses a 2-row stagger + per-row forward/backward force layout to prevent label overlap. Row 0 = short callout (just above chart top), Row 1 = tall callout (above row 0). Each marker has an angled SVG `<line>` leader from pill bottom-center to the actual profile x position at `PAD.top`. `PAD = { top: 36, right: 8, bottom: 20, left: 36 }`.

### Map callout markers (speed / altitude / pause)
In `Map.tsx`, `calloutIcon()` builds a `divIcon` with an SVG connector line from label center-bottom to the dot anchor. Slot-based overlap system: 6 slots (right/left × 3 vertical levels). For each marker, finds the first free slot by checking horizontal overlap against already-placed nearby markers.

### Trip hover tooltip
When hovering a trip polyline, the tooltip shows the interpolated time Vincent passed that point: `startMs` + fraction × (`endMs` - `startMs`). Formatted as `"08h CET 🏠 / 14h local"`. Uses `end_date` from the `trips` table. Local timezone is looked up per trip start coordinates via `tz-lookup`.

### Contour lines
`Map.tsx` uses OpenTopoMap tiles in a dedicated `contourPane` at z-index 201. Shown at zoom ≥ 10 on dark/light basemaps only (topo basemap already has contours). CSS blend modes make the white tile background transparent:
- Dark basemap: `filter: invert(1) hue-rotate(180deg)` + `mix-blend-mode: screen`
- Light basemap: `filter: saturate(0.3)` + `mix-blend-mode: multiply`
Layer is created once per basemap change and removed/recreated on basemap switch.

### Trip photos in desktop side panel
`Map.tsx` filters `waypoints` by `w.trip_id === selectedTrip.id` to show a 2-column photo grid under the journal. Clicking opens a fullscreen `tripPhotoLightbox` modal. The `trip_id` field must be included in the Supabase `waypoints` select query in `app/map/page.tsx`.

### Americas crossing progress
Computed in `app/map/page.tsx` via `computeAmericasProgress`: compares ridden distance along the planned route (via `computeRouteProgress`) against total route length, scaled to 25 000 km.

### bcrypt in .env.local
Dollar signs in bcrypt hashes must be escaped: `\$2b\$10\$...` — otherwise dotenv interpolates `$2b` as an empty variable.

### Hydration mismatches
Always use explicit locale in `toLocaleString()` calls (e.g., `toLocaleString('fr-CH')`) — the server renders with `en-US` defaults and the client may differ, causing React hydration errors.

### Privacy buffers
Strava may omit start/end coordinates near home. Handle null/missing coordinate segments gracefully — never let the map break on sparse data.

### No local image storage
Hotlink directly from Flickr URLs. Photos without GPS are stored but not placed on the map.

### Resetting sync for backfill
To re-sync all activities: PATCH `tokens.last_synced_at` (table `tokens`, row `id=1`) to an early date via Supabase dashboard SQL or REST API, then trigger `/api/cron/strava` with the `CRON_SECRET` header.
