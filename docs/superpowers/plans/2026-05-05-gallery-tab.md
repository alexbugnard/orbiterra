# Gallery Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Gallery" tab to the About modal showing photos and videos in a 3-column grid with a fullscreen lightbox.

**Architecture:** A new `/api/gallery` route merges `waypoints` (photos) and `videos`, sorted by date. The `AboutModal` gains a `gallery` tab that fetches this endpoint and renders a square grid. A lightbox overlay sits above the modal and handles fullscreen view with prev/next navigation.

**Tech Stack:** Next.js App Router API route, React state, Tailwind/inline styles (matching existing modal style), no new dependencies.

---

### Task 1: Add `/api/gallery` route

**Files:**
- Create: `app/api/gallery/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export type GalleryItem =
  | { kind: 'photo'; id: string; url: string; title: string; date: string }
  | { kind: 'video'; id: string; youtube_id: string; title: string; date: string }

export async function GET() {
  const supabase = createSupabaseClient()

  const [{ data: waypoints }, { data: videos }] = await Promise.all([
    supabase
      .from('waypoints')
      .select('id, url_large, title, taken_at')
      .not('url_large', 'is', null)
      .order('taken_at', { ascending: false }),
    supabase
      .from('videos')
      .select('id, youtube_id, title, published_at')
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false }),
  ])

  const photos: GalleryItem[] = (waypoints ?? []).map((w) => ({
    kind: 'photo',
    id: String(w.id),
    url: w.url_large,
    title: w.title ?? '',
    date: w.taken_at ?? '',
  }))

  const vids: GalleryItem[] = (videos ?? []).map((v) => ({
    kind: 'video',
    id: String(v.id),
    youtube_id: v.youtube_id,
    title: v.title ?? '',
    date: v.published_at ?? '',
  }))

  const merged = [...photos, ...vids].sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  return NextResponse.json(merged)
}
```

- [ ] **Step 2: Test the endpoint**

Open `http://localhost:3000/api/gallery` in the browser. Expected: JSON array with objects that have `kind`, `id`, `url` or `youtube_id`, `title`, `date`.

- [ ] **Step 3: Commit**

```bash
git add app/api/gallery/route.ts
git commit -m "feat: add /api/gallery endpoint merging photos and videos"
```

---

### Task 2: Update `AboutModal` — add Gallery tab and remove Videos section

**Files:**
- Modify: `components/AboutModal.tsx`

- [ ] **Step 1: Add `GalleryItem` type and `gallery` state**

At the top of `AboutModal.tsx`, add the import and extend state:

```ts
import type { GalleryItem } from '@/app/api/gallery/route'
```

Replace:
```ts
const [videos, setVideos] = useState<Video[]>([])
const [activeVideo, setActiveVideo] = useState<string | null>(null)
const [tab, setTab] = useState<'about' | 'guide' | 'setup'>('about')
```

With:
```ts
const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
const [tab, setTab] = useState<'about' | 'gallery' | 'guide' | 'setup'>('about')
const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
```

- [ ] **Step 2: Replace videos fetch with gallery fetch**

Replace:
```ts
useEffect(() => {
  fetch('/api/videos')
    .then((r) => r.json())
    .then((data) => Array.isArray(data) && setVideos(data))
    .catch(() => {})
}, [])
```

With:
```ts
useEffect(() => {
  fetch('/api/gallery')
    .then((r) => r.json())
    .then((data) => Array.isArray(data) && setGalleryItems(data))
    .catch(() => {})
}, [])
```

- [ ] **Step 3: Update Escape key handler to close lightbox first**

Replace:
```ts
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (activeVideo) setActiveVideo(null)
    else onClose()
  }
}
```

With:
```ts
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (lightboxIndex !== null) setLightboxIndex(null)
    else onClose()
  }
  if (e.key === 'ArrowLeft') {
    setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))
  }
  if (e.key === 'ArrowRight') {
    setLightboxIndex((i) => (i !== null && i < galleryItems.length - 1 ? i + 1 : i))
  }
}
```

Also update the dependency array:
```ts
}, [onClose, lightboxIndex, galleryItems.length])
```

- [ ] **Step 4: Update the tab list**

Replace:
```ts
{(['about', 'guide', 'setup'] as const).map((t2) => (
```

With:
```ts
{(['about', 'gallery', 'guide', 'setup'] as const).map((t2) => (
```

Replace the tab label logic:
```ts
{t2 === 'about' ? t('title') : t2 === 'guide' ? t('guideTab') : 'Setup'}
```

With:
```ts
{t2 === 'about' ? t('title') : t2 === 'gallery' ? '📷' : t2 === 'guide' ? t('guideTab') : 'Setup'}
```

- [ ] **Step 5: Remove the Videos section from the About tab**

In the About tab JSX, delete the entire Videos `<section>` block and the `<div className="border-t border-slate-700/50" />` that precedes it (lines ~213–262 in the original file). Also remove the `Video` interface and `activeVideo` references if any remain.

- [ ] **Step 6: Add Gallery tab JSX**

Add this block after the Guide tab JSX (`{tab === 'guide' && ...}`):

```tsx
{/* Gallery tab */}
{tab === 'gallery' && (
  <div className="flex-1 overflow-y-auto p-4">
    {galleryItems.length === 0 ? (
      <p className="text-slate-500 text-sm italic text-center mt-8">Aucune photo ou vidéo disponible.</p>
    ) : (
      <div className="grid grid-cols-3 gap-1">
        {galleryItems.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setLightboxIndex(idx)}
            className="relative aspect-square overflow-hidden bg-slate-800 hover:opacity-90 transition-opacity"
          >
            {item.kind === 'photo' ? (
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <>
                <img
                  src={`https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg`}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <polygon points="5,3 19,12 5,21"/>
                    </svg>
                  </div>
                </div>
              </>
            )}
          </button>
        ))}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 7: Add Lightbox overlay**

Add this block just before the closing `</div>` of the modal (before `{/* Footer */}`):

```tsx
{/* Lightbox */}
{lightboxIndex !== null && galleryItems[lightboxIndex] && (() => {
  const item = galleryItems[lightboxIndex]
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.95)' }}
      onClick={() => setLightboxIndex(null)}
    >
      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-slate-400 text-xs">
        {lightboxIndex + 1} / {galleryItems.length}
      </div>

      {/* Close */}
      <button
        onClick={() => setLightboxIndex(null)}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>

      {/* Prev */}
      {lightboxIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
      )}

      {/* Next */}
      {lightboxIndex < galleryItems.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,18 15,12 9,6"/>
          </svg>
        </button>
      )}

      {/* Content */}
      <div
        className="max-w-[90%] max-h-[85%] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {item.kind === 'photo' ? (
          <img
            src={item.url}
            alt={item.title}
            className="max-w-full max-h-[75vh] object-contain rounded-lg"
          />
        ) : (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${item.youtube_id}?autoplay=1`}
            title={item.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-[70vw] max-w-3xl aspect-video rounded-lg"
          />
        )}
        {item.title && (
          <p className="text-slate-300 text-sm text-center">{item.title}</p>
        )}
      </div>
    </div>
  )
})()}
```

- [ ] **Step 8: Commit**

```bash
git add components/AboutModal.tsx
git commit -m "feat: add gallery tab with lightbox to About modal, remove videos section"
```

---

### Task 3: Increment app version

**Files:**
- Modify: `lib/version.ts`

- [ ] **Step 1: Bump version**

Open `lib/version.ts` and increment `APP_VERSION` by a patch (e.g. `1.2.3` → `1.2.4`).

- [ ] **Step 2: Commit**

```bash
git add lib/version.ts
git commit -m "chore: bump version"
```
