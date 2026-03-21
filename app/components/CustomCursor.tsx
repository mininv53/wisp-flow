'use client'
import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const trailRefs = useRef<HTMLDivElement[]>([])
  const pos = useRef({ x: 0, y: 0, rx: 0, ry: 0 })
  const trailPos = useRef(Array(6).fill(null).map(() => ({ x: 0, y: 0 })))
  const [clicking, setClicking] = useState(false)
  const [hover, setHover] = useState<'none' | 'btn' | 'card'>('none')

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX
      pos.current.y = e.clientY
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + 'px'
        dotRef.current.style.top = e.clientY + 'px'
      }

      // detectare hover pe elemente interactive
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (el) {
        const tag = el.tagName.toLowerCase()
        const isBtn = tag === 'button' || tag === 'a' || el.closest('button') || el.closest('a')
        const isCard = el.closest('[data-cursor="card"]')
        if (isBtn) setHover('btn')
        else if (isCard) setHover('card')
        else setHover('none')
      }
    }

    const onDown = () => setClicking(true)
    const onUp = () => setClicking(false)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)

    let raf: number
    const animate = () => {
      // ring urmărește cu lag
      pos.current.rx += (pos.current.x - pos.current.rx) * 0.12
      pos.current.ry += (pos.current.y - pos.current.ry) * 0.12
      if (ringRef.current) {
        ringRef.current.style.left = pos.current.rx + 'px'
        ringRef.current.style.top = pos.current.ry + 'px'
      }

      // trail de particule
      const tp = trailPos.current
      tp[0].x += (pos.current.x - tp[0].x) * 0.4
      tp[0].y += (pos.current.y - tp[0].y) * 0.4
      for (let i = 1; i < 6; i++) {
        tp[i].x += (tp[i - 1].x - tp[i].x) * 0.35
        tp[i].y += (tp[i - 1].y - tp[i].y) * 0.35
        const el = trailRefs.current[i]
        if (el) {
          el.style.left = tp[i].x + 'px'
          el.style.top = tp[i].y + 'px'
        }
      }

      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      cancelAnimationFrame(raf)
    }
  }, [])

  const ringSize = clicking ? 18 : hover === 'btn' ? 44 : hover === 'card' ? 54 : 32
  const ringColor = hover === 'card' ? 'rgba(160,80,220,.5)' : hover === 'btn' ? 'rgba(220,120,60,.8)' : 'rgba(220,120,60,.35)'
  const dotSize = clicking ? 4 : hover === 'btn' ? 5 : 8

  return (
    <>
      <style>{`
        @media (pointer: fine) {
          * { cursor: none !important; }
        }
      `}</style>

      {/* punct central */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 9999,
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: clicking ? 'rgba(255,255,255,.9)' : 'rgba(220,120,60,.95)',
          transform: 'translate(-50%,-50%)',
          transition: 'width .12s, height .12s, background .15s',
        }}
      />

      {/* inel */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 9998,
          width: ringSize,
          height: ringSize,
          borderRadius: '50%',
          border: `1px solid ${ringColor}`,
          transform: 'translate(-50%,-50%)',
          transition: 'width .28s cubic-bezier(.16,1,.3,1), height .28s cubic-bezier(.16,1,.3,1), border-color .2s',
        }}
      />

      {/* trail particule */}
      {Array.from({ length: 6 }, (_, i) => {
        const size = Math.max(4 - i * 0.55, 0.8)
        const opacity = 0.22 - i * 0.03
        return (
          <div
            key={i}
            ref={el => { if (el) trailRefs.current[i] = el }}
            style={{
              position: 'fixed',
              pointerEvents: 'none',
              zIndex: 9997,
              width: size,
              height: size,
              borderRadius: '50%',
              background: `rgba(220,120,60,${opacity})`,
              transform: 'translate(-50%,-50%)',
            }}
          />
        )
      })}
    </>
  )
}