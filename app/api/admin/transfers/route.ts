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
