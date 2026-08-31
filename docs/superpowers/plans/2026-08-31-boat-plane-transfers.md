# Boat/Plane Transfers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the admin add a manual boat/plane transfer between two coordinates, rendered on `/map` as a great-circle arc, without affecting distance/elevation/progress stats.

**Architecture:** New `transfers` Supabase table (two endpoints, no coordinate array). A shared `lib/geo.ts` module (hoisted from existing `Map.tsx` code) computes the great-circle arc client-side at render time. Admin CRUD follows the existing REST-route + plain-form pattern already used for trips and videos.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres), Leaflet.js, Jest.

**Spec:** `docs/superpowers/specs/2026-08-31-boat-plane-transfers-design.md`

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/012_transfers.sql`

- [ ] **Step 1: Write the migration**

```sql
create table if not exists transfers (
  id bigint generated always as identity primary key,
  mode text not null check (mode in ('boat', 'plane')),
  label text not null,
  from_lat double precision not null,
  from_lng double precision not null,
  to_lat double precision not null,
  to_lng double precision not null,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 2: Apply the migration**

Run the SQL against the Supabase project via the dashboard SQL editor (same process used for prior migrations in this repo — there is no automated migration runner here, per `supabase/migrations/011_planned_routes_elevation.sql` being a plain hand-applied file).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/012_transfers.sql
git commit -m "feat: add transfers table for boat/plane hops"
```

---

### Task 2: Extract `geodesicArc`/`geodesicPath` into `lib/geo.ts`

**Files:**
- Create: `lib/geo.ts`
- Modify: `components/Map.tsx:468-509` (remove local definitions, import from `lib/geo.ts`)
- Test: `__tests__/lib/geo.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { geodesicArc, geodesicPath } from '@/lib/geo'

describe('geodesicArc', () => {
  it('interpolates points between two coordinates', () => {
    const arc = geodesicArc([0, 0], [0, 10], 4)
    expect(arc.length).toBe(5)
    expect(arc[0]).toEqual([0, 0])
    expect(arc[arc.length - 1]).toEqual([0, 10])
  })

  it('returns the endpoints unchanged when they are identical', () => {
    const arc = geodesicArc([10, 20], [10, 20], 4)
    expect(arc).toEqual([[10, 20], [10, 20]])
  })

  it('unwraps longitude across the antimeridian instead of jumping >180°', () => {
    const arc = geodesicArc([0, 179], [0, -179], 8)
    for (let i = 1; i < arc.length; i++) {
      expect(Math.abs(arc[i][1] - arc[i - 1][1])).toBeLessThan(180)
    }
  })
})

describe('geodesicPath', () => {
  it('chains multiple segments without duplicating shared points', () => {
    const path = geodesicPath([[0, 0], [0, 10], [0, 20]])
    // 64 steps per segment by default, 2 segments, shared point deduped once
    expect(path.length).toBe(64 * 2 + 1)
  })

  it('returns the input unchanged when fewer than 2 points are given', () => {
    expect(geodesicPath([[1, 2]])).toEqual([[1, 2]])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/geo.test.ts`
Expected: FAIL with `Cannot find module '@/lib/geo'`

- [ ] **Step 3: Create `lib/geo.ts` with the hoisted implementation**

Copy the two functions out of `components/Map.tsx:468-509` verbatim (same logic, same `[lat, lng]` input/output order used throughout that file — note this differs from the `[lng, lat]` GeoJSON convention used elsewhere in the codebase for stored `coordinates`):

```ts
// Points are [lat, lng] pairs (Leaflet convention), not the [lng, lat] GeoJSON
// convention used for stored trip/route coordinates elsewhere in this codebase.

// Expand a pair of lat/lng points into a great circle arc (geodesic interpolation)
export function geodesicArc(a: [number, number], b: [number, number], steps = 64): [number, number][] {
  const toRad = (v: number) => v * Math.PI / 180
  const toDeg = (v: number) => v * 180 / Math.PI
  const lat1 = toRad(a[0]), lng1 = toRad(a[1])
  const lat2 = toRad(b[0]), lng2 = toRad(b[1])
  const x1 = Math.cos(lat1) * Math.cos(lng1), y1 = Math.cos(lat1) * Math.sin(lng1), z1 = Math.sin(lat1)
  const x2 = Math.cos(lat2) * Math.cos(lng2), y2 = Math.cos(lat2) * Math.sin(lng2), z2 = Math.sin(lat2)
  const dot = Math.min(1, Math.max(-1, x1 * x2 + y1 * y2 + z1 * z2))
  const angle = Math.acos(dot)
  if (angle < 1e-6) return [a, b]
  const sinA = Math.sin(angle)
  const result: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const s1 = Math.sin((1 - t) * angle) / sinA
    const s2 = Math.sin(t * angle) / sinA
    const x = s1 * x1 + s2 * x2, y = s1 * y1 + s2 * y2, z = s1 * z1 + s2 * z2
    result.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))])
  }
  // Unwrap longitudes so consecutive points never jump >180° (antimeridian fix)
  for (let i = 1; i < result.length; i++) {
    let lng = result[i][1]
    const prev = result[i - 1][1]
    while (lng - prev > 180) lng -= 360
    while (lng - prev < -180) lng += 360
    result[i] = [result[i][0], lng]
  }
  return result
}

// Expand all segments of a path into geodesic arcs
export function geodesicPath(pts: [number, number][]): [number, number][] {
  if (pts.length < 2) return pts
  const result: [number, number][] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const arc = geodesicArc(pts[i], pts[i + 1])
    if (i > 0) arc.shift() // avoid duplicating shared points
    result.push(...arc)
  }
  return result
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/geo.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Update `components/Map.tsx` to import instead of define**

In `components/Map.tsx`, remove the two function declarations at lines 468-509 (keep the `haversineMeasureKm`/`totalKmFromPoints` helpers above them untouched — only the two geodesic functions move out), and add near the top imports:

```ts
import { geodesicArc, geodesicPath } from '@/lib/geo'
```

Every existing call site (`geodesicPath(newPts)` at line 574, `geodesicArc(pts[pts.length - 1], cur)` at line 588) keeps working unchanged since the function signatures are identical.

- [ ] **Step 6: Run the full test suite and typecheck**

Run: `npx jest && npx tsc --noEmit`
Expected: all tests PASS, no new type errors

- [ ] **Step 7: Commit**

```bash
git add lib/geo.ts __tests__/lib/geo.test.ts components/Map.tsx
git commit -m "refactor: hoist geodesic arc helpers into lib/geo.ts"
```

---

### Task 3: Admin API routes for transfers

**Files:**
- Create: `app/api/admin/transfers/route.ts` (POST)
- Create: `app/api/admin/transfers/[id]/route.ts` (PATCH, DELETE)

- [ ] **Step 1: Write `app/api/admin/transfers/route.ts`**

Follows the same auth + insert pattern as `app/api/admin/videos/route.ts:18-34`:

```ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createSupabaseClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { mode, label, from_lat, from_lng, to_lat, to_lng, start_date, end_date } = await request.json()

  if (mode !== 'boat' && mode !== 'plane') {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }
  if (!label || typeof label !== 'string') {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 })
  }
  const coords = [from_lat, from_lng, to_lat, to_lng]
  if (coords.some((v) => typeof v !== 'number' || Number.isNaN(v))) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }
  if (!start_date || typeof start_date !== 'string') {
    return NextResponse.json({ error: 'Start date is required' }, { status: 400 })
  }

  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('transfers')
    .insert({ mode, label, from_lat, from_lng, to_lat, to_lng, start_date, end_date: end_date || null })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
```

- [ ] **Step 2: Write `app/api/admin/transfers/[id]/route.ts`**

Follows the same `PATCH` pattern as `app/api/admin/trips/[id]/route.ts` plus the `DELETE` pattern from `app/api/admin/videos/route.ts:36-49`:

```ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createSupabaseClient } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const allowed = ['mode', 'label', 'from_lat', 'from_lng', 'to_lat', 'to_lng', 'start_date', 'end_date']
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  const supabase = createSupabaseClient()
  const { error } = await supabase.from('transfers').update(update).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createSupabaseClient()
  const { error } = await supabase.from('transfers').delete().eq('id', id)

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/transfers
git commit -m "feat: add admin API routes for transfers"
```

---

### Task 4: Admin UI — list page and editor

**Files:**
- Create: `app/admin/transfers/page.tsx`
- Create: `app/admin/TransferEditor.tsx`
- Modify: `app/admin/page.tsx:25-39` (add nav link)

- [ ] **Step 1: Write `app/admin/TransferEditor.tsx`**

Mirrors `app/admin/TripEditor.tsx`'s inline edit/save pattern, plus a delete button (trips don't have one, but videos' admin flow does via `DELETE`):

```tsx
'use client'

import { useState } from 'react'

interface Transfer {
  id: string
  mode: 'boat' | 'plane'
  label: string
  from_lat: number
  from_lng: number
  to_lat: number
  to_lng: number
  start_date: string
  end_date: string | null
}

export function TransferEditor({ transfer, onDeleted }: { transfer: Transfer; onDeleted: () => void }) {
  const [mode, setMode] = useState(transfer.mode)
  const [label, setLabel] = useState(transfer.label)
  const [fromLat, setFromLat] = useState(String(transfer.from_lat))
  const [fromLng, setFromLng] = useState(String(transfer.from_lng))
  const [toLat, setToLat] = useState(String(transfer.to_lat))
  const [toLng, setToLng] = useState(String(transfer.to_lng))
  const [startDate, setStartDate] = useState(transfer.start_date)
  const [endDate, setEndDate] = useState(transfer.end_date ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)

  async function save() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/transfers/${transfer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          label,
          from_lat: parseFloat(fromLat),
          from_lng: parseFloat(fromLng),
          to_lat: parseFloat(toLat),
          to_lng: parseFloat(toLng),
          start_date: startDate,
          end_date: endDate || null,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm(`Delete transfer "${transfer.label}"?`)) return
    const res = await fetch(`/api/admin/transfers/${transfer.id}`, { method: 'DELETE' })
    if (res.ok) onDeleted()
    else setError('Failed to delete. Please try again.')
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="text-lg flex-shrink-0">{mode === 'boat' ? '⛴️' : '✈️'}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{transfer.label}</div>
          <div className="text-xs text-slate-500">
            {new Date(transfer.start_date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500"
        >
          {expanded ? 'Collapse' : 'Edit'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-700 px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'boat' | 'plane')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="boat">Boat</option>
                <option value="plane">Plane</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">From lat</label>
              <input value={fromLat} onChange={(e) => setFromLat(e.target.value)} inputMode="decimal"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">From lng</label>
              <input value={fromLng} onChange={(e) => setFromLng(e.target.value)} inputMode="decimal"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">To lat</label>
              <input value={toLat} onChange={(e) => setToLat(e.target.value)} inputMode="decimal"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">To lng</label>
              <input value={toLng} onChange={(e) => setToLng(e.target.value)} inputMode="decimal"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">End date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={remove} className="text-xs text-red-400 hover:text-red-300 transition-colors">
              Delete
            </button>
            <div className="flex items-center gap-3">
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                onClick={save}
                disabled={saving}
                className={`text-sm px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
                  saved ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write `app/admin/transfers/page.tsx`**

Server component listing transfers plus a client-side "Add transfer" form reusing the same fields (kept in this file as a small inline client component since it's the only place it's used):

```tsx
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { TransfersPageClient } from './TransfersPageClient'

async function getTransfers() {
  const supabase = createSupabaseClient()
  const { data } = await supabase
    .from('transfers')
    .select('id, mode, label, from_lat, from_lng, to_lat, to_lng, start_date, end_date')
    .order('start_date', { ascending: false })
  return data ?? []
}

export default async function TransfersAdminPage() {
  const transfers = await getTransfers()

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Transfers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{transfers.length} boat/plane hops</p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-600"
        >
          Back to trips
        </Link>
      </div>

      <TransfersPageClient initialTransfers={transfers as any} />
    </div>
  )
}
```

- [ ] **Step 3: Write `app/admin/transfers/TransfersPageClient.tsx`**

Owns the add-form + list state, delegates each row to `TransferEditor`:

```tsx
'use client'

import { useState } from 'react'
import { TransferEditor } from '../TransferEditor'

interface Transfer {
  id: string
  mode: 'boat' | 'plane'
  label: string
  from_lat: number
  from_lng: number
  to_lat: number
  to_lng: number
  start_date: string
  end_date: string | null
}

export function TransfersPageClient({ initialTransfers }: { initialTransfers: Transfer[] }) {
  const [transfers, setTransfers] = useState(initialTransfers)
  const [adding, setAdding] = useState(false)
  const [mode, setMode] = useState<'boat' | 'plane'>('boat')
  const [label, setLabel] = useState('')
  const [fromLat, setFromLat] = useState('')
  const [fromLng, setFromLng] = useState('')
  const [toLat, setToLat] = useState('')
  const [toLng, setToLng] = useState('')
  const [startDate, setStartDate] = useState('')
  const [error, setError] = useState('')

  async function add() {
    setError('')
    const res = await fetch('/api/admin/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode, label,
        from_lat: parseFloat(fromLat), from_lng: parseFloat(fromLng),
        to_lat: parseFloat(toLat), to_lng: parseFloat(toLng),
        start_date: startDate,
      }),
    })
    if (!res.ok) { setError('Failed to add transfer.'); return }
    const { id } = await res.json()
    setTransfers([{ id, mode, label, from_lat: parseFloat(fromLat), from_lng: parseFloat(fromLng), to_lat: parseFloat(toLat), to_lng: parseFloat(toLng), start_date: startDate, end_date: null }, ...transfers])
    setAdding(false)
    setLabel(''); setFromLat(''); setFromLng(''); setToLat(''); setToLng(''); setStartDate('')
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setAdding(!adding)}
        className="text-sm text-white bg-orange-500 hover:bg-orange-600 transition-colors px-4 py-2 rounded-lg font-medium"
      >
        {adding ? 'Cancel' : '+ Add transfer'}
      </button>

      {adding && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select value={mode} onChange={(e) => setMode(e.target.value as 'boat' | 'plane')}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="boat">Boat</option>
              <option value="plane">Plane</option>
            </select>
            <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <input placeholder="From lat" value={fromLat} onChange={(e) => setFromLat(e.target.value)} inputMode="decimal"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="From lng" value={fromLng} onChange={(e) => setFromLng(e.target.value)} inputMode="decimal"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="To lat" value={toLat} onChange={(e) => setToLat(e.target.value)} inputMode="decimal"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
            <input placeholder="To lng" value={toLng} onChange={(e) => setToLng(e.target.value)} inputMode="decimal"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
          <div className="flex items-center gap-3">
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button onClick={add} className="text-sm px-4 py-2 rounded-lg font-medium bg-orange-500 hover:bg-orange-600 text-white">
              Add
            </button>
          </div>
        </div>
      )}

      {transfers.length === 0 && !adding && (
        <div className="text-center py-12 text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
          No transfers yet.
        </div>
      )}
      {transfers.map((t) => (
        <TransferEditor key={t.id} transfer={t} onDeleted={() => setTransfers(transfers.filter((x) => x.id !== t.id))} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Add nav link in `app/admin/page.tsx`**

In the header nav div (`app/admin/page.tsx:25-39`), add a link next to the existing "Site content" link:

```tsx
<Link
  href="/admin/transfers"
  className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-600"
>
  Transfers
</Link>
```
Place it directly before the existing `Link href="/admin/site-content"` block.

- [ ] **Step 5: Manually verify in the browser**

Run `npm run dev`, log into `/admin`, click "Transfers", add a transfer (e.g. boat, Colón Panama → Cartagena Colombia, lat/lng of each), confirm it appears in the list, edit it, delete it.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 7: Commit**

```bash
git add app/admin/transfers app/admin/TransferEditor.tsx app/admin/page.tsx
git commit -m "feat: add admin UI for managing transfers"
```

---

### Task 5: Fetch transfers into `/map` page data

**Files:**
- Modify: `app/map/page.tsx`

- [ ] **Step 1: Add the transfers query**

In `getMapData()` (`app/map/page.tsx:80-108`), add a query to the `Promise.all` array and destructure its result:

```ts
const [{ data: trips }, { data: waypoints }, { data: plannedRoutes }, { data: videos }, { data: routeCities }, { data: routePois }, { data: siteContent }, { data: transfers }] = await Promise.all([
  // ...existing queries unchanged...
  supabase
    .from('transfers')
    .select('id, mode, label, from_lat, from_lng, to_lat, to_lng, start_date, end_date')
    .order('start_date', { ascending: true }),
])
```

- [ ] **Step 2: Include transfers in the return value**

At the end of `getMapData()` (`app/map/page.tsx:174-182`):

```ts
return {
  trips: formattedTrips,
  waypoints: waypoints ?? [],
  plannedRoutes: formattedPlannedRoutes,
  videos: formattedVideos,
  routeCities: filteredCities as { id: string; name: string; country: string; lat: number; lng: number; wiki_slug: string }[],
  routePois: filteredPois as { id: string; name: string; country: string; lat: number; lng: number; wiki_slug: string; type: 'mountain' | 'pass' | 'lake' }[],
  siteContent: siteContent ?? [],
  transfers: (transfers ?? []) as { id: string; mode: 'boat' | 'plane'; label: string; from_lat: number; from_lng: number; to_lat: number; to_lng: number; start_date: string; end_date: string | null }[],
}
```

- [ ] **Step 3: Destructure and pass through in `MapPage`**

At `app/map/page.tsx:202` and the `<MapClient>` call (`app/map/page.tsx:253`):

```ts
const { trips, waypoints, plannedRoutes, videos, routeCities, routePois, siteContent, transfers } = await getMapData()
```

```tsx
<MapClient trips={trips} waypoints={waypoints} plannedRoutes={plannedRoutes} videos={videos} locale={locale} stats={stats} currentTz={currentTz} vincentLat={vincentLat} vincentLng={vincentLng} vincentLastDate={vincentLastDate} riderLabel={riderLabel} routeCities={routeCities ?? []} routePois={routePois ?? []} transfers={transfers} />
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors in `MapClient`/`Map` about the unknown `transfers` prop — expected until Task 6 adds it. Confirm the error is only in those two files.

- [ ] **Step 5: Commit**

Combine with Task 6's commit (both are needed for a working build) — do not commit standalone.

---

### Task 6: Render transfers on the map

**Files:**
- Modify: `components/MapClient.tsx`
- Modify: `components/Map.tsx`

- [ ] **Step 1: Add `Transfer` interface and prop to `MapClient.tsx`**

After the `RoutePoi` interface (`components/MapClient.tsx:99-107`):

```ts
interface Transfer {
  id: string
  mode: 'boat' | 'plane'
  label: string
  from_lat: number
  from_lng: number
  to_lat: number
  to_lng: number
  start_date: string
  end_date: string | null
}
```

Add `transfers?: Transfer[]` to `MapClientProps` (`components/MapClient.tsx:109-124`), then update the function signature and passthrough (`components/MapClient.tsx:126-127`):

```tsx
export function MapClient({ trips, waypoints, plannedRoutes, videos, locale, externalHover, stats, currentTz, vincentLat, vincentLng, vincentLastDate, riderLabel, routeCities, routePois, transfers }: MapClientProps) {
  return <Map trips={trips} waypoints={waypoints} plannedRoutes={plannedRoutes} videos={videos} locale={locale} externalHover={externalHover} stats={stats} currentTz={currentTz} vincentLat={vincentLat} vincentLng={vincentLng} vincentLastDate={vincentLastDate} riderLabel={riderLabel} routeCities={routeCities ?? []} routePois={routePois ?? []} transfers={transfers ?? []} />
}
```

- [ ] **Step 2: Add `Transfer` interface and prop to `Map.tsx`**

After the `RoutePoi` interface (`components/Map.tsx:129-137`):

```ts
interface Transfer {
  id: string
  mode: 'boat' | 'plane'
  label: string
  from_lat: number
  from_lng: number
  to_lat: number
  to_lng: number
  start_date: string
  end_date: string | null
}
```

Add `transfers?: Transfer[]` to `MapProps` (`components/Map.tsx:103-118`) and destructure it in the component signature (`components/Map.tsx:320`):

```ts
export function Map({ trips, waypoints, plannedRoutes, videos, locale, externalHover, stats, currentTz, vincentLat, vincentLng, vincentLastDate, riderLabel, routeCities = [], routePois = [], transfers = [] }: MapProps) {
```

- [ ] **Step 3: Import the shared geo helper**

Add near the top of `components/Map.tsx` (alongside other imports):

```ts
import { geodesicArc } from '@/lib/geo'
```

(This import already exists from Task 2 — confirm it's present rather than adding a duplicate.)

- [ ] **Step 4: Add a `transferLayersRef` and pane creation**

Near the other layer refs (e.g. next to `plannedLinesRef` at `components/Map.tsx:352`):

```ts
const transferLayersRef = useRef<any[]>([])
```

Inside `initMap()`, near where `contourPane` is created (`components/Map.tsx:1518-1521` shows the pattern used elsewhere in a different effect — for this effect, create the pane once when the map is first built, right after `const map = L.map(...)` around `components/Map.tsx:1886`):

```ts
map.createPane('transferPane').style.zIndex = '410' // above trip polylines (typically overlayPane ~400), below markerPane (600)
```

- [ ] **Step 5: Draw transfer arcs and endpoint icon**

Add this block right after the planned-routes loop ends (`components/Map.tsx:2078`, after the closing `}` of the `for (let routeIdx ...)` loop, before the "Ensure trip hit zones are above planned route hit zones" comment):

```ts
// Boat/plane transfers — great-circle arcs, dashed, colored by mode
for (const transfer of transfers) {
  const arc = geodesicArc([transfer.from_lat, transfer.from_lng], [transfer.to_lat, transfer.to_lng])
  const color = transfer.mode === 'boat' ? '#38bdf8' : '#a78bfa'

  const line = L.polyline(arc, {
    color,
    weight: 3,
    opacity: 0.85,
    dashArray: '4, 8',
    pane: 'transferPane',
  }).addTo(map)

  const distanceKm = Math.round(haversineM(transfer.from_lat, transfer.from_lng, transfer.to_lat, transfer.to_lng) / 1000)
  const dateLabel = transfer.end_date && transfer.end_date !== transfer.start_date
    ? `${toDateStr(transfer.start_date)} → ${toDateStr(transfer.end_date)}`
    : toDateStr(transfer.start_date)

  line.bindPopup(`
    <div style="font-size:13px;line-height:1.5">
      <strong>${transfer.mode === 'boat' ? '⛴️' : '✈️'} ${transfer.label}</strong><br/>
      ${dateLabel}<br/>
      ${distanceKm} km
    </div>
  `)

  const mid = arc[Math.floor(arc.length / 2)]
  const icon = L.divIcon({
    className: '',
    html: `<div style="font-size:16px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.6))">${transfer.mode === 'boat' ? '⛴️' : '✈️'}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
  const marker = L.marker(mid, { icon, pane: 'transferPane' }).addTo(map)
  marker.bindPopup(line.getPopup()!.getContent() as string)

  transferLayersRef.current.push(line, marker)
}
```

- [ ] **Step 6: Add cleanup**

In the effect's cleanup function (`components/Map.tsx:2319-2330`), alongside the other `*Ref.current.forEach(m => m.remove())` lines:

```ts
transferLayersRef.current.forEach((l) => l.remove())
transferLayersRef.current = []
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 8: Manually verify in the browser**

With at least one transfer added via `/admin/transfers`, load `/map` and confirm:
- A dashed arc renders between the two points, curved appropriately on longer east-west spans (e.g. try two points ~150° of longitude apart to see the great-circle bow, vs a straight rhumb line)
- The color matches the mode (sky blue for boat, violet for plane)
- Clicking the line or the midpoint icon shows the popup with label, date, and distance
- The arc does not affect the stats bar (rides count, total km, elevation, Americas-crossing %) — compare before/after adding a transfer

- [ ] **Step 9: Commit**

```bash
git add components/Map.tsx components/MapClient.tsx app/map/page.tsx
git commit -m "feat: render boat/plane transfers as great-circle arcs on the map"
```

---

### Task 7: Update `lib/version.ts`

**Files:**
- Modify: `lib/version.ts`

- [ ] **Step 1: Bump the version**

Per `CLAUDE.md`, increment `APP_VERSION` on every commit touching user-visible features. Check the current value first (it may have moved since this plan was written) and bump the patch number:

```ts
export const APP_VERSION = '1.5.6'
```

- [ ] **Step 2: Add a changelog entry in `AboutModal.tsx`**

Find the Journal tab's changelog array in `components/AboutModal.tsx` and add an entry for this version following the existing format (version + Swiss 4000m peak name + elevation + date + description) — pick the next unused peak in the sequence documented in `CLAUDE.md`'s "About Modal Changelog" section.

- [ ] **Step 3: Commit**

```bash
git add lib/version.ts components/AboutModal.tsx
git commit -m "chore: bump version for transfers feature"
```
