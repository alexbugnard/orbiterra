'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useState, useEffect } from 'react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => { setLoading(false) }, [locale])

  async function switchLocale(next: string) {
    if (next === locale || loading) return
    setLoading(true)
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    })
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 text-sm bg-slate-800 rounded-lg p-1 relative">
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-800/80 backdrop-blur-sm z-10">
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
          </svg>
        </span>
      )}
      <button
        onClick={() => switchLocale('fr')}
        disabled={loading}
        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
          locale === 'fr'
            ? 'bg-slate-700 text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => switchLocale('en')}
        disabled={loading}
        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
          locale === 'en'
            ? 'bg-slate-700 text-white'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        EN
      </button>
    </div>
  )
}
