'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { MapClient } from '@/components/MapClient'
import { ElevationProfile } from '@/components/ElevationProfile'
import { computeElevationGain } from '@/lib/strava'

interface Waypoint {
  id: string
  lat: number
  lng: number
  url_large: string
  title: string | null
}

interface Trip {
  id: string
  name: string
  start_date: string
  distance_m: number
  journal_fr: string | null
  journal_en: string | null
  coordinates: [number, number][]
  elevation: [number, number][] | null
  start_lat: number | null
  start_lng: number | null
  max_speed_ms: number | null
  max_speed_distance_m: number | null
  elev_high: number | null
  breaks: { lat: number; lng: number; duration_min: number; distance_m: number }[] | null
  max_speed_lat: number | null
  max_speed_lng: number | null
  elev_high_lat: number | null
  elev_high_lng: number | null
}

interface TripViewClientProps {
  trip: Trip
  waypoints: Waypoint[]
  locale: string
  backLabel: string
  distanceKm: string
  date: string
  journal: string | null
  youtubeId: string | null
}

export function TripViewClient({
  trip,
  waypoints,
  locale,
  backLabel,
  distanceKm,
  date,
  journal,
  youtubeId,
}: TripViewClientProps) {
  const t = useTranslations('trip')
  const [hoveredDistance, setHoveredDistance] = useState<number | null>(null)
  const [videoActive, setVideoActive] = useState(false)
  const [videoHovered, setVideoHovered] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const elevationMarkers = (() => {
    const markers: { distanceM: number; label: string; color: string }[] = []
    if (trip.elevation && trip.elevation.length > 1) {
      // Max altitude: find the distance of the highest point in the profile
      let maxAlt = -Infinity
      let maxAltDist = 0
      for (const [d, a] of trip.elevation) {
        if (a > maxAlt) { maxAlt = a; maxAltDist = d }
      }
      markers.push({ distanceM: maxAltDist, label: `▲ ${Math.round(maxAlt)} m`, color: '#10b981' })

      // Max speed
      if (trip.max_speed_ms != null && trip.max_speed_distance_m != null) {
        markers.push({
          distanceM: trip.max_speed_distance_m,
          label: `MAX ${Math.round(trip.max_speed_ms * 3.6)} km/h`,
          color: '#3b82f6',
        })
      }

      // Breaks
      if (trip.breaks) {
        for (const b of trip.breaks) {
          markers.push({ distanceM: b.distance_m, label: `⏸ ${b.duration_min} min`, color: '#f59e0b' })
        }
      }
    }
    return markers
  })()

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] bg-slate-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800" style={{ background: 'rgba(15,23,42,0.95)' }}>
        <Link
          href="/map"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors mb-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          {backLabel}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white leading-tight truncate">{trip.name}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{date}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xl font-bold text-orange-400">{distanceKm}</div>
              <div className="text-xs text-slate-500">km</div>
            </div>
            {trip.elevation && trip.elevation.length > 1 && (
              <>
                <div className="w-px h-8 bg-slate-700" />
                <div className="text-right">
                  <div className="text-xl font-bold text-white">↑ {computeElevationGain(trip.elevation).toLocaleString()}</div>
                  <div className="text-xs text-slate-500">{t('mGain')}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {journal && (
          <p className="mt-3 text-sm text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
            {journal}
          </p>
        )}

        {youtubeId && (
          <div
            className="mt-2 relative inline-block"
            onMouseEnter={() => setVideoHovered(true)}
            onMouseLeave={() => setVideoHovered(false)}
          >
            <button
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 text-xs font-medium transition-colors"
              onClick={() => setVideoHovered(true)}
              aria-label="Voir la vidéo"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              Vidéo
            </button>

            {videoHovered && (
              <div className="absolute left-0 bottom-full mb-2 z-50 w-56 rounded-xl overflow-hidden border border-slate-700 shadow-2xl" style={{ background: 'rgba(15,23,42,0.97)' }}>
                {videoActive ? (
                  <div className="relative">
                    <iframe
                      ref={iframeRef}
                      src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      className="w-full"
                      style={{ height: '105px' }}
                    />
                    <button
                      onClick={() => iframeRef.current?.requestFullscreen()}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded p-0.5 transition-colors"
                      aria-label="Fullscreen"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button className="relative w-full group" onClick={() => setVideoActive(true)}>
                    <img
                      src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                      alt="Vidéo"
                      className="w-full"
                      style={{ height: '105px', objectFit: 'cover' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {trip.elevation && trip.elevation.length > 1 && (
          <div className="mt-3 border-t border-slate-800 pt-3">
            <ElevationProfile
              points={trip.elevation}
              hoveredDistance={hoveredDistance}
              onHoverDistance={setHoveredDistance}
              markers={elevationMarkers}
              gainLabel={t('mGain')}
            />
          </div>
        )}
      </div>

      <div className="flex-1">
        <MapClient
          trips={[trip]}
          waypoints={waypoints ?? []}
          plannedRoutes={[]}
          videos={[]}
          locale={locale}
          externalHover={{ distance: hoveredDistance, onDistance: setHoveredDistance }}
        />
      </div>
    </div>
  )
}
