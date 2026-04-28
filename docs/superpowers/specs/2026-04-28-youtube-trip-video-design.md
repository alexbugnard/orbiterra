# YouTube Video in Trip Detail Panel

**Date:** 2026-04-28  
**Status:** Approved

## Problem

Vincent uploads one YouTube video per riding day. The title always contains the ride date in `YYYYMMDD` format (e.g. `20260428`). When a user opens a trip detail page, the matching video should appear embedded below the journal text.

## Constraints

- YouTube cron runs once per day — video may be published before the cron runs.
- No schema changes allowed.
- No merge until local testing passes.

## Solution

### Data fetching (`app/trips/[id]/page.tsx`)

1. Format `trip.start_date` as `YYYYMMDD`.
2. Query `videos` table: `.ilike('title', '%YYYYMMDD%').limit(1)`.
3. If no row returned, fall back to a live `fetchChannelVideos()` call and filter in memory for the same date string.
4. Pass the matched `youtube_id` (or `null`) as a prop to `TripViewClient`.

### UI (`components/TripViewClient.tsx`)

- Accept optional `youtubeId: string | null` prop.
- If non-null, render below the journal text (inside the header panel):
  - 16:9 aspect ratio wrapper, full panel width.
  - `<iframe src="https://www.youtube.com/embed/{youtubeId}" allowFullScreen />`
  - Fullscreen button (top-right corner) calls `iframeRef.current.requestFullscreen()` — native browser API, no custom modal.

### No changes to

- `videos` table schema
- YouTube cron logic
- i18n strings
