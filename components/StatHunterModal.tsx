'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocale } from 'next-intl'

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

const PLACES: { id: string; lat: number; lng: number; label: string; labelEn: string; group: string }[] = [
  { id: 'northpole',     lat: 90,       lng: 0,        label: 'Pôle Nord 🧭',            labelEn: 'North Pole 🧭',           group: '🌟 Iconique' },
  { id: 'southpole',     lat: -90,      lng: 0,        label: 'Pôle Sud 🐧',             labelEn: 'South Pole 🐧',           group: '🌟 Iconique' },
  { id: 'jaun',          lat: 46.567,   lng: 7.283,    label: 'Jaun 🏡',                labelEn: 'Jaun 🏡',                group: '🇨🇭 Suisse' },
  { id: 'charmey',       lat: 46.617,   lng: 7.183,    label: 'Charmey 🏡',             labelEn: 'Charmey 🏡',             group: '🇨🇭 Suisse' },
  { id: 'everest',       lat: 27.988,   lng: 86.925,   label: 'Everest 🏔️',             labelEn: 'Everest 🏔️',             group: '🏔️ Sommets' },
  { id: 'elbrus',        lat: 43.350,   lng: 42.445,   label: 'Mont Elbrouz 🏔️',         labelEn: 'Mount Elbrus 🏔️',        group: '🏔️ Sommets' },
  { id: 'kilimanjaro',   lat: -3.066,   lng: 37.359,   label: 'Kilimandjaro 🏔️',         labelEn: 'Kilimanjaro 🏔️',         group: '🏔️ Sommets' },
  { id: 'montblanc',     lat: 45.833,   lng: 6.865,    label: 'Mont Blanc 🏔️',           labelEn: 'Mont Blanc 🏔️',          group: '🏔️ Sommets' },
  { id: 'denali',        lat: 63.069,   lng: -151.007, label: 'Denali 🏔️',              labelEn: 'Denali 🏔️',              group: '🏔️ Sommets' },
  { id: 'logan',         lat: 60.566,   lng: -140.408, label: 'Mont Logan 🏔️',           labelEn: 'Mount Logan 🏔️',         group: '🏔️ Sommets' },
  { id: 'orizaba',       lat: 19.029,   lng: -97.270,  label: 'Pico de Orizaba 🏔️',      labelEn: 'Pico de Orizaba 🏔️',     group: '🏔️ Sommets' },
  { id: 'tajumulco',     lat: 15.046,   lng: -91.905,  label: 'Volcán Tajumulco 🌋',      labelEn: 'Volcán Tajumulco 🌋',     group: '🏔️ Sommets' },
  { id: 'baru',          lat: 8.808,    lng: -82.543,  label: 'Volcán Barú 🌋',           labelEn: 'Volcán Barú 🌋',          group: '🏔️ Sommets' },
  { id: 'huascaran',     lat: -9.122,   lng: -77.604,  label: 'Huascarán 🏔️',            labelEn: 'Huascarán 🏔️',           group: '🏔️ Sommets' },
  { id: 'chimborazo',    lat: -1.469,   lng: -78.817,  label: 'Chimborazo 🏔️',           labelEn: 'Chimborazo 🏔️',          group: '🏔️ Sommets' },
  { id: 'aconcagua',     lat: -32.654,  lng: -70.011,  label: 'Aconcagua 🏔️',            labelEn: 'Aconcagua 🏔️',           group: '🏔️ Sommets' },
  { id: 'tokyo',         lat: 35.676,   lng: 139.650,  label: 'Tokyo 🗾',               labelEn: 'Tokyo 🗾',               group: '🌍 Monde' },
  { id: 'hawaii',        lat: 21.307,   lng: -157.858, label: 'Hawaï 🌺',               labelEn: 'Hawaii 🌺',              group: '🌍 Monde' },
  { id: 'vancouver',     lat: 49.283,   lng: -123.121, label: 'Vancouver 🌲',            labelEn: 'Vancouver 🌲',           group: '🌎 Amérique du Nord' },
  { id: 'ottawa',        lat: 45.421,   lng: -75.697,  label: 'Ottawa 🍁',              labelEn: 'Ottawa 🍁',              group: '🌎 Amérique du Nord' },
  { id: 'washington',    lat: 38.907,   lng: -77.037,  label: 'White House 🏛️',          labelEn: 'White House 🏛️',         group: '🌎 Amérique du Nord' },
  { id: 'lasvegas',      lat: 36.113,   lng: -115.177, label: 'Bellagio Las Vegas 🎰',   labelEn: 'Bellagio Las Vegas 🎰',  group: '🌎 Amérique du Nord' },
  { id: 'sanfrancisco',  lat: 37.775,   lng: -122.419, label: 'San Francisco 🌉',        labelEn: 'San Francisco 🌉',       group: '🌎 Amérique du Nord' },
  { id: 'denver',        lat: 39.739,   lng: -104.990, label: 'Denver 🏔️',              labelEn: 'Denver 🏔️',             group: '🌎 Amérique du Nord' },
  { id: 'dallas',        lat: 32.777,   lng: -96.797,  label: 'Dallas 🤠',              labelEn: 'Dallas 🤠',              group: '🌎 Amérique du Nord' },
  { id: 'lakelouise',    lat: 51.425,   lng: -116.177, label: 'Lac Louise 🏞️',           labelEn: 'Lake Louise 🏞️',         group: '🌎 Amérique du Nord' },
  { id: 'mexicocity',    lat: 19.433,   lng: -99.133,  label: 'Mexico 🌮',              labelEn: 'Mexico City 🌮',         group: '🌎 Amérique centrale' },
  { id: 'guatemala',     lat: 14.635,   lng: -90.507,  label: 'Guatemala 🏙️',           labelEn: 'Guatemala City 🏙️',      group: '🌎 Amérique centrale' },
  { id: 'sansalvador',   lat: 13.693,   lng: -89.218,  label: 'San Salvador 🏙️',        labelEn: 'San Salvador 🏙️',        group: '🌎 Amérique centrale' },
  { id: 'tegucigalpa',   lat: 14.072,   lng: -87.206,  label: 'Tegucigalpa 🏙️',         labelEn: 'Tegucigalpa 🏙️',         group: '🌎 Amérique centrale' },
  { id: 'managua',       lat: 12.133,   lng: -86.250,  label: 'Managua 🏙️',             labelEn: 'Managua 🏙️',             group: '🌎 Amérique centrale' },
  { id: 'sanjose',       lat: 9.928,    lng: -84.091,  label: 'San José 🏙️',            labelEn: 'San José 🏙️',            group: '🌎 Amérique centrale' },
  { id: 'panama',        lat: 8.994,    lng: -79.520,  label: 'Panama (canal) 🚢',       labelEn: 'Panama Canal 🚢',        group: '🌎 Amérique centrale' },
  { id: 'bogota',        lat: 4.711,    lng: -74.072,  label: 'Bogotá 🇨🇴',              labelEn: 'Bogotá 🇨🇴',              group: '🌎 Amérique du Sud' },
  { id: 'quito',         lat: -0.181,   lng: -78.468,  label: 'Quito 🇪🇨',               labelEn: 'Quito 🇪🇨',               group: '🌎 Amérique du Sud' },
  { id: 'lima',          lat: -12.046,  lng: -77.043,  label: 'Lima 🇵🇪',               labelEn: 'Lima 🇵🇪',               group: '🌎 Amérique du Sud' },
  { id: 'machupicchu',   lat: -13.163,  lng: -72.545,  label: 'Machu Picchu 🏔️',        labelEn: 'Machu Picchu 🏔️',       group: '🌎 Amérique du Sud' },
  { id: 'titicaca',      lat: -15.840,  lng: -69.335,  label: 'Lac Titicaca 🏔️',         labelEn: 'Lake Titicaca 🏔️',      group: '🌎 Amérique du Sud' },
  { id: 'lapaz',         lat: -16.500,  lng: -68.150,  label: 'La Paz 🏔️',              labelEn: 'La Paz 🏔️',             group: '🌎 Amérique du Sud' },
  { id: 'sucre',         lat: -19.020,  lng: -65.263,  label: 'Sucre 🏛️',               labelEn: 'Sucre 🏛️',              group: '🌎 Amérique du Sud' },
  { id: 'uyuni',         lat: -20.134,  lng: -67.489,  label: 'Salar de Uyuni 🧂',       labelEn: 'Salar de Uyuni 🧂',     group: '🌎 Amérique du Sud' },
  { id: 'santiago',      lat: -33.449,  lng: -70.669,  label: 'Santiago 🇨🇱',            labelEn: 'Santiago 🇨🇱',            group: '🌎 Amérique du Sud' },
  { id: 'buenosaires',   lat: -34.604,  lng: -58.382,  label: 'Buenos Aires 🥩',         labelEn: 'Buenos Aires 🥩',        group: '🌎 Amérique du Sud' },
  { id: 'ushuaia',       lat: -54.802,  lng: -68.303,  label: 'Ushuaia 🏁',             labelEn: 'Ushuaia 🏁',            group: '🌎 Amérique du Sud' },
]

export interface StatHunterStats {
  totalKm: number
  rideCount: number
  daysSinceDeparture: number
  daysOnBike: number
  longestRideKm: number
  avgKmPerBikeDay: number
  topSpeedKmh: number | null
  highestPointM: number | null
  totalElevationGainM: number
  countriesCount: number
  photosCount: number
  avgElevGainPerDay: number
  eddington: number
  jaunpassCount: number
  benichouCount: number
  punctures: number
  vincentLat: number | null
  vincentLng: number | null
}

interface Props {
  stats: StatHunterStats
  onClose: () => void
}

function InfoTooltip({ fr, en }: { fr: string; en: string }) {
  const locale = useLocale()
  const [visible, setVisible] = useState(false)
  const text = locale === 'fr' ? fr : en

  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setVisible(v => !v) }}
        className="w-6 h-6 rounded-full flex items-center justify-center font-bold transition-all"
        style={{
          fontSize: 12,
          background: 'rgba(249,115,22,0.15)',
          border: '1px solid rgba(249,115,22,0.6)',
          color: '#fb923c',
          boxShadow: '0 0 8px rgba(249,115,22,0.5), 0 0 16px rgba(249,115,22,0.2)',
        }}
      >
        i
      </button>
      {visible && (
        <div
          className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg p-3 text-xs text-slate-300 leading-relaxed shadow-xl"
          style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(249,115,22,0.3)' }}
        >
          {text}
          <button onClick={() => setVisible(false)} className="block mt-2 text-slate-500 hover:text-slate-300 text-xs">
            ✕ Fermer
          </button>
        </div>
      )}
    </div>
  )
}

function LinkButton({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 font-medium transition-all"
      style={{ fontSize: 11, color: '#fb923c', textShadow: '0 0 6px rgba(249,115,22,0.6)' }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
      {label}
    </a>
  )
}

function WikiButton({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
      style={{ fontSize: 10 }}
      title="Wikipedia"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
      Wiki
    </a>
  )
}

function PlaceSelect({ value, onChange, locale }: { value: string; onChange: (id: string) => void; locale: string }) {
  const groups = [...new Set(PLACES.map(p => p.group))]
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onClick={e => e.stopPropagation()}
      className="flex-1 min-w-0 text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer"
      style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(51,65,85,0.8)', color: '#fb923c' }}
    >
      {groups.map(group => (
        <optgroup key={group} label={group}>
          {PLACES.filter(p => p.group === group).map(p => (
            <option key={p.id} value={p.id}>{locale === 'fr' ? p.label : p.labelEn}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

function ProximityCard({ vincentLat, vincentLng, locale, mobile }: { vincentLat: number; vincentLng: number; locale: string; mobile?: boolean }) {
  const [idA, setIdA] = useState('charmey')
  const [idB, setIdB] = useState('northpole')
  const placeA = PLACES.find(p => p.id === idA) ?? PLACES[0]
  const placeB = PLACES.find(p => p.id === idB) ?? PLACES[1]
  const distA = haversineKm(vincentLat, vincentLng, placeA.lat, placeA.lng)
  const distB = haversineKm(vincentLat, vincentLng, placeB.lat, placeB.lng)
  const closerToA = distA <= distB
  const labelA = locale === 'fr' ? placeA.label : placeA.labelEn
  const labelB = locale === 'fr' ? placeB.label : placeB.labelEn
  const cardStyle = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.5)' }

  if (mobile) {
    return (
      <div className="rounded-2xl p-6 flex flex-col gap-4 w-full" style={cardStyle}>
        <span className="text-4xl">📍</span>
        <div className="flex items-center gap-2 min-w-0">
          <PlaceSelect value={idA} onChange={setIdA} locale={locale} />
          <span className="text-slate-500 text-sm font-bold shrink-0">vs</span>
          <PlaceSelect value={idB} onChange={setIdB} locale={locale} />
        </div>
        <div className="text-2xl font-black leading-snug">
          <span className="text-slate-300">{locale === 'fr' ? 'Vincent est plus près de ' : 'Vincent is closer to '}</span>
          <span style={{ color: closerToA ? '#34d399' : '#f97316' }}>{closerToA ? labelA : labelB}</span>
          <span className="text-slate-300">{locale === 'fr' ? ' que de ' : ' than '}</span>
          <span style={{ color: closerToA ? '#f97316' : '#34d399' }}>{closerToA ? labelB : labelA}</span>
        </div>
        <div className="text-slate-500 text-sm">
          {labelA.split(' ')[0]}: {distA.toLocaleString()} km · {labelB.split(' ')[0]}: {distB.toLocaleString()} km
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-3 flex flex-col gap-2 col-span-2" style={cardStyle}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base leading-none shrink-0">📍</span>
        <PlaceSelect value={idA} onChange={setIdA} locale={locale} />
        <span className="text-slate-500 text-xs font-bold shrink-0">vs</span>
        <PlaceSelect value={idB} onChange={setIdB} locale={locale} />
      </div>
      <div className="text-sm font-semibold leading-snug">
        <span className="text-slate-300">{locale === 'fr' ? 'Vincent est plus près de ' : 'Vincent is closer to '}</span>
        <span style={{ color: closerToA ? '#34d399' : '#f97316' }}>{closerToA ? labelA : labelB}</span>
        <span className="text-slate-300">{locale === 'fr' ? ' que de ' : ' than '}</span>
        <span style={{ color: closerToA ? '#f97316' : '#34d399' }}>{closerToA ? labelB : labelA}</span>
      </div>
      <div className="text-slate-500 text-xs">
        {labelA.split(' ')[0]}: {distA.toLocaleString()} km · {labelB.split(' ')[0]}: {distB.toLocaleString()} km
      </div>
    </div>
  )
}

const cardBg = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.5)' }

export function StatHunterModal({ stats, onClose }: Props) {
  const [mounted, setMounted] = useState(false)
  const [mobileIdx, setMobileIdx] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const locale = useLocale()
  const fr = locale === 'fr'

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setMobileIdx(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setMobileIdx(i => Math.min(mobileCards.length - 1, i + 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!mounted) return null

  const simpleCards = [
    { icon: '📅', value: `${stats.daysSinceDeparture}`, label: fr ? 'Jours sur la route' : 'Days on the road', sub: fr ? 'depuis le départ' : 'since departure', color: '#f97316' },
    { icon: '🚴', value: `${stats.daysOnBike}`, label: fr ? 'Jours à vélo' : 'Days on the bike', sub: `${Math.round((stats.daysOnBike / Math.max(stats.daysSinceDeparture, 1)) * 100)}% ${fr ? 'du temps en selle' : 'of the time pedalling'}`, color: '#fb923c' },
    { icon: '📏', value: stats.totalKm.toLocaleString('fr-CH'), label: fr ? 'km parcourus' : 'km ridden', sub: fr ? 'sur ~25 000 km prévus' : 'out of ~25,000 km planned', color: '#38bdf8' },
    { icon: '🏁', value: `${stats.longestRideKm} km`, label: fr ? 'Plus longue sortie' : 'Longest ride', sub: fr ? 'en une journée' : 'in a single day', color: '#a78bfa' },
    { icon: '📊', value: `${stats.avgKmPerBikeDay} km`, label: fr ? 'Moyenne / jour vélo' : 'Avg / riding day', sub: fr ? 'les jours de pédalage' : 'on riding days', color: '#34d399' },
    { icon: '⛰️', value: stats.highestPointM != null ? `${stats.highestPointM.toLocaleString('fr-CH')} m` : '—', label: fr ? 'Point le plus haut' : 'Highest point', sub: fr ? 'altitude atteinte' : 'elevation reached', color: '#86efac' },
    { icon: '⚡', value: stats.topSpeedKmh != null ? `${stats.topSpeedKmh} km/h` : '—', label: fr ? 'Vitesse max' : 'Top speed', sub: fr ? 'pointe enregistrée' : 'recorded peak', color: '#fbbf24' },
    { icon: '📈', value: `${Math.round(stats.totalElevationGainM / 1000)} km`, label: fr ? 'Dénivelé positif total' : 'Total elevation gain', sub: `≈ ${Math.round(stats.totalElevationGainM / 8849)} × Everest`, color: '#f472b6' },
    { icon: '🌍', value: `${stats.countriesCount}`, label: fr ? 'Pays traversés' : 'Countries crossed', sub: fr ? 'sur les Amériques' : 'across the Americas', color: '#67e8f9' },
    { icon: '📸', value: `${stats.photosCount}`, label: fr ? 'Photos publiées' : 'Photos published', sub: fr ? 'géolocalisées sur la carte' : 'geotagged on the map', color: '#c084fc' },
    { icon: '🏔️', value: `${stats.avgElevGainPerDay} m`, label: fr ? 'Dénivelé moyen / jour' : 'Avg elevation / day', sub: fr ? 'les jours de pédalage' : 'on riding days', color: '#6ee7b7' },
    { icon: '🛣️', value: `${stats.rideCount}`, label: fr ? 'Étapes enregistrées' : 'Rides recorded', sub: 'Strava', color: '#fdba74' },
  ]

  // Mobile carousel cards — one per screen, large typography
  const proximityCard = stats.vincentLat != null && stats.vincentLng != null ? [{
    key: 'proximity',
    node: <ProximityCard vincentLat={stats.vincentLat} vincentLng={stats.vincentLng} locale={locale} mobile />,
  }] : []

  const mobileCards: { key: string; node: React.ReactNode }[] = [
    ...proximityCard,
    ...simpleCards.map(c => ({
      key: c.label,
      node: (
        <div className="rounded-2xl p-8 flex flex-col gap-4 w-full" style={cardBg}>
          <span className="text-5xl leading-none">{c.icon}</span>
          <div className="text-6xl font-black leading-none mt-2" style={{ color: c.color }}>{c.value}</div>
          <div className="text-white text-2xl font-bold leading-snug">{c.label}</div>
          {c.sub && <div className="text-slate-400 text-base leading-snug">{c.sub}</div>}
        </div>
      ),
    })),
    {
      key: 'punctures',
      node: (
        <div className="rounded-2xl p-8 flex flex-col gap-4 w-full" style={cardBg}>
          <span className="text-5xl leading-none">🔧</span>
          <div className="text-6xl font-black leading-none mt-2" style={{ color: '#fb7185' }}>{stats.punctures}</div>
          <div className="text-white text-2xl font-bold leading-snug">{fr ? 'Crevaisons' : 'Punctures'}</div>
          <div className="text-slate-400 text-base">{fr ? 'depuis le départ' : 'since departure'}</div>
        </div>
      ),
    },
    {
      key: 'eddington',
      node: (
        <div className="rounded-2xl p-8 flex flex-col gap-4 w-full" style={cardBg}>
          <div className="flex items-center gap-3">
            <span className="text-5xl leading-none">🔢</span>
            <div className="flex items-center gap-2">
              <InfoTooltip
                fr="Le nombre d'Eddington E est le plus grand entier tel que Vincent a effectué au moins E sorties d'au moins E kilomètres. C'est une mesure de la régularité et du volume d'entraînement, inspirée du mathématicien Arthur Eddington."
                en="The Eddington number E is the largest integer such that Vincent has completed at least E rides of at least E kilometres. It measures training consistency and volume, inspired by mathematician Arthur Eddington."
              />
              <LinkButton
                url={fr ? 'https://fr.wikipedia.org/wiki/Nombre_d%27Eddington' : 'https://en.wikipedia.org/wiki/Eddington_number'}
                label="Wiki"
              />
            </div>
          </div>
          <div className="text-6xl font-black leading-none mt-2" style={{ color: '#e879f9' }}>{stats.eddington}</div>
          <div className="text-white text-2xl font-bold leading-snug">{fr ? "Nombre d'Eddington" : 'Eddington number'}</div>
          <div className="text-slate-400 text-base">{fr ? `${stats.eddington} sorties ≥ ${stats.eddington} km` : `${stats.eddington} rides ≥ ${stats.eddington} km`}</div>
        </div>
      ),
    },
    {
      key: 'benichon',
      node: (
        <div className="rounded-2xl p-8 flex flex-col gap-4 w-full" style={cardBg}>
          <span className="text-5xl leading-none">🎪</span>
          <div className="text-6xl font-black leading-none mt-2" style={{ color: '#f87171' }}>{stats.benichouCount}×</div>
          <div className="text-white text-2xl font-bold leading-snug">{fr ? 'Bénichon(s) manquée(s)' : 'Bénichon(s) missed'}</div>
          <div className="text-slate-400 text-base">course des charettes · 2e samedi d'oct.</div>
          <div className="mt-2">
            <LinkButton
              url="https://latele.ch/emissions/cest-arrive-pres-de-chez-vous/c-est-arrive-pres-de-chez-vous-course-de-charettes-et-benichon-de-charmey"
              label={fr ? '📺 Voir sur LaTele.ch' : '📺 Watch on LaTele.ch'}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'jaunpass',
      node: (
        <div className="rounded-2xl p-8 flex flex-col gap-4 w-full" style={cardBg}>
          <div className="flex items-center gap-3">
            <span className="text-5xl leading-none">🇨🇭</span>
            <WikiButton url={fr ? 'https://fr.wikipedia.org/wiki/Col_du_Jaun' : 'https://en.wikipedia.org/wiki/Jaun_Pass'} />
          </div>
          <div className="text-6xl font-black leading-none mt-2" style={{ color: '#4ade80' }}>{stats.jaunpassCount}×</div>
          <div className="text-white text-2xl font-bold leading-snug">{fr ? 'Col du Jaun' : 'Jaunpass'}</div>
          <div className="text-slate-400 text-base">{fr ? `${stats.jaunpassCount} × 484 m de dénivelé` : `${stats.jaunpassCount} × 484 m elevation`}</div>
        </div>
      ),
    },
  ]

  const total = mobileCards.length

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta < -50) setMobileIdx(i => Math.min(total - 1, i + 1))
    else if (delta > 50) setMobileIdx(i => Math.max(0, i - 1))
    touchStartX.current = null
  }

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4"
      style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* ── Desktop panel ── */}
      <div
        className="hidden md:flex flex-col w-full max-w-5xl rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl"
        style={{ boxShadow: '0 0 80px rgba(249,115,22,0.08)' }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🏆</span>
            <div>
              <h2 className="text-white font-bold text-sm leading-none">StatHunter</h2>
              <p className="text-slate-500 text-xs mt-0.5">{fr ? 'Le voyage de Vincent en chiffres' : "Vincent's journey in numbers"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-4 grid grid-cols-4 gap-2">
          {simpleCards.map((card) => (
            <div key={card.label} className="rounded-xl p-3 flex flex-col gap-1" style={cardBg}>
              <span className="text-base leading-none">{card.icon}</span>
              <div className="text-xl font-bold leading-none mt-0.5" style={{ color: card.color }}>{card.value}</div>
              <div className="text-slate-200 text-xs font-medium leading-snug">{card.label}</div>
              {card.sub && <div className="text-slate-500 text-xs leading-snug">{card.sub}</div>}
            </div>
          ))}
          {/* Punctures */}
          <div className="rounded-xl p-3 flex flex-col gap-1" style={cardBg}>
            <span className="text-xl leading-none">🔧</span>
            <div className="text-xl font-bold leading-none mt-0.5" style={{ color: '#fb7185' }}>{stats.punctures}</div>
            <div className="text-slate-200 text-xs font-medium leading-snug">{fr ? 'Crevaisons' : 'Punctures'}</div>
            <div className="text-slate-500 text-xs leading-snug">{fr ? 'depuis le départ' : 'since departure'}</div>
          </div>
          {/* Eddington */}
          <div className="rounded-xl p-3 flex flex-col" style={cardBg}>
            <span className="text-xl leading-none">🔢</span>
            <div className="text-xl font-bold leading-none mt-1.5" style={{ color: '#e879f9' }}>{stats.eddington}</div>
            <div className="text-slate-200 text-xs font-medium leading-snug mt-1">{fr ? "Nombre d'Eddington" : 'Eddington number'}</div>
            <div className="text-slate-500 text-xs leading-snug mt-0.5">{fr ? `${stats.eddington} sorties ≥ ${stats.eddington} km` : `${stats.eddington} rides ≥ ${stats.eddington} km`}</div>
            <div className="flex items-center gap-3 mt-auto pt-2 border-t border-slate-800/60">
              <InfoTooltip
                fr="Le nombre d'Eddington E est le plus grand entier tel que Vincent a effectué au moins E sorties d'au moins E kilomètres. C'est une mesure de la régularité et du volume d'entraînement, inspirée du mathématicien Arthur Eddington."
                en="The Eddington number E is the largest integer such that Vincent has completed at least E rides of at least E kilometres. It measures training consistency and volume, inspired by mathematician Arthur Eddington."
              />
              <LinkButton url={fr ? 'https://fr.wikipedia.org/wiki/Nombre_d%27Eddington' : 'https://en.wikipedia.org/wiki/Eddington_number'} label="Wikipedia" />
            </div>
          </div>
          {/* Bénichon */}
          <div className="rounded-xl p-3 flex flex-col" style={cardBg}>
            <span className="text-xl leading-none">🎪</span>
            <div className="text-xl font-bold leading-none mt-1.5" style={{ color: '#f87171' }}>{stats.benichouCount}×</div>
            <div className="text-slate-200 text-xs font-medium leading-snug mt-1">{fr ? 'Bénichon(s) manquée(s)' : 'Bénichon(s) missed'}</div>
            <div className="text-slate-500 text-xs leading-snug mt-0.5">course des charettes · 2e samedi d'oct.</div>
            <div className="mt-auto pt-2 border-t border-slate-800/60">
              <LinkButton url="https://latele.ch/emissions/cest-arrive-pres-de-chez-vous/c-est-arrive-pres-de-chez-vous-course-de-charettes-et-benichon-de-charmey" label={fr ? '📺 Voir sur LaTele.ch' : '📺 Watch on LaTele.ch'} />
            </div>
          </div>
          {/* Proximity */}
          {stats.vincentLat != null && stats.vincentLng != null && (
            <ProximityCard vincentLat={stats.vincentLat} vincentLng={stats.vincentLng} locale={locale} />
          )}
          {/* Col du Jaun */}
          <div className="rounded-xl p-3 flex flex-col gap-1" style={cardBg}>
            <div className="flex items-center justify-between">
              <span className="text-xl leading-none">🇨🇭</span>
              <WikiButton url={fr ? 'https://fr.wikipedia.org/wiki/Col_du_Jaun' : 'https://en.wikipedia.org/wiki/Jaun_Pass'} />
            </div>
            <div className="text-xl font-bold leading-none mt-0.5" style={{ color: '#4ade80' }}>{stats.jaunpassCount}×</div>
            <div className="text-slate-200 text-xs font-medium leading-snug">{fr ? 'Col du Jaun' : 'Jaunpass'}</div>
            <div className="text-slate-500 text-xs leading-snug">{fr ? `${stats.jaunpassCount} × 484 m de dénivelé` : `${stats.jaunpassCount} × 484 m elevation`}</div>
          </div>
        </div>
        <div className="px-4 pb-3 text-center">
          <p className="text-slate-600 text-xs">{fr ? 'Données synchronisées automatiquement depuis Strava · Flickr · YouTube' : 'Data automatically synced from Strava · Flickr · YouTube'}</p>
        </div>
      </div>

      {/* ── Mobile carousel panel ── */}
      <div
        className="flex flex-col md:hidden w-full rounded-t-2xl border-t border-slate-700/60 bg-slate-900 overflow-hidden"
        style={{ maxHeight: '92dvh', boxShadow: '0 0 80px rgba(249,115,22,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">🏆</span>
            <span className="text-white font-bold text-sm">StatHunter</span>
          </div>
          <span className="text-slate-500 text-xs">{mobileIdx + 1} / {total}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Swipeable card area */}
        <div
          className="flex-1 flex items-center justify-center p-5 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {mobileCards.map(({ key, node }, i) => (
            <div
              key={key}
              className="w-full"
              style={{ display: i === mobileIdx ? 'block' : 'none' }}
            >
              {node}
            </div>
          ))}
        </div>

        {/* Navigation bar */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-slate-800 gap-4">
          <button
            onClick={() => setMobileIdx(i => Math.max(0, i - 1))}
            disabled={mobileIdx === 0}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-20"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          {/* Dot indicators — show up to 17 dots, active one orange */}
          <div className="flex-1 flex items-center justify-center gap-1.5 overflow-hidden">
            {mobileCards.map((_, i) => (
              <button
                key={i}
                onClick={() => setMobileIdx(i)}
                className="rounded-full transition-all shrink-0"
                style={{
                  width: i === mobileIdx ? 20 : 6,
                  height: 6,
                  background: i === mobileIdx ? '#f97316' : 'rgba(100,116,139,0.5)',
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setMobileIdx(i => Math.min(total - 1, i + 1))}
            disabled={mobileIdx === total - 1}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-20"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
