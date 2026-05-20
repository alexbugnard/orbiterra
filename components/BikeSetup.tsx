'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

// Lateral + frontal hotspots are on the same image; some parts appear twice (one dot per view)
const HOTSPOT_DEFS = [
  // lateral view
  { id: 'frame',       x: 42.5, y: 50,  model: 'Fairlight Secan 3.0',           link: 'https://fairlightcycles.com/secan-3-0/' },
  { id: 'handlebar',   x: 48,   y: 35,  model: 'Deda Gerra Alloy',              link: 'https://dedaelementi.com/gera-alloy-handlebar' },
  { id: 'stem',        x: 46,   y: 35.8,model: 'Deda Vinci OEM Stem',           link: 'https://dedaelementi.com/vinci-oem-stem' },
  { id: 'extensions',  x: 52,   y: 25,  model: 'Deda Parabolica Pro',           link: 'https://dedaelementi.com/parabolica-pro' },
  { id: 'saddle',      x: 30,   y: 32,  model: 'SMP',                           link: 'https://www.sellesmp.com/ch_en' },
  { id: 'forkbag',     x: 49,   y: 55,  model: 'Restrap Switch Pannier 10L',    link: 'https://eu.restrap.com/fr/products/switch-pannier-10-litres' },
  { id: 'rearpannier', x: 23,   y: 55,  model: 'Restrap Switch Pannier 10L',    link: 'https://eu.restrap.com/fr/products/switch-pannier-10-litres' },
  { id: 'reartopbag',  x: 23,   y: 40,  model: 'Restrap Switch Top Bag 15L',   link: 'https://restrap.com/products/switch-top-bag-15l' },
  { id: 'aerobag',     x: 53,   y: 29,  model: 'Restrap Race Bar Bag Aero 7L', link: 'https://eu.restrap.com/fr/products/race-aero-bar-bag' },
  { id: 'framebag',    x: 41,   y: 45,  model: 'Restrap Frame Bag 4.5L',        link: 'https://eu.restrap.com/products/frame-bag-large' },
  { id: 'toptubebag',  x: 42,   y: 36,  model: 'Restrap Race Top Tube Bag 2L', link: 'https://eu.restrap.com/products/race-top-tube-bag-long' },
  { id: 'drivetrain',  x: 25,   y: 66,  model: 'Shimano GRX 12v',              link: 'https://bike.shimano.com/fr-CA/stories/article/grx-12-speed-mechanical.html' },
  { id: 'brakes',      x: 51,   y: 65,  model: 'Shimano GRX 12v',              link: 'https://bike.shimano.com/fr-CA/stories/article/grx-12-speed-mechanical.html' },
  { id: 'tires',       x: 60,   y: 60,  model: '',                              link: '' },
  { id: 'dynamo',      x: 51,   y: 62,  model: 'SON28',                         link: 'https://www.sinewavecycles.com/collections/schmidt/products/schmidt-son28' },
  { id: 'lighting',    x: 53,   y: 40,  model: 'Son Edelux II',                 link: 'https://nabendynamo.de/en/products/headlights/edelux-2/' },
  { id: 'tent',        x: 50.5,   y: 41,  model: 'MSR Hubba Hubba 2p',           link: 'https://cascadedesigns.com/products/hubba-hubba-hd-2-person-backpacking-tent' },
  { id: 'wheels',      x: 54,   y: 75,  model: 'Duke Baccara WRX 36m',          link: 'https://www.duke-racingwheels.com/fr/42-173-jante-duke-baccara-36.html#/39-nombre_de_trous-24/51-diametre_jantes-700c/57-profil_jantes-symetrique/60-finition_jantes-ud_paintless' },
  // frontal view (same image, right side)
  { id: 'handlebar',   x: 70,   y: 32,  model: 'Deda Gerra',                    link: '' },
  { id: 'extensions',  x: 74,   y: 30,  model: 'Deda Parabolica Pro',           link: '' },
  { id: 'saddle',      x: 72,   y: 23,  model: 'SMP',                           link: 'https://www.sellesmp.com/ch_en' },
  { id: 'forkbag',     x: 76,   y: 55,  model: 'Restrap Switch Pannier 10L',    link: 'https://eu.restrap.com/fr/products/switch-pannier-10-litres' },
  { id: 'rearpannier', x: 77,   y: 45,  model: 'Restrap Switch Pannier 10L',    link: 'https://eu.restrap.com/fr/products/switch-pannier-10-litres' },
  { id: 'brakes',      x: 73.5, y: 65,  model: 'Shimano GRX 12v',              link: 'https://bike.shimano.com/fr-CA/stories/article/grx-12-speed-mechanical.html' },
  { id: 'tires',       x: 72,   y: 75,  model: '',                              link: '' },
  { id: 'dynamo',      x: 72,   y: 65,  model: 'SON28',                         link: 'https://www.sinewavecycles.com/collections/schmidt/products/schmidt-son28' },
  { id: 'lighting',    x: 72,   y: 40,  model: 'Son Edelux II',                 link: '' },
  { id: 'wheels',      x: 72,   y: 80,  model: 'Duke Baccara WRX 36m',          link: 'https://www.duke-racingwheels.com/fr/42-173-jante-duke-baccara-36.html#/39-nombre_de_trous-24/51-diametre_jantes-700c/57-profil_jantes-symetrique/60-finition_jantes-ud_paintless' },
]

const TIP_W = 164
const TIP_H = 52
const DOT_R = 6
const OFFSET = 22

export function BikeSetup() {
  const t = useTranslations('bikeSetup')
  const HOTSPOTS = HOTSPOT_DEFS.map((h, i) => ({ ...h, key: `${h.id}-${i}`, label: t(h.id) }))

  const [hovered, setHovered] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.offsetWidth, h: el.offsetHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const active = hovered ? HOTSPOTS.find(h => h.key === hovered) : null

  let dotPx = 0, dotPy = 0
  let tipLeft = 0, tipTop = 0
  let lineX1 = 0, lineY1 = 0, lineX2 = 0, lineY2 = 0

  if (active && size.w > 0) {
    dotPx = (active.x / 100) * size.w
    dotPy = (active.y / 100) * size.h

    const placeRight = active.x < 55
    const tipX = placeRight
      ? dotPx + DOT_R + OFFSET
      : dotPx - DOT_R - OFFSET - TIP_W

    const tipY = Math.min(
      Math.max(dotPy - TIP_H / 2, 4),
      size.h - TIP_H - 4
    )

    tipLeft = tipX
    tipTop = tipY
    lineX1 = dotPx
    lineY1 = dotPy
    lineX2 = placeRight ? tipX : tipX + TIP_W
    lineY2 = tipY + TIP_H / 2
  }

  return (
    <div className="select-none">
      <div ref={containerRef} className="relative w-full -mx-0 md:mx-0" style={{ paddingBottom: '56%' }}>
        <Image
          src="/matos/Gemini_Generated_Image_serncaserncasern.png"
          alt="Bike setup"
          fill
          className="object-contain rounded-xl"
          unoptimized
        />

        {active && size.w > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 20, width: size.w, height: size.h }}
          >
            <line
              x1={lineX1} y1={lineY1}
              x2={lineX2} y2={lineY2}
              stroke="#f97316"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
            <circle cx={lineX2} cy={lineY2} r="2.5" fill="#f97316" />
          </svg>
        )}

        {active && size.w > 0 && (
          <div
            className="absolute pointer-events-none"
            style={{ left: tipLeft, top: tipTop, zIndex: 30, width: TIP_W }}
          >
            <div
              className="rounded-lg px-3 py-2 shadow-xl"
              style={{
                background: 'rgba(15,23,42,0.97)',
                border: '1px solid rgba(249,115,22,0.55)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
              }}
            >
              <div className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider mb-0.5 leading-tight">
                {active.label}
              </div>
              <div className="text-white text-xs font-medium leading-snug">{active.model}</div>
            </div>
          </div>
        )}

        {HOTSPOTS.map((h) => (
          <button
            key={h.key}
            onMouseEnter={() => setHovered(h.key)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(h.key)}
            onBlur={() => setHovered(null)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${h.x}%`, top: `${h.y}%`, zIndex: 25 }}
            aria-label={`${h.label}: ${h.model}`}
          >
            <span
              className="block w-3 h-3 rounded-full border-2 transition-all duration-150"
              style={{
                background: hovered === h.key ? '#f97316' : 'rgba(249,115,22,0.65)',
                borderColor: hovered === h.key ? '#fff' : 'rgba(255,255,255,0.4)',
                boxShadow: hovered === h.key ? '0 0 0 4px rgba(249,115,22,0.25)' : 'none',
                transform: hovered === h.key ? 'scale(1.35)' : 'scale(1)',
              }}
            />
          </button>
        ))}
      </div>

      {/* Legend — deduplicated by id */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {HOTSPOTS.filter((h, i, arr) => arr.findIndex(x => x.id === h.id) === i).map((h) => {
          const isHovered = HOTSPOTS.some(x => x.id === h.id && x.key === hovered)
          const inner = (
            <>
              <div className="text-slate-400 text-xs">{h.label}</div>
              <div className="text-white text-sm font-medium leading-tight mt-0.5">{h.model}</div>
              {h.link && (
                <div className="text-orange-400 text-xs mt-1">{t('viewProduct')} →</div>
              )}
            </>
          )
          const sharedStyle = {
            borderColor: isHovered ? 'rgba(249,115,22,0.6)' : 'rgba(51,65,85,0.8)',
            background: isHovered ? 'rgba(249,115,22,0.08)' : 'rgba(30,41,59,0.5)',
          }
          const sharedClass = 'px-3 py-2 rounded-lg border transition-colors'
          return h.link ? (
            <a
              key={h.id}
              href={h.link}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHovered(HOTSPOTS.find(x => x.id === h.id)!.key)}
              onMouseLeave={() => setHovered(null)}
              className={sharedClass}
              style={sharedStyle}
            >
              {inner}
            </a>
          ) : (
            <div
              key={h.id}
              onMouseEnter={() => setHovered(HOTSPOTS.find(x => x.id === h.id)!.key)}
              onMouseLeave={() => setHovered(null)}
              className={`${sharedClass} cursor-default`}
              style={sharedStyle}
            >
              {inner}
            </div>
          )
        })}
      </div>
    </div>
  )
}
