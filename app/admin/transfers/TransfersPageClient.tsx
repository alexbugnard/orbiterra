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
