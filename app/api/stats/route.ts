import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

function computeElevationGain(elevation: [number, number][]): number {
  let gain = 0
  for (let i = 1; i < elevation.length; i++) {
    const diff = elevation[i][1] - elevation[i - 1][1]
    if (diff > 0) gain += diff
  }
  return gain
}

export async function GET() {
  const supabase = createSupabaseClient()

  const [{ data: trips }, { count: photosCount }, { data: siteContent }] = await Promise.all([
    supabase.from('trips').select('distance_m, start_date, max_speed_ms, elev_high, country, elevation, start_lat, start_lng').eq('visible', true),
    supabase.from('waypoints').select('id', { count: 'exact', head: true }),
    supabase.from('site_content').select('key, value').eq('key', 'punctures'),
  ])

  const punctures = parseInt(siteContent?.[0]?.value ?? '0', 10)

  const tripList = trips ?? []
  const totalKm = Math.round(tripList.reduce((sum, t) => sum + (t.distance_m ?? 0), 0) / 1000)

  const sortedDates = tripList.map(t => t.start_date).filter(Boolean).sort()
  const firstDate = sortedDates[0] ? new Date(sortedDates[0]) : null
  const daysSinceDeparture = firstDate ? Math.floor((Date.now() - firstDate.getTime()) / 86400000) : 0
  const daysOnBike = new Set(sortedDates.map(d => d?.slice(0, 10))).size
  const longestRideKm = Math.round(Math.max(0, ...tripList.map(t => (t.distance_m ?? 0) / 1000)))
  const avgKmPerBikeDay = daysOnBike > 0 ? Math.round(totalKm / daysOnBike) : 0
  const maxSpeedMs = Math.max(0, ...tripList.map(t => t.max_speed_ms ?? 0))
  const topSpeedKmh = maxSpeedMs > 0 ? Math.round(maxSpeedMs * 3.6) : null
  const highestPointM = tripList.some(t => t.elev_high != null) ? Math.max(...tripList.map(t => t.elev_high ?? 0)) : null
  const countries = [...new Set(tripList.map(t => t.country).filter(Boolean))]
  const totalElevationGainM = Math.round(tripList.reduce((sum, t) => {
    const elev = t.elevation as [number, number][] | null
    return sum + (elev ? computeElevationGain(elev) : 0)
  }, 0))
  const avgElevGainPerDay = daysOnBike > 0 ? Math.round(totalElevationGainM / daysOnBike) : 0

  // Eddington number: largest E where at least E rides have distance >= E km
  const ridekms = tripList.map(t => (t.distance_m ?? 0) / 1000).sort((a, b) => b - a)
  let eddington = 0
  for (let i = 0; i < ridekms.length; i++) {
    if (ridekms[i] >= i + 1) eddington = i + 1
    else break
  }

  // Col du Jaun equivalents: total elevation gain / 484m
  const jaunpassCount = Math.floor(totalElevationGainM / 484)

  // Bénichon missed: 2nd Saturday of October each year since departure
  function secondSaturdayOfOctober(year: number): Date {
    const oct1 = new Date(year, 9, 1) // months are 0-indexed
    const dayOfWeek = oct1.getDay() // 0=Sun, 6=Sat
    const firstSat = dayOfWeek === 6 ? oct1 : new Date(year, 9, 1 + (6 - dayOfWeek + 7) % 7)
    return new Date(firstSat.getFullYear(), firstSat.getMonth(), firstSat.getDate() + 7)
  }
  let benichouCount = 0
  if (firstDate) {
    const now = new Date()
    for (let y = firstDate.getFullYear(); y <= now.getFullYear(); y++) {
      const benichou = secondSaturdayOfOctober(y)
      if (benichou > firstDate && benichou <= now) benichouCount++
    }
  }

  return NextResponse.json({
    totalKm,
    rideCount: tripList.length,
    daysSinceDeparture,
    daysOnBike,
    longestRideKm,
    avgKmPerBikeDay,
    topSpeedKmh,
    highestPointM,
    totalElevationGainM,
    countriesCount: countries.length,
    photosCount: photosCount ?? 0,
    avgElevGainPerDay,
    eddington,
    jaunpassCount,
    benichouCount,
    punctures,
    vincentLat: [...tripList].sort((a, b) => (a.start_date ?? '') > (b.start_date ?? '') ? 1 : -1).at(-1)?.start_lat ?? null,
    vincentLng: [...tripList].sort((a, b) => (a.start_date ?? '') > (b.start_date ?? '') ? 1 : -1).at(-1)?.start_lng ?? null,
  })
}
