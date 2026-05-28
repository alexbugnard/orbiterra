'use client'

import { useState } from 'react'
import { StatHunterModal, type StatHunterStats } from './StatHunterModal'

export function StatHunterButton() {
  const [open, setOpen] = useState(false)
  const [stats, setStats] = useState<StatHunterStats | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleOpen() {
    setOpen(true)
    if (!stats) {
      setLoading(true)
      try {
        const res = await fetch('/api/stats')
        setStats(await res.json())
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
        aria-label="StatHunter"
      >
        <span className="text-base leading-none">🏆</span>
        <span className="hidden md:inline text-sm">StatHunter</span>
      </button>
      {open && stats && <StatHunterModal stats={stats} onClose={() => setOpen(false)} />}
      {open && loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="text-slate-400 text-sm animate-pulse">Chargement des stats…</div>
        </div>
      )}
    </>
  )
}
