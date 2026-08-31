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
