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
