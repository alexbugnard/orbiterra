# OrbiTerra — Vincent's Pan-American Cycling Tracker

A live map tracking Vincent Morisetti's cycling journey from Deadhorse, Alaska to Ushuaia, Argentina (~30 000 km across two continents).

## What the app does

- Displays every completed ride as an interactive polyline on a Leaflet map
- Shows the full planned route (Deadhorse → Ushuaia) as a reference overlay
- Places geotagged Flickr photos on the map; click to view full-size
- Shows a live weather layer along the planned route
- Marks cities, mountains, passes and lakes near the route with Wikipedia summary panels
- Estimates Vincent's current position from the furthest point ridden on the planned route
- Tracks journey stats: distance ridden, elevation gain, countries crossed, Americas crossing progress %
- Elevation profile for each ride with interactive hover sync (map ↔ profile)
- Hover any ride on the map to see the interpolated time Vincent passed that point (CET + local timezone)
- Video of the day: YouTube videos auto-matched to each ride date
- Strava ride comments displayed in the trip side panel
- Trip photos displayed in the desktop side panel
- Geo tools: distance measure, Switzerland size overlay, timezone map, day/night layer, population density, active fires, lightning, wildlife sightings (GBIF)
- Basemap switcher: dark (default), light, topo — contour lines auto-appear at zoom ≥ 10
- StatHunter modal: aggregated stats across all rides (peaks, passes, countries, distances)
- About modal: goal + bio, media gallery, feature guide, bike setup, version changelog

## Tech stack

- **Framework:** Next.js 15 (App Router — server + client components, API routes)
- **Database:** Supabase (PostgreSQL) — coordinates stored as JSONB
- **Mapping:** Leaflet.js (client-side only, SSR disabled)
- **Auth:** NextAuth.js (credentials provider)
- **i18n:** next-intl — French default, English toggle
- **Hosting:** Vercel (free tier) with Vercel Cron jobs

## Data sources

| Data | Source | Refresh |
|------|--------|---------|
| Rides + elevation | Strava API (OAuth) | Every ~4 hours |
| Photos | Flickr API (geotagged) | Every ~4 hours |
| Ride comments | Strava API | Every ~4 hours (last 30 days) |
| Videos | YouTube RSS feed | Every hour |
| Weather | OpenWeatherMap API | On map load |
| City/POI descriptions | Wikipedia REST API | On demand |
| Population density | SEDAC/CIESIN raster tiles | On demand |
| Active fires | NASA FIRMS | On demand |
| Lightning | Blitzortung | On demand |
| Wildlife sightings | GBIF API | On demand |

## Version history

Each version is named after a Swiss 4000 m summit. See the **Journal** tab in the About modal for the full changelog.

| Version | Name | Date |
|---------|------|------|
| 1.3.6 | Pascale push *(last prod deploy)* | 28 mai 2026 |
| 1.3 | Dom (4 545 m) | 11 mai 2026 |
| 1.2 | Weisshorn (4 506 m) | 28 avr. 2026 |
| 1.1 | Matterhorn (4 478 m) | 16 avr. 2026 |
| 1.0 | Jungfrau (4 158 m) | 15 avr. 2026 |

## Local development

```bash
npm install
npm run dev
```

Requires a `.env.local` with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
FLICKR_API_KEY=
NEXTAUTH_SECRET=
ADMIN_PASSWORD_HASH=        # bcrypt hash — escape $ as \$ in .env.local
CRON_SECRET=
OPENWEATHER_API_KEY=
YOUTUBE_CHANNEL_ID=UCxOaBkNDFV1BRL_eUMWuQyQ
```

## Key architecture notes

### Coordinate convention
All coordinates stored as `[lng, lat][]` (GeoJSON order). Convert to `[lat, lng]` when passing to Leaflet.

### Elevation hover sync
Bidirectional between the SVG elevation profile and the Leaflet map. Uses `useRef` for closure-safe access inside Leaflet event handlers. `circleMarker` uses `setStyle({opacity, fillOpacity})` — not `setOpacity()`.

### Contour lines
OpenTopoMap tiles rendered in a dedicated Leaflet pane with CSS `mix-blend-mode: screen` (dark basemap) or `multiply` (light basemap) to make the white tile background transparent. Auto-shown at zoom ≥ 10, hidden on topo basemap (which has built-in contours).

### Trip photos in side panel
`waypoints.trip_id` links Flickr photos to their ride. The Supabase query in `app/map/page.tsx` must include `trip_id` in the waypoints select. The desktop side panel in `Map.tsx` filters waypoints by `selectedTrip.id`.

### YouTube video matching
Videos are matched to rides by looking for the ride date (YYYYMMDD) in the video title. No YouTube Data API key required — uses the public RSS feed.

### Americas crossing progress
Computed in `app/map/page.tsx`: finds the furthest point reached along `planned_routes[0].coordinates` within 10 km of any ridden trip point, then scales to a fixed 25 000 km total.

## Database migrations

SQL files in `supabase/` can be run in the Supabase SQL editor. Files ending in `_batch*.sql` are data seeding scripts safe to re-run (they use `ON CONFLICT DO NOTHING`).

## Admin

Protected admin panel at `/admin` (NextAuth credentials login):
- `/admin/trips` — view/edit trip visibility and metadata
- Sync Strava button — triggers `/api/cron/strava` manually
