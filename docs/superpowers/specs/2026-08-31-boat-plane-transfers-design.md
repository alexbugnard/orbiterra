# Boat/Plane Transfers — Design Spec

**Date:** 2026-08-31

## Overview

Let the admin add a manual "transfer" (boat or plane hop) between two coordinates — e.g. crossing the Darien Gap or a strait — and show it on the map as a great-circle arc, accounting for Earth's curvature. Visual only: transfers do not affect `totalKm`, elevation gain, or the Americas-crossing progress calc, which stay tied to actual GPS-tracked rides.

## Database

New `transfers` table in Supabase:

```sql
CREATE TABLE transfers (
  id bigint generated always as identity primary key,
  mode text NOT NULL CHECK (mode IN ('boat', 'plane')),
  label text NOT NULL,
  from_lat double precision NOT NULL,
  from_lng double precision NOT NULL,
  to_lat double precision NOT NULL,
  to_lng double precision NOT NULL,
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

No `coordinates` column — the arc is interpolated client-side from the two endpoints at render time, so curvature always renders correctly regardless of projection/zoom and there's no large jsonb payload to store or sync.

## Shared Geo Helper (`lib/geo.ts`, new file)

Hoist the existing `geodesicArc`/`geodesicPath` slerp functions out of `components/Map.tsx` (currently defined inline ~line 469, used by the measure tool) into a new shared module:

```ts
export function geodesicArc(a: [number, number], b: [number, number], steps = 64): [number, number][]
export function geodesicPath(pts: [number, number][]): [number, number][]
```

Behavior unchanged (spherical slerp interpolation + antimeridian longitude unwrapping). `Map.tsx` imports both from `lib/geo.ts` instead of defining them locally; the measure tool keeps working exactly as today. This avoids duplicating the great-circle math for transfers.

## Data Fetching (`app/map/page.tsx`)

Add a `transfers` query alongside the existing trips/routes/waypoints fetch:

```ts
supabase.from('transfers').select('id, mode, label, from_lat, from_lng, to_lat, to_lng, start_date, end_date').order('start_date', { ascending: true })
```

Pass the result through `getMapData()`'s return value and into `<MapClient transfers={transfers} ... />`.

## Map Rendering (`components/Map.tsx`)

New `Transfer` type:

```ts
interface Transfer {
  id: string
  mode: 'boat' | 'plane'
  label: string
  from_lat: number; from_lng: number
  to_lat: number; to_lng: number
  start_date: string
  end_date: string | null
}
```

New `transfers` prop, rendered in a dedicated effect (parallel to the existing planned-route rendering block ~line 2041):

- For each transfer, compute `geodesicArc([from_lat, from_lng], [to_lat, to_lng])` and draw as `L.polyline` with `dashArray: '4, 8'`, `weight: 3`, `interactive: true`.
- Color by mode: boat `#38bdf8` (sky-400), plane `#a78bfa` (violet-400) — visually distinct from the cyan planned-route dash and from solid orange ridden-trip lines.
- A small divIcon marker at the arc midpoint showing a boat/plane glyph (reuse the existing inline-SVG icon pattern used for callout markers).
- Click opens a lightweight popup (`L.popup`, not the full trip side panel) showing: mode icon, `label`, formatted date range, and straight-line distance (haversine of the two endpoints, computed inline — no need for a shared helper given it's one call site).
- Own Leaflet pane (`transferPane`) so z-ordering relative to trip polylines and the planned route is controlled explicitly, same pattern as `contourPane`.

## Admin UI

**New page `app/admin/transfers/page.tsx`** — server component, lists transfers ordered by `start_date`, mirrors `app/admin/page.tsx` structure (header + list, "Add transfer" entry point). Add a "Transfers" link next to the existing "Site content" link in `app/admin/page.tsx`'s header nav.

**New `app/admin/TransferEditor.tsx`** (client component) — mirrors `TripEditor.tsx`'s existing plain-form editing pattern (inline edit/save/cancel, no modal):

- Mode: dropdown (Boat / Plane)
- Label: text input
- From: two number inputs (lat, lng)
- To: two number inputs (lat, lng)
- Start date / End date: date inputs
- Save → `PATCH /api/admin/transfers/[id]` (new route), same REST pattern `TripEditor` uses against `/api/admin/trips/[id]`
- Add → `POST /api/admin/transfers` (new route)
- Delete button with confirm → `DELETE /api/admin/transfers/[id]`, same as trips

## i18n

No new translation keys needed for the map popup content (mode name + label are short and can stay as plain strings, consistent with how trip journal text is already bilingual-authored rather than i18n-keyed). Admin UI is English-only, consistent with the rest of `/admin`.

## Out of Scope

- No effect on `totalKm`, elevation gain, country count, or Americas-crossing `%`/`kmLeft` (map or landing page) — confirmed visual-only per requirements.
- No map-click coordinate picker in the admin form — plain lat/lng number inputs only.
- No display on the landing-page globe (`GlobeMap.tsx`) — only the full `/map` page. Can be revisited later if wanted.
