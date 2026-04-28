# YouTube Video in Trip Detail Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a matching YouTube video (matched by `YYYYMMDD` in title) embedded below the journal in the trip detail panel, with a native fullscreen button.

**Architecture:** The trip page server component queries the `videos` table for a date-matching video; if nothing is found it falls back to a live RSS fetch. The `youtube_id` is passed as a prop to `TripViewClient`, which renders an iframe with a fullscreen button. No schema changes.

**Tech Stack:** Next.js 15 App Router, Supabase, React, Tailwind CSS, YouTube embed iframe API.

---

## File Map

| File | Change |
|------|--------|
| `lib/youtube.ts` | Add `findVideoIdForDate(dateStr: string, videos: YoutubeVideo[]): string \| null` helper |
| `app/trips/[id]/page.tsx` | Query DB for video by date, fall back to live RSS, pass `youtubeId` prop |
| `components/TripViewClient.tsx` | Accept `youtubeId?: string \| null`, render player below journal |

---

### Task 1: Add `findVideoIdForDate` helper to `lib/youtube.ts`

**Files:**
- Modify: `lib/youtube.ts`

- [ ] **Step 1: Add the helper function**

Append to `lib/youtube.ts` (after the existing `fetchChannelVideos` function):

```ts
/**
 * Returns the youtube_id of the first video whose title contains the given
 * date string (format: YYYYMMDD), or null if none found.
 */
export function findVideoIdForDate(dateStr: string, videos: YoutubeVideo[]): string | null {
  const match = videos.find(v => v.title.includes(dateStr))
  return match?.youtube_id ?? null
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/youtube.ts
git commit -m "feat: add findVideoIdForDate helper to youtube lib"
```

---

### Task 2: Fetch video for the trip date in `app/trips/[id]/page.tsx`

**Files:**
- Modify: `app/trips/[id]/page.tsx`

- [ ] **Step 1: Import the new helper and `fetchChannelVideos`**

At the top of `app/trips/[id]/page.tsx`, add to the existing imports:

```ts
import { fetchChannelVideos, findVideoIdForDate } from '@/lib/youtube'
```

- [ ] **Step 2: Add the video lookup after the trip query**

After the `if (!trip) notFound()` line, insert:

```ts
  // Format trip date as YYYYMMDD for title matching
  const tripDateStr = trip.start_date.slice(0, 10).replace(/-/g, '') // "2026-04-28" → "20260428"

  // 1. Try DB first (already synced by cron)
  let youtubeId: string | null = null
  const { data: videoRow } = await supabase
    .from('videos')
    .select('youtube_id')
    .ilike('title', `%${tripDateStr}%`)
    .limit(1)
    .maybeSingle()

  if (videoRow) {
    youtubeId = videoRow.youtube_id
  } else {
    // 2. Fallback: live RSS fetch (handles videos uploaded before cron runs)
    try {
      const channelId = process.env.YOUTUBE_CHANNEL_ID ?? 'UCxOaBkNDFV1BRL_eUMWuQyQ'
      const liveVideos = await fetchChannelVideos(channelId)
      youtubeId = findVideoIdForDate(tripDateStr, liveVideos)
    } catch {
      // RSS unavailable — silently skip, no video shown
    }
  }
```

- [ ] **Step 3: Pass `youtubeId` to `TripViewClient`**

In the `return` statement, add `youtubeId={youtubeId}` to the `<TripViewClient>` element:

```tsx
  return (
    <TripViewClient
      trip={formattedTrip}
      waypoints={waypoints ?? []}
      locale={locale}
      backLabel={t('backToMap')}
      distanceKm={distanceKm}
      date={date}
      journal={journal}
      youtubeId={youtubeId}
    />
  )
```

- [ ] **Step 4: Commit**

```bash
git add app/trips/[id]/page.tsx
git commit -m "feat: fetch matching youtube video for trip date in trip page"
```

---

### Task 3: Render embedded player in `TripViewClient`

**Files:**
- Modify: `components/TripViewClient.tsx`

- [ ] **Step 1: Add `youtubeId` to the props interface and function signature**

In `TripViewClient.tsx`, extend `TripViewClientProps`:

```ts
interface TripViewClientProps {
  trip: Trip
  waypoints: Waypoint[]
  locale: string
  backLabel: string
  distanceKm: string
  date: string
  journal: string | null
  youtubeId: string | null  // ← add this
}
```

Update the function signature:

```ts
export function TripViewClient({
  trip,
  waypoints,
  locale,
  backLabel,
  distanceKm,
  date,
  journal,
  youtubeId,      // ← add this
}: TripViewClientProps) {
```

- [ ] **Step 2: Add `useRef` import and iframe ref**

`useRef` is already available from React. Add a ref at the top of the component body (after the `useState` line):

```ts
  const iframeRef = useRef<HTMLIFrameElement>(null)
```

Make sure `useRef` is imported:

```ts
import { useState, useRef } from 'react'
```

- [ ] **Step 3: Add the video block below the journal text**

In the JSX, the journal is rendered as:

```tsx
        {journal && (
          <p className="mt-3 text-sm text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
            {journal}
          </p>
        )}
```

Insert the video block **immediately after** that `{journal && ...}` block:

```tsx
        {youtubeId && (
          <div className="mt-3 border-t border-slate-800 pt-3 relative">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${youtubeId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 w-full h-full rounded"
              />
              <button
                onClick={() => iframeRef.current?.requestFullscreen()}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded p-1 transition-colors"
                aria-label="Fullscreen"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              </button>
            </div>
          </div>
        )}
```

- [ ] **Step 4: Build check**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/TripViewClient.tsx
git commit -m "feat: embed youtube video in trip detail panel with fullscreen button"
```

---

### Task 4: Manual local test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open a trip that has a matching video**

Navigate to `/trips/<id>` for a trip whose `start_date` matches `YYYYMMDD` in a video title on the channel. Verify:
- The embedded player appears below the journal text.
- The fullscreen button expands the iframe to fullscreen.
- Trips with no matching video show no player (no blank space, no error).

- [ ] **Step 3: Test the RSS fallback**

Temporarily rename a `youtube_id` in the DB (or use a trip date you know has no DB entry but exists on the RSS feed) to confirm the fallback path works.

- [ ] **Step 4: Increment version**

In `lib/version.ts`, increment `APP_VERSION` (e.g. `1.2.0` → `1.2.1`).

```bash
git add lib/version.ts
git commit -m "chore: bump version to 1.2.1"
```
