# Strava Comments — Design Spec

**Date:** 2026-05-20

## Overview

Sync Strava activity comments into the app and display them in the map trip side panel, next to the activity date.

## Database

Add a `comments` column to the `trips` table in Supabase:

```sql
ALTER TABLE trips ADD COLUMN comments jsonb;
```

Schema of each element:
```ts
{ id: number, athlete_name: string, text: string, created_at: string }
```

Default null. Overwritten entirely on each sync — deleted Strava comments will disappear automatically.

## Strava Library (`lib/strava.ts`)

Add `fetchStravaComments(accessToken: string, activityId: number): Promise<StravaComment[]>`.

- Calls `GET https://www.strava.com/api/v3/activities/{id}/comments`
- Returns mapped array `{ id, athlete_name, text, created_at }` or `[]` on any error
- Type `StravaComment = { id: number, athlete_name: string, text: string, created_at: string }`

## Sync (`app/api/cron/strava/route.ts`)

After the main activity loop, add a comments refresh pass:

1. Query all trips where `strava_id IS NOT NULL` and `start_date >= now() - interval '30 days'`
2. For each trip, call `fetchStravaComments(accessToken, trip.strava_id)`
3. Upsert `comments` back (always overwrite — null if empty array)

Rate limit: Strava allows 100 req/15 min. The 30-day window keeps the number of extra calls bounded and well within limits for a typical journey.

## Data Model (`components/Map.tsx`)

Add `comments` to the `Trip` interface:

```ts
comments: Array<{ id: number, athlete_name: string, text: string, created_at: string }> | null
```

No Supabase query change needed — the existing `select('*')` will include the new column.

## UI (`components/Map.tsx`)

In the trip side panel, next to the date line (currently line ~2172):

- Render a small speech bubble icon button inline with the date, only when `comments` has ≥ 1 entry
- Clicking toggles a `commentsOpen` boolean state (local to the panel, reset when `selectedTrip` changes)
- When open, an inline section expands immediately below the date showing each comment:
  - Orange circle with athlete's initial (first letter of `athlete_name`)
  - Athlete name in `text-slate-300 text-xs font-medium`
  - Comment text in `text-slate-400 text-xs leading-relaxed`
  - Relative date (e.g. "3 days ago") in `text-slate-500 text-xs`
- No modal, no new file — all inline in the existing panel JSX

## i18n

No new translation keys needed. Comment display is language-agnostic (Strava content is as written by the commenter).
