'use client'

import { useEffect, useState } from 'react'

// Simple solar noon / sunrise / sunset via NOAA algorithm
function solarTimes(lat: number, lng: number, date: Date): { sunrise: Date; sunset: Date } | null {
  const rad = Math.PI / 180
  const deg = 180 / Math.PI

  const jd = date.getTime() / 86400000 + 2440587.5
  const n = jd - 2451545.0

  const L = (280.46 + 0.9856474 * n) % 360
  const g = (357.528 + 0.9856003 * n) % 360
  const lambda = L + 1.915 * Math.sin(g * rad) + 0.02 * Math.sin(2 * g * rad)
  const epsilon = 23.439 - 0.0000004 * n
  const sinDec = Math.sin(epsilon * rad) * Math.sin(lambda * rad)
  const dec = Math.asin(sinDec) * deg

  const cosHA = (Math.cos(90.833 * rad) - Math.sin(lat * rad) * Math.sin(dec * rad)) /
    (Math.cos(lat * rad) * Math.cos(dec * rad))

  if (cosHA < -1 || cosHA > 1) return null // polar day / night

  const ha = Math.acos(cosHA) * deg

  const eot = (L - lambda) * 4 // equation of time (minutes approx)
  const solarNoonMin = 720 - 4 * lng - eot

  const sunriseMin = solarNoonMin - ha * 4
  const sunsetMin = solarNoonMin + ha * 4

  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  return {
    sunrise: new Date(dayStart.getTime() + sunriseMin * 60000),
    sunset: new Date(dayStart.getTime() + sunsetMin * 60000),
  }
}

function fmtTime(date: Date, tz: string) {
  return date.toLocaleTimeString('fr-CH', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false })
}

export function LocalTime({ tz, lat, lng }: { tz: string; lat?: number | null; lng?: number | null }) {
  const [time, setTime] = useState('')
  const [sun, setSun] = useState<{ sunrise: string; sunset: string } | null>(null)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('fr-CH', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }))
      if (lat != null && lng != null) {
        const times = solarTimes(lat, lng, now)
        setSun(times ? { sunrise: fmtTime(times.sunrise, tz), sunset: fmtTime(times.sunset, tz) } : null)
      }
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [tz, lat, lng])

  if (!time) return null

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[9px] text-slate-500 uppercase tracking-widest">Heure locale</div>
      <div className="font-mono text-sm font-bold text-cyan-400 tabular-nums tracking-wider">{time}</div>
      {sun && (
        <div className="flex items-center gap-2 text-[10px] text-slate-400 tabular-nums">
          <span>↑ {sun.sunrise}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="4"/>
            <line x1="12" y1="2" x2="12" y2="5"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
            <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
            <line x1="2" y1="12" x2="5" y2="12"/>
            <line x1="19" y1="12" x2="22" y2="12"/>
            <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
            <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
          </svg>
          <span>↓ {sun.sunset}</span>
        </div>
      )}
      <div className="text-[9px] text-slate-600">{tz}</div>
    </div>
  )
}
