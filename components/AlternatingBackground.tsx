'use client'

import { useEffect, useState } from 'react'

const IMAGES = ['/landing_page1.jpeg', '/landing_page2.jpeg']

export function AlternatingBackground() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % IMAGES.length), 6000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      {IMAGES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover hidden md:block transition-opacity duration-1000"
          style={{ opacity: idx === i ? 1 : 0 }}
        />
      ))}
    </>
  )
}
