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
