# Strava Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync Strava activity comments into the database and display them in the map trip side panel next to the activity date.

**Architecture:** Add a `comments` JSONB column to `trips`, populate it during the Strava cron for activities from the last 30 days, extend the `Trip` interface in `Map.tsx`, and render an inline toggle in the side panel header next to the date.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL), Strava API v3, TypeScript, Tailwind CSS

---

## File Map

| File | Change |
|------|--------|
| `lib/strava.ts` | Add `StravaComment` type + `fetchStravaComments()` |
| `app/api/cron/strava/route.ts` | Add comments refresh pass after main activity loop |
| `components/Map.tsx` | Add `comments` to `Trip` interface + side panel UI |

---

### Task 1: Add `StravaComment` type and `fetchStravaComments` to `lib/strava.ts`

**Files:**
- Modify: `lib/strava.ts`

- [ ] **Step 1: Add the `StravaComment` type after the `StravaActivity` interface (after line 45)**

In `lib/strava.ts`, after the closing `}` of `StravaActivity`, add:

```ts
export interface StravaComment {
  id: number
  athlete_name: string
  text: string
  created_at: string
}
```

- [ ] **Step 2: Add `fetchStravaComments` function at the bottom of `lib/strava.ts`**

```ts
export async function fetchStravaComments(
  accessToken: string,
  activityId: number
): Promise<StravaComment[]> {
  try {
    const res = await fetch(
      `${STRAVA_BASE}/api/v3/activities/${activityId}/comments`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) return []
    const raw: Array<{ id: number; athlete: { firstname: string; lastname: string }; text: string; created_at: string }> = await res.json()
    return raw.map(c => ({
      id: c.id,
      athlete_name: `${c.athlete.firstname} ${c.athlete.lastname}`.trim(),
      text: c.text,
      created_at: c.created_at,
    }))
  } catch {
    return []
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `lib/strava.ts`

- [ ] **Step 4: Commit**

```bash
git add lib/strava.ts
git commit -m "feat: add fetchStravaComments to strava lib"
```

---

### Task 2: Add `comments` refresh pass to the Strava cron

**Files:**
- Modify: `app/api/cron/strava/route.ts`

- [ ] **Step 1: Import `fetchStravaComments` at the top of the file**

In `app/api/cron/strava/route.ts`, update the import line (line 4):

```ts
import { refreshStravaToken, fetchStravaActivitiesSince, fetchStravaElevation, fetchStravaStreams, detectBreaks, findPeakLocations, fetchStravaPhotos, reverseGeocodeCountry, fetchStravaComments } from '@/lib/strava'
```

- [ ] **Step 2: Add the comments refresh pass after the main activity loop**

In `runStravaSync()`, replace the `return` statement at line 136 with the following block, then return after:

```ts
  // Refresh comments for all activities from the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentTrips } = await supabase
    .from('trips')
    .select('id, strava_id')
    .not('strava_id', 'is', null)
    .gte('start_date', thirtyDaysAgo)

  for (const trip of recentTrips ?? []) {
    const comments = await fetchStravaComments(accessToken, trip.strava_id)
    await supabase
      .from('trips')
      .update({ comments: comments.length > 0 ? comments : null })
      .eq('id', trip.id)
  }

  await supabase.from('tokens').update({
    last_synced_at: new Date().toISOString(),
  }).eq('id', 1)

  return { upserted, fetched: activities.length, since: since.toISOString() }
```

(Remove the old `await supabase.from('tokens').update(...)` and `return` that were there before.)

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/strava/route.ts
git commit -m "feat: sync strava comments for last 30 days on each cron run"
```

---

### Task 3: Add `comments` column to Supabase `trips` table

**Files:**
- Supabase dashboard (SQL editor)

- [ ] **Step 1: Run this SQL in the Supabase dashboard SQL editor**

```sql
ALTER TABLE trips ADD COLUMN IF NOT EXISTS comments jsonb;
```

- [ ] **Step 2: Verify the column exists**

Run in SQL editor:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'trips' AND column_name = 'comments';
```

Expected: one row returned with `data_type = jsonb`

---

### Task 4: Test the sync locally

**Files:** none (manual trigger)

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Trigger the cron manually**

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/strava
```

On Windows PowerShell:
```powershell
$env:CRON_SECRET = "your-secret-here"
Invoke-WebRequest -Uri "http://localhost:3000/api/cron/strava" -Headers @{ Authorization = "Bearer $env:CRON_SECRET" }
```

Expected: JSON response `{ upserted: N, fetched: N, since: "..." }` with no errors in the terminal

- [ ] **Step 3: Verify comments landed in the DB**

Run in Supabase SQL editor:
```sql
SELECT id, name, comments FROM trips
WHERE comments IS NOT NULL
LIMIT 5;
```

Expected: rows where `comments` is a JSON array of `{ id, athlete_name, text, created_at }`

---

### Task 5: Add `comments` to the `Trip` interface and side panel UI in `Map.tsx`

**Files:**
- Modify: `components/Map.tsx`

- [ ] **Step 1: Add `comments` to the `Trip` interface (after `youtube_ids`, around line 50)**

```ts
interface Trip {
  id: string
  name: string
  start_date: string
  distance_m: number
  journal_fr: string | null
  journal_en: string | null
  coordinates: [number, number][]
  elevation: [number, number][] | null
  country?: string | null
  max_speed_ms: number | null
  elev_high: number | null
  breaks: { lat: number; lng: number; duration_min: number; distance_m: number }[] | null
  max_speed_lat: number | null
  max_speed_lng: number | null
  elev_high_lat: number | null
  elev_high_lng: number | null
  youtube_ids?: string[]
  comments: Array<{ id: number; athlete_name: string; text: string; created_at: string }> | null
}
```

- [ ] **Step 2: Add `commentsOpen` state**

Find the existing state declarations near the top of the `Map` component (near `journalExpanded`). Add:

```ts
const [commentsOpen, setCommentsOpen] = useState(false)
```

- [ ] **Step 3: Reset `commentsOpen` when selected trip changes**

Find the `useEffect` that resets `journalExpanded` when `selectedTripIndex` changes. Add `setCommentsOpen(false)` to the same effect:

```ts
useEffect(() => {
  setJournalExpanded(false)
  setCommentsOpen(false)
}, [selectedTripIndex])
```

- [ ] **Step 4: Replace the date paragraph in the side panel with date + comments toggle**

Find this block (around line 2171):

```tsx
              <p className="text-sm text-slate-400">
                {new Date(selectedTrip.start_date).toLocaleDateString(locale, {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
```

Replace with:

```tsx
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-400">
                  {new Date(selectedTrip.start_date).toLocaleDateString(locale, {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
                {selectedTrip.comments && selectedTrip.comments.length > 0 && (
                  <button
                    onClick={() => setCommentsOpen(o => !o)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-orange-400 transition-colors"
                    title={commentsOpen ? 'Hide comments' : 'Show comments'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>{selectedTrip.comments.length}</span>
                  </button>
                )}
              </div>
              {commentsOpen && selectedTrip.comments && selectedTrip.comments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {selectedTrip.comments.map(c => (
                    <div key={c.id} className="flex gap-2 items-start">
                      <div
                        className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-xs font-bold"
                      >
                        {c.athlete_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-300 font-medium">{c.athlete_name}</div>
                        <div className="text-xs text-slate-400 leading-relaxed">{c.text}</div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {new Date(c.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add components/Map.tsx
git commit -m "feat: show strava comments in trip side panel"
```

---

### Task 6: Local end-to-end test

- [ ] **Step 1: Open the map at `http://localhost:3000/map`**

- [ ] **Step 2: Click on a trip that has comments**

Expected: a speech bubble icon with a count appears next to the date in the side panel

- [ ] **Step 3: Click the speech bubble icon**

Expected: comment list expands inline showing athlete avatar initial, name, text, and date

- [ ] **Step 4: Click again**

Expected: list collapses

- [ ] **Step 5: Click a different trip (one without comments)**

Expected: no speech bubble icon appears, and `commentsOpen` resets (no stale list visible)

---

### Task 7: Increment app version

**Files:**
- Modify: `lib/version.ts`

- [ ] **Step 1: Increment `APP_VERSION` in `lib/version.ts`**

Open `lib/version.ts` and bump the patch version (e.g. `1.2.3` → `1.2.4`).

- [ ] **Step 2: Commit**

```bash
git add lib/version.ts
git commit -m "chore: bump version for strava comments feature"
```
