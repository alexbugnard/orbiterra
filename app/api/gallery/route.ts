import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export type GalleryItem =
  | { kind: 'photo'; id: string; url: string; title: string; date: string }
  | { kind: 'video'; id: string; youtube_id: string; title: string; date: string }

export async function GET() {
  const supabase = createSupabaseClient()

  const [waypointsResult, videosResult] = await Promise.all([
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

  if (waypointsResult.error) return NextResponse.json({ error: waypointsResult.error.message }, { status: 500 })
  if (videosResult.error) return NextResponse.json({ error: videosResult.error.message }, { status: 500 })

  const photos: GalleryItem[] = (waypointsResult.data ?? []).map((w) => ({
    kind: 'photo',
    id: String(w.id),
    url: w.url_large as string,
    title: w.title ?? '',
    date: w.taken_at ?? '',
  }))

  const vids: GalleryItem[] = (videosResult.data ?? []).map((v) => ({
    kind: 'video',
    id: String(v.id),
    youtube_id: v.youtube_id as string,
    title: v.title ?? '',
    date: v.published_at ?? '',
  }))

  const merged = [...photos, ...vids].sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  return NextResponse.json(merged)
}
