'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    obs.observe(el); return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const { ref, visible } = useInView()
  useEffect(() => {
    if (!visible) return
    let cur = 0; const step = Math.ceil(to / 50)
    const id = setInterval(() => { cur += step; if (cur >= to) { setVal(to); clearInterval(id) } else setVal(cur) }, 28)
    return () => clearInterval(id)
  }, [visible, to])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

function HeroAvatar({ mood, speaking, size = 160 }: { mood: string; speaking: boolean; size?: number }) {
  const [mf, setMf] = useState(0)
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    if (!speaking) return
    const id = setInterval(() => setMf(f => (f + 1) % 3), 120)
    return () => clearInterval(id)
  }, [speaking])

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }, 3200 + Math.random() * 2000)
    return () => clearInterval(id)
  }, [])

  const eyeRy = blink ? 0.5 : mood === 'think' ? 5 : 6.5
  const mouth = mood === 'happy' ? 'M30 58 Q45 68 60 58' : mood === 'think' ? 'M34 61 Q45 61 56 61' : 'M32 57 Q45 65 58 57'
  const browL = mood === 'think' ? 'rotate(-5 30 27)' : ''
  const browR = mood === 'think' ? 'rotate(5 60 27)' : ''

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: size + i * 32, height: size + i * 32,
          borderRadius: '50%',
          border: `0.5px solid rgba(180,100,220,${0.12 - i * 0.03})`,
          transform: 'translate(-50%,-50%)',
          animation: `wave-hero ${3 + i * 0.8}s ease-in-out infinite ${i * 0.4}s`,
          pointerEvents: 'none',
        }} />
      ))}
      <svg viewBox="0 0 90 90" width={size} height={size} style={{ position: 'relative', zIndex: 1 }}>
        <defs>
          <radialGradient id="glow-warm" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(220,120,60,.25)" />
            <stop offset="100%" stopColor="rgba(220,120,60,0)" />
          </radialGradient>
        </defs>
        <circle cx="45" cy="45" r="46" fill="url(#glow-warm)" />
        <circle cx="45" cy="45" r="42" fill="#2a1a1a" />
        <circle cx="45" cy="51" r="33" fill="#3a2020" />
        <ellipse cx="30" cy="39" rx="6" ry={eyeRy} fill="rgba(220,120,60,.9)" />
        <ellipse cx="60" cy="39" rx="6" ry={eyeRy} fill="rgba(220,120,60,.9)" />
        <circle cx="32" cy="37" r="2" fill="rgba(255,200,150,.6)" />
        <circle cx="62" cy="37" r="2" fill="rgba(255,200,150,.6)" />
        <ellipse cx="30" cy="28" rx="9" ry="2.5" fill="#3a2020" />
        <ellipse cx="60" cy="28" rx="9" ry="2.5" fill="#3a2020" />
        <rect x="22" y="25.5" width="16" height="3.2" rx="1.6" fill="rgba(220,120,60,.7)" transform={browL} />
        <rect x="52" y="25.5" width="16" height="3.2" rx="1.6" fill="rgba(220,120,60,.7)" transform={browR} />
        {speaking
          ? <path d={[mouth, 'M32 59 Q45 64 58 59', 'M34 58 Q45 62 56 58'][mf]} fill="none" stroke="rgba(220,120,60,.8)" strokeWidth="2.5" strokeLinecap="round" />
          : <path d={mouth} fill="none" stroke="rgba(220,120,60,.8)" strokeWidth="2.5" strokeLinecap="round" />
        }
        <circle cx="17" cy="54" r="7" fill="rgba(180,80,40,.2)" />
        <circle cx="73" cy="54" r="7" fill="rgba(180,80,40,.2)" />
        <circle cx="45" cy="72" r="3" fill="rgba(160,80,220,.3)" />
        <circle cx="38" cy="70" r="2" fill="rgba(160,80,220,.2)" />
        <circle cx="52" cy="70" r="2" fill="rgba(160,80,220,.2)" />
      </svg>
    </div>
  )
}

function ParticleBg({ mx, my }: { mx: number; my: number }) {
  const ps = useRef(Array.from({ length: 40 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    type: i % 4,
    size: 3 + Math.random() * 7,
    dur: 16 + Math.random() * 20,
    delay: Math.random() * 16,
    tx: (Math.random() - .5) * 100,
    ty: (Math.random() - .5) * 100,
    warm: i % 3 !== 0,
    op: 0.06 + Math.random() * 0.04,
  })))
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {ps.current.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.type === 2 ? p.size * 3.5 : p.type === 3 ? p.size * .7 : p.size,
          height: p.type === 2 ? 0.5 : p.type === 3 ? p.size * .7 : p.size,
          borderRadius: p.type === 1 ? '50%' : p.type === 3 ? '2px' : 0,
          background: p.warm ? `rgba(200,100,50,${p.op})` : `rgba(140,70,200,${p.op * 0.9})`,
          border: p.type === 3 ? `0.5px solid ${p.warm ? 'rgba(220,130,80,.12)' : 'rgba(160,90,220,.1)'}` : 'none',
          transform: p.type === 0 ? 'rotate(45deg)' : 'none',
          animationName: 'pdrift',
          animationDuration: `${p.dur}s`,
          animationDelay: `${p.delay}s`,
          animationIterationCount: 'infinite',
          animationTimingFunction: 'ease-in-out',
          ['--tx' as any]: `${p.tx}px`,
          ['--ty' as any]: `${p.ty}px`,
        }} />
      ))}
    </div>
  )
}

interface LeaderEntry {
  username: string
  avatar_initials: string
  product: 'junior'|'teen'|'flow'
  xp: number
  level: number
  streak: number
}

const PRODUCT_COLORS: Record<string,string> = {
  junior: 'rgba(180,130,255,.8)',
  teen:   'rgba(220,120,60,.8)',
  flow:   'rgba(160,80,220,.8)',
}
const PRODUCT_LABELS: Record<string,string> = {
  junior: 'Junior', teen: 'Teen', flow: 'Flow'
}

function LeaderboardSection() {
  const [tab, setTab] = useState<'xp'|'streak'>('xp')
  const [data, setData] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { ref, visible } = useInView()

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboard?type=${tab}`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tab])

  const medal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

  return (
    <section id="leaderboard" style={{ padding: '120px 32px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
      <div ref={ref} className={`reveal ${visible ? 'in' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 52, flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 28, height: 1, background: 'rgba(220,120,60,.4)' }}/>
              <span style={{ fontSize: 11, color: 'rgba(220,120,60,.5)', letterSpacing: '.2em', textTransform: 'uppercase' }}>Comunitate</span>
            </div>
            <h2 className="serif" style={{ fontSize: 'clamp(2.2rem,5vw,4.5rem)', lineHeight: 1.05, color: 'rgba(255,255,255,.88)' }}>
              Cine e pe primul loc<br />
              <span className="serif-i" style={{ color: 'rgba(255,255,255,.25)' }}>azi?</span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,.03)', border: '0.5px solid rgba(255,255,255,.07)', borderRadius: 40, padding: 4 }}>
            {(['xp','streak'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: 36, fontSize: 12, fontWeight: 400, cursor: 'pointer', border: 'none', background: tab === t ? (t === 'xp' ? 'rgba(220,120,60,.2)' : 'rgba(160,80,220,.2)') : 'transparent', color: tab === t ? (t === 'xp' ? 'rgba(220,120,60,.9)' : 'rgba(160,80,220,.9)') : 'rgba(255,255,255,.3)', transition: 'all .25s', letterSpacing: '.04em' }}>
                {t === 'xp' ? '⚡ XP' : '🔥 Streak'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {loading ? (
            Array.from({length: 5}).map((_,i) => (
              <div key={i} style={{ height: 64, borderRadius: 14, background: 'rgba(255,255,255,.02)', border: '0.5px solid rgba(255,255,255,.04)', animation: 'shimmer 1.5s ease-in-out infinite', opacity: 1 - i * 0.15 }}/>
            ))
          ) : data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,.2)', fontSize: 14, fontStyle: 'italic' }}>
              Nimeni încă. Tu poți fi primul. 🚀
            </div>
          ) : data.map((entry, i) => {
            const isTop3 = i < 3
            const accentCol = PRODUCT_COLORS[entry.product] || 'rgba(220,120,60,.8)'
            return (
              <div key={i} className={`reveal d${Math.min(i+1,4)} ${visible?'in':''}`} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderRadius: 14, background: isTop3 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.015)', border: `0.5px solid ${isTop3 ? 'rgba(220,120,60,.12)' : 'rgba(255,255,255,.04)'}`, transition: 'all .25s', cursor: 'default', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={(e:any) => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.borderColor = 'rgba(220,120,60,.2)' }}
                onMouseLeave={(e:any) => { e.currentTarget.style.background = isTop3 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.015)'; e.currentTarget.style.borderColor = isTop3 ? 'rgba(220,120,60,.12)' : 'rgba(255,255,255,.04)' }}>
                {isTop3 && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: i === 0 ? 'linear-gradient(180deg,rgba(255,200,50,.6),rgba(220,120,60,.4))' : i === 1 ? 'linear-gradient(180deg,rgba(180,180,180,.5),rgba(140,140,140,.3))' : 'linear-gradient(180deg,rgba(180,100,40,.5),rgba(140,80,30,.3))', borderRadius: '2px 0 0 2px' }}/>}
                <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                  {medal(i) ? <span style={{ fontSize: 18 }}>{medal(i)}</span> : <span style={{ fontSize: 13, color: 'rgba(255,255,255,.2)', fontFamily: 'monospace' }}>{i + 1}</span>}
                </div>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${accentCol.replace('.8)', '.15)')}`, border: `0.5px solid ${accentCol.replace('.8)', '.3)')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, color: accentCol, flexShrink: 0, letterSpacing: '.02em' }}>
                  {entry.avatar_initials || entry.username?.slice(0,2).toUpperCase() || '??'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,.78)', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.username || 'Anonim'}</div>
                  <div style={{ fontSize: 10, color: accentCol.replace('.8)', '.5)'), marginTop: 2, letterSpacing: '.06em' }}>
                    {PRODUCT_LABELS[entry.product] || entry.product} · Nv. {entry.level}
                  </div>
                </div>
                {tab === 'xp' && (
                  <div style={{ width: 100, flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4, fontSize: 11, color: 'rgba(220,120,60,.7)', fontFamily: 'monospace', fontWeight: 500 }}>
                      {entry.xp.toLocaleString()} XP
                    </div>
                    <div style={{ height: 2, background: 'rgba(255,255,255,.06)', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: visible ? `${Math.min((entry.xp / (data[0]?.xp || 1)) * 100, 100)}%` : '0%', background: `linear-gradient(90deg,rgba(220,120,60,.6),rgba(160,80,220,.5))`, borderRadius: 1, transition: `width 1.2s ${i * 0.08}s ease` }}/>
                    </div>
                  </div>
                )}
                {tab === 'streak' && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, color: 'rgba(255,180,60,.8)', fontFamily: 'monospace', fontWeight: 500 }}>🔥 {entry.streak}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', marginTop: 2 }}>zile</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.14)', fontStyle: 'italic' }}>
          Live · date anonimizate · fără bs
        </div>
      </div>

      <style>{`@keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
    </section>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [mx, setMx] = useState(50)
  const [my, setMy] = useState(40)
  const [avatarMood, setAvatarMood] = useState('happy')
  const [avatarSpeaking, setAvatarSpeaking] = useState(false)
  const [currentLine, setCurrentLine] = useState(0)

  const LINES = [
    'hey, ce mai faci azi?',
    'ai o idee? hai s-o construim.',
    'nu trebuie să te forțezi.',
    'creierul tău e ok — serios.',
    'cu ce începem?',
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    const onMouse = (e: MouseEvent) => {
      setMx(e.clientX / window.innerWidth * 100)
      setMy(e.clientY / window.innerHeight * 100)
    }
    window.addEventListener('scroll', onScroll)
    window.addEventListener('mousemove', onMouse)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  useEffect(() => {
    const cycle = () => {
      setAvatarSpeaking(true)
      setAvatarMood(['happy', 'think', 'happy'][Math.floor(Math.random() * 3)])
      setTimeout(() => setAvatarSpeaking(false), 2200)
      setCurrentLine(l => (l + 1) % LINES.length)
    }
    const id = setInterval(cycle, 4500)
    return () => clearInterval(id)
  }, [])

  const s1 = useInView(), s2 = useInView(), s3 = useInView()
  const s4 = useInView(), s5 = useInView(), s6 = useInView(), s7 = useInView()

  const WARM = 'rgba(220,120,60,1)'
  const VIOLET = 'rgba(160,80,220,1)'

  return (
    <div style={{ background: '#100a0a', color: 'rgba(255,255,255,.82)', minHeight: '100vh', overflowX: 'hidden', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        *::selection{background:rgba(220,120,60,.3);color:#fff}
        .serif{font-family:'DM Serif Display',Georgia,serif}
        .serif-i{font-family:'DM Serif Display',Georgia,serif;font-style:italic}
        .reveal{opacity:0;transform:translateY(22px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)}
        .reveal.in{opacity:1;transform:none}
        .d1{transition-delay:.1s}.d2{transition-delay:.22s}.d3{transition-delay:.34s}.d4{transition-delay:.46s}
        @keyframes pdrift{0%{opacity:0;transform:translate(0,0) rotate(45deg)}15%{opacity:1}85%{opacity:.35}100%{opacity:0;transform:translate(var(--tx),var(--ty)) rotate(100deg)}}
        @keyframes wave-hero{0%,100%{opacity:.08;transform:translate(-50%,-50%) scale(1)}50%{opacity:.2;transform:translate(-50%,-50%) scale(1.06)}}
        @keyframes breathe-hero{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-10px) scale(1.015)}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes glow-pulse{0%,100%{opacity:.4}50%{opacity:.9}}
        @keyframes badge-pop{0%{transform:scale(0) rotate(-15deg);opacity:0}70%{transform:scale(1.1) rotate(3deg)}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes line-fade{0%{opacity:0;transform:translateY(6px)}20%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0;transform:translateY(-4px)}}
        @keyframes orb-drift{0%,100%{transform:translate(0,0)}33%{transform:translate(14px,-18px)}66%{transform:translate(-10px,12px)}}
        .hover-up{transition:transform .35s cubic-bezier(.16,1,.3,1)}
        .hover-up:hover{transform:translateY(-3px)}
        hr.line{border:none;border-top:1px solid rgba(255,255,255,.05)}
      `}</style>

      <ParticleBg mx={mx} my={my} />

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, transition: 'all 1s', background: `radial-gradient(600px circle at ${mx}% ${my}%, rgba(200,90,40,.06), transparent 65%)` }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(160,60,30,.08), transparent 55%), radial-gradient(ellipse 55% 45% at 85% 85%, rgba(120,50,180,.07), transparent 50%), radial-gradient(ellipse 40% 35% at 15% 70%, rgba(180,80,40,.05), transparent 50%)' }} />

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, transition: 'all .4s', background: scrolled ? 'rgba(16,10,10,.92)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '0.5px solid rgba(220,120,60,.08)' : 'none' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,.8)', textDecoration: 'none', letterSpacing: '-.01em' }}>
            Wisp<span style={{ color: 'rgba(220,120,60,.5)' }}>+</span>Flow
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 12, color: 'rgba(255,255,255,.3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
            {[['#produse', 'Produse'], ['#progres', 'Progres'], ['#leaderboard', 'Top'], ['#preturi', 'Prețuri']].map(([href, label]) => (
              <a key={href} href={href} style={{ color: 'rgba(255,255,255,.3)', textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.3)')}>{label}</a>
            ))}
          </div>
          <Link href="/flow" style={{ fontSize: 12, border: '0.5px solid rgba(220,120,60,.3)', color: 'rgba(220,120,60,.8)', padding: '8px 20px', borderRadius: 40, textDecoration: 'none', transition: 'all .25s', background: 'rgba(220,120,60,.06)' }}
            onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(220,120,60,.14)'; e.currentTarget.style.borderColor = 'rgba(220,120,60,.6)' }}
            onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(220,120,60,.06)'; e.currentTarget.style.borderColor = 'rgba(220,120,60,.3)' }}>
            hai să încercăm
          </Link>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 32px 80px', maxWidth: 1100, margin: '0 auto', zIndex: 2, gap: 60 }}>
        <div style={{ position: 'absolute', top: '15%', right: '5%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,60,30,.1), transparent 70%)', animation: 'orb-drift 18s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '3%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,50,180,.08), transparent 70%)', animation: 'orb-drift 24s ease-in-out infinite 5s', pointerEvents: 'none' }} />

        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 44 }}>
            <div style={{ width: 32, height: 1, background: 'rgba(220,120,60,.45)' }} />
            <span style={{ fontSize: 11, color: 'rgba(220,120,60,.6)', letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 300 }}>un AI care te înțelege cu adevărat</span>
          </div>

          <h1 className="serif" style={{ fontSize: 'clamp(3rem,7.5vw,6.8rem)', lineHeight: .93, letterSpacing: '-.02em', marginBottom: 36, color: 'rgba(255,255,255,.92)' }}>
            Tu nu ești broken.<br />
            Sistemul era<br />
            <span className="serif-i" style={{ color: 'rgba(220,120,60,.5)' }}>prost construit.</span>
          </h1>

          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.35)', lineHeight: 1.75, maxWidth: 360, fontWeight: 300, marginBottom: 48 }}>
            Wisp și Flow sunt 3 AI companions — pentru copii, teens și adulți — care se mulează pe creierul tău, nu invers. ADHD sau nu.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 64 }}>
            <Link href="/flow" style={{ display: 'flex', alignItems: 'center', gap: 10, background: WARM, color: '#100a0a', fontSize: 14, fontWeight: 500, padding: '14px 28px', borderRadius: 40, textDecoration: 'none', transition: 'all .3s' }}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(240,140,70,1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = WARM; e.currentTarget.style.transform = 'none' }}>
              încearcă Flow <span>→</span>
            </Link>
            <Link href="/wisp" style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={(e: any) => e.currentTarget.style.color = 'rgba(255,255,255,.7)'}
              onMouseLeave={(e: any) => e.currentTarget.style.color = 'rgba(255,255,255,.3)'}>
              sau Wisp pentru copii ↗
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28, paddingTop: 28, borderTop: '0.5px solid rgba(255,255,255,.06)', maxWidth: 480 }}>
            {[
              { n: 3, s: '', label: 'produse · un ecosistem' },
              { n: 18, s: '+', label: 'funcții în Flow' },
              { n: 10, s: '', label: 'jocuri cognitive' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="serif" style={{ fontSize: 30, color: 'rgba(255,255,255,.75)', marginBottom: 4 }}>
                  <Counter to={stat.n} suffix={stat.s} />
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', fontWeight: 300 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(140,60,200,.15), transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'glow-pulse 4s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,90,40,.12), transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'glow-pulse 3s ease-in-out infinite 1s', pointerEvents: 'none' }} />
          <div style={{ animation: 'breathe-hero 5s ease-in-out infinite', position: 'relative' }}>
            <HeroAvatar mood={avatarMood} speaking={avatarSpeaking} size={180} />
          </div>
          <div style={{ position: 'relative', background: 'rgba(40,20,20,.8)', border: '0.5px solid rgba(220,120,60,.2)', borderRadius: 16, padding: '12px 18px', maxWidth: 220, backdropFilter: 'blur(12px)' }}>
            <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 10, height: 6, background: 'rgba(220,120,60,.2)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
            <p key={currentLine} style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.5, fontFamily: 'Georgia,serif', animation: 'line-fade 4.5s ease-in-out', margin: 0 }}>
              "{LINES[currentLine]}"
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['happy', 'think', 'happy'].map((m, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: avatarMood === m ? 'rgba(220,120,60,.8)' : 'rgba(255,255,255,.12)', transition: 'all .4s' }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{ borderTop: '0.5px solid rgba(220,120,60,.08)', borderBottom: '0.5px solid rgba(220,120,60,.08)', padding: '14px 0', overflow: 'hidden', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: 64, whiteSpace: 'nowrap', animation: 'ticker 26s linear infinite' }}>
          {[...Array(2)].map((_, j) => (
            <span key={j} style={{ display: 'flex', gap: 64 }}>
              {['Wisp Junior', '·', 'Wisp Teen', '·', 'Flow', '·', '10 jocuri cognitive', '·', 'XP & Achievements', '·', 'Focus Timer', '·', 'Mood Tracker', '·', 'Habit Tracker', '·', 'Streak-uri', '·'].map((t, i) => (
                <span key={i} style={{ fontSize: 11, color: i % 2 === 1 ? 'rgba(160,80,220,.3)' : 'rgba(220,120,60,.2)', letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 300 }}>{t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ══ PRODUSE ══ */}
      <section id="produse" style={{ padding: '120px 32px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div ref={s1.ref} className={`reveal ${s1.visible ? 'in' : ''}`} style={{ marginBottom: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 28, height: 1, background: 'rgba(220,120,60,.4)' }} />
            <span style={{ fontSize: 11, color: 'rgba(220,120,60,.5)', letterSpacing: '.2em', textTransform: 'uppercase' }}>Ecosistemul</span>
          </div>
          <h2 className="serif" style={{ fontSize: 'clamp(2.2rem,5vw,4.5rem)', lineHeight: 1.05, color: 'rgba(255,255,255,.88)' }}>
            Trei produse.<br />
            <span className="serif-i" style={{ color: 'rgba(255,255,255,.25)' }}>O singură poveste.</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'rgba(220,120,60,.06)', borderRadius: 20, overflow: 'hidden' }}>
          {[
            { key: 'junior', icon: '✨', badge: 'Wisp Junior', age: '6 — 12 ani', ac: 'rgba(180,130,255,1)', dim: 'rgba(180,130,255,.1)', desc: 'Un prieten AI cu memorie. Sesiuni scurte de 8 minute, jocuri cognitive camuflate în aventuri, mod voce și XP real.', features: ['Sesiuni 8 min — fereastra ADHD', 'Jocuri cognitive + leaderboard', 'Dashboard parental lunar'], href: '/wisp', d: '1' },
            { key: 'teen', icon: '⚡', badge: 'Wisp Teen', age: '13 — 18 ani', ac: 'rgba(220,120,60,1)', dim: 'rgba(220,120,60,.1)', desc: 'AI ca partener, nu profesor. Roast mode, alter ego, battle mode, homework helper, mood tracker și misiuni secrete.', features: ['Roast mode + battle mode', 'Alter ego (Hacker/Artist/Rebel)', 'Streak rebel + misiuni zilnice'], href: '/wisp-teen', d: '2' },
            { key: 'flow', icon: '◎', badge: 'Flow', age: '18+ ani', ac: 'rgba(160,80,220,1)', dim: 'rgba(160,80,220,.1)', desc: '18+ funcții: Focus Timer, Mood Tracker, Habit Tracker, Jurnal, Roata Vieții, Capsulă Temporală, Confesiune și alte surprize.', features: ['18 funcții cu UI dedicat', '10 jocuri cognitive + leaderboard', 'Alter ego: Stoic / Optimist / Realist'], href: '/flow', d: '3' },
          ].map(p => (
            <div key={p.key} ref={s2.ref} className={`reveal d${p.d} ${s2.visible ? 'in' : ''} hover-up`}
              style={{ background: '#100a0a', padding: 36, display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: p.dim, border: `0.5px solid ${p.ac.replace('1)', '.2)')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 24 }}>{p.icon}</div>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 6 }}>{p.badge}</p>
              <h3 className="serif" style={{ fontSize: 26, color: 'rgba(255,255,255,.82)', marginBottom: 12 }}>{p.age}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', lineHeight: 1.65, fontWeight: 300, marginBottom: 24, flex: 1 }}>{p.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
                {p.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'rgba(255,255,255,.28)' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: p.ac.replace('1)', '.5)'), flexShrink: 0 }} />{f}
                  </div>
                ))}
              </div>
              <Link href={p.href} style={{ fontSize: 12, color: p.ac.replace('1)', '.6)'), textDecoration: 'none', transition: 'color .2s', display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={(e: any) => e.currentTarget.style.color = p.ac}
                onMouseLeave={(e: any) => e.currentTarget.style.color = p.ac.replace('1)', '.6)')}>
                deschide {p.badge} <span>→</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <hr className="line" style={{ maxWidth: 1100, margin: '0 auto' }} />

      {/* ══ XP & ACHIEVEMENTS ══ */}
      <section id="progres" style={{ padding: '120px 32px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div ref={s3.ref} className={`reveal ${s3.visible ? 'in' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 28, height: 1, background: 'rgba(220,120,60,.4)' }} />
            <span style={{ fontSize: 11, color: 'rgba(220,120,60,.5)', letterSpacing: '.2em', textTransform: 'uppercase' }}>Progres real</span>
          </div>
          <h2 className="serif" style={{ fontSize: 'clamp(2.2rem,5vw,4.5rem)', lineHeight: 1.05, color: 'rgba(255,255,255,.88)', marginBottom: 64 }}>
            Nu badge-uri de umplutură.<br />
            <span className="serif-i" style={{ color: 'rgba(255,255,255,.25)' }}>Ceva ce simți cu adevărat.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            <div className={`reveal d1 ${s3.visible ? 'in' : ''}`} style={{ background: 'rgba(220,120,60,.04)', border: '0.5px solid rgba(220,120,60,.1)', borderRadius: 20, padding: 36 }}>
              <div style={{ fontSize: 11, color: 'rgba(220,120,60,.5)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 20 }}>Sistemul XP</div>
              <p style={{ fontSize: 22, fontWeight: 300, color: 'rgba(255,255,255,.7)', lineHeight: 1.45, marginBottom: 28 }}>XP mai mare când ești obosit.<br />Pentru că atunci e mai greu.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {[
                  { label: 'Task completat cu energie scăzută', xp: '+60 XP', note: '3× — eroism real' },
                  { label: 'Task completat normal', xp: '+20 XP', note: 'baza' },
                  { label: 'Sesiune voce completă', xp: '+35 XP', note: 'bonus voice' },
                  { label: 'Zi consecutivă de streak', xp: '+15 XP', note: 'per zi' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '0.5px solid rgba(255,255,255,.05)' }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginBottom: 1 }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.18)' }}>{item.note}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(220,120,60,.9)', fontFamily: 'monospace' }}>{item.xp}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,.25)', marginBottom: 6 }}>
                  <span>Focusat · Nv. 4</span><span>500 / 900 XP</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: s3.visible ? '56%' : '0%', background: 'linear-gradient(90deg,rgba(220,120,60,.7),rgba(160,80,220,.6))', borderRadius: 2, transition: 'width 1.4s .5s ease' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className={`reveal d2 ${s3.visible ? 'in' : ''}`} style={{ background: 'rgba(160,80,220,.04)', border: '0.5px solid rgba(160,80,220,.1)', borderRadius: 20, padding: 24 }}>
                <div style={{ fontSize: 11, color: 'rgba(160,80,220,.5)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14 }}>Streak-uri cu cap</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,.55)', lineHeight: 1.55, fontWeight: 300, marginBottom: 14 }}>O zi de grație la 7 zile. Viața e haotică — știm asta.</p>
                <div style={{ display: 'flex', gap: 5 }}>
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < 5 ? 'linear-gradient(90deg,rgba(220,120,60,.5),rgba(160,80,220,.5))' : i === 5 ? 'rgba(255,180,60,.35)' : 'rgba(255,255,255,.07)' }} />
                  ))}
                </div>
              </div>
              <div className={`reveal d3 ${s3.visible ? 'in' : ''}`} style={{ background: 'rgba(255,255,255,.02)', border: '0.5px solid rgba(255,255,255,.07)', borderRadius: 20, padding: 24 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.22)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 18 }}>Achievements</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  {[
                    { icon: '🌱', label: 'Prima sesiune', u: true },
                    { icon: '🔥', label: '3 zile la rând', u: true },
                    { icon: '⭐', label: '500 XP', u: true },
                    { icon: '🏆', label: 'O săptămână', u: true },
                    { icon: '💜', label: '1000 XP', u: false },
                    { icon: '🚀', label: 'O lună', u: false },
                    { icon: '🎯', label: 'Dedicat', u: false },
                    { icon: '👑', label: 'Maestru', u: false },
                  ].map((b, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 6px', borderRadius: 10, background: b.u ? 'rgba(220,120,60,.07)' : 'rgba(255,255,255,.02)', border: `0.5px solid ${b.u ? 'rgba(220,120,60,.2)' : 'rgba(255,255,255,.05)'}`, animationName: s3.visible && b.u ? 'badge-pop' : 'none', animationDuration: '.5s', animationDelay: `${i * .06}s`, animationFillMode: 'both', animationTimingFunction: 'cubic-bezier(.16,1,.3,1)' }}>
                      <span style={{ fontSize: 18, filter: b.u ? 'none' : 'grayscale(1) opacity(.2)' }}>{b.icon}</span>
                      <span style={{ fontSize: 8, color: b.u ? 'rgba(220,120,60,.7)' : 'rgba(255,255,255,.12)', textAlign: 'center', lineHeight: 1.3 }}>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="line" style={{ maxWidth: 1100, margin: '0 auto' }} />

      {/* ══ PROBLEMA ══ */}
      <section style={{ padding: '120px 32px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div ref={s4.ref} className={`reveal ${s4.visible ? 'in' : ''}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 28, height: 1, background: 'rgba(220,120,60,.4)' }} />
                <span style={{ fontSize: 11, color: 'rgba(220,120,60,.5)', letterSpacing: '.2em', textTransform: 'uppercase' }}>Problema</span>
              </div>
              <h2 className="serif" style={{ fontSize: 'clamp(2rem,4.5vw,3.8rem)', lineHeight: 1.1, color: 'rgba(255,255,255,.88)', marginBottom: 22 }}>
                Alte apps renunță<br />
                <span className="serif-i" style={{ color: 'rgba(255,255,255,.25)' }}>la tine după<br />11 minute.</span>
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.3)', lineHeight: 1.75, fontWeight: 300, maxWidth: 320 }}>Fiecare app e construit pentru un creier neurotipic. Creierul cu ADHD funcționează diferit — nu mai lent, nu mai rău. Doar altfel.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
              {[
                { label: 'Tutori AI (Khan, Squirrel)', pct: 18, c: 'rgba(200,80,80,.5)' },
                { label: 'Apps educative (Duolingo)', pct: 24, c: 'rgba(200,120,60,.5)' },
                { label: 'Apps productivitate', pct: 12, c: 'rgba(180,170,60,.4)' },
                { label: 'Terapie cognitivă (referință)', pct: 72, c: 'rgba(255,255,255,.2)' },
                { label: 'Wisp + Flow (țintă)', pct: 65, c: 'rgba(220,120,60,.85)' },
              ].map((item, i) => (
                <div key={i} className={`reveal d${Math.min(i + 1, 4)} ${s4.visible ? 'in' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12, color: item.label.includes('Wisp') ? 'rgba(220,120,60,.8)' : 'rgba(255,255,255,.28)' }}>
                    <span>{item.label}</span><span style={{ fontFamily: 'monospace' }}>{item.pct}%</span>
                  </div>
                  <div style={{ height: 2, background: 'rgba(255,255,255,.05)', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: s4.visible ? `${item.pct}%` : '0%', background: item.label.includes('Wisp') ? 'linear-gradient(90deg,rgba(220,120,60,.8),rgba(160,80,220,.6))' : item.c, borderRadius: 1, transition: `width 1.2s ${.3 + i * .1}s ease` }} />
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.13)', fontWeight: 300, marginTop: 4 }}>retenție utilizatori la 30 de zile</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="line" style={{ maxWidth: 1100, margin: '0 auto' }} />

      {/* ══ MECANISMUL ══ */}
      <section style={{ padding: '120px 32px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div ref={s5.ref} className={`reveal ${s5.visible ? 'in' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 28, height: 1, background: 'rgba(220,120,60,.4)' }} />
            <span style={{ fontSize: 11, color: 'rgba(220,120,60,.5)', letterSpacing: '.2em', textTransform: 'uppercase' }}>Cum funcționează</span>
          </div>
          <h2 className="serif" style={{ fontSize: 'clamp(2.2rem,5vw,4.5rem)', lineHeight: 1.05, color: 'rgba(255,255,255,.88)', marginBottom: 80 }}>
            Cu cât vorbești mai mult,<br />
            <span className="serif-i" style={{ color: 'rgba(255,255,255,.25)' }}>cu atât te cunoaște mai bine.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 56 }}>
            {[
              { n: '01', title: 'Te ascultă', body: 'Primele sesiuni construiesc profilul tău — ce îți place, cum gândești, când obosești. Fără formulare, fără teste.', detail: 'Fiecare alegere devine semnal.' },
              { n: '02', title: 'Înțelege', body: 'Fiecare conversație adaugă context. După 30 de zile știe mai multe despre tine decât orice evaluare psihologică.', detail: 'Dificultate adaptivă, ton calibrat.' },
              { n: '03', title: 'Se adaptează', body: 'Ton, timing, tip de mesaj — totul se recalibrează în jurul tău. Nu poți copia un an de memorie.', detail: 'Nu tu te adaptezi la el. El se adaptează la tine.' },
            ].map((s, i) => (
              <div key={i} className={`reveal d${i + 1} ${s5.visible ? 'in' : ''}`}>
                <p style={{ fontSize: 11, color: 'rgba(160,80,220,.3)', fontFamily: 'monospace', marginBottom: 18 }}>{s.n}</p>
                <h3 className="serif" style={{ fontSize: 24, color: 'rgba(255,255,255,.78)', marginBottom: 12 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', lineHeight: 1.7, fontWeight: 300, marginBottom: 10 }}>{s.body}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.16)', lineHeight: 1.65, fontStyle: 'italic' }}>{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="line" style={{ maxWidth: 1100, margin: '0 auto' }} />

      {/* ══ PRETURI ══ */}
      <section id="preturi" style={{ padding: '120px 32px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div ref={s6.ref} className={`reveal ${s6.visible ? 'in' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 28, height: 1, background: 'rgba(220,120,60,.4)' }} />
            <span style={{ fontSize: 11, color: 'rgba(220,120,60,.5)', letterSpacing: '.2em', textTransform: 'uppercase' }}>Prețuri</span>
          </div>
          <h2 className="serif" style={{ fontSize: 'clamp(2.2rem,5vw,4.5rem)', lineHeight: 1.05, color: 'rgba(255,255,255,.88)', marginBottom: 64 }}>
            Clar.<br /><span className="serif-i" style={{ color: 'rgba(255,255,255,.25)' }}>Fără asteriscuri mici.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'rgba(220,120,60,.06)', borderRadius: 20, overflow: 'hidden' }}>
            {[
              { name: 'Wisp', price: '9', label: 'EUR / lună', desc: 'pentru familii active', features: ['Sesiuni nelimitate', 'Memorie completă', 'XP & achievements', 'Dashboard parental'], cta: 'hai cu Wisp', href: '/wisp', ac: 'rgba(180,130,255,1)', highlight: false },
              { name: 'Flow', price: '9–18', label: 'EUR / lună', desc: 'pentru adulți serioși', features: ['18+ funcții cu UI dedicat', '10 jocuri cognitive + XP', 'Alter ego + mood tracker', 'Focus Timer & Habit Tracker'], cta: 'încearcă Flow', href: '/flow', ac: 'rgba(220,120,60,1)', highlight: true },
              { name: 'B2B', price: '200–800', label: 'EUR / an / user', desc: 'școli, uni, cabinete', features: ['Licențe instituționale', 'Dashboard admin', 'Rapoarte agregate', 'Suport dedicat'], cta: 'vorbim', href: 'mailto:hello@wispflow.ai', ac: 'rgba(160,80,220,1)', highlight: false },
            ].map((plan, i) => (
              <div key={i} style={{ background: '#100a0a', padding: 40, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {plan.highlight && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(220,120,60,.5),transparent)' }} />}
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14 }}>{plan.name}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                    <span className="serif" style={{ fontSize: 38, color: 'rgba(255,255,255,.78)' }}>{plan.price}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', fontWeight: 300 }}>{plan.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', fontWeight: 300 }}>{plan.desc}</p>
                </div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 28, flex: 1 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'rgba(255,255,255,.3)', fontWeight: 300 }}>
                      <div style={{ width: 3, height: 3, borderRadius: '50%', background: plan.ac.replace('1)', '.5)'), flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} style={{ fontSize: 12, color: plan.ac.replace('1)', '.7)'), border: `0.5px solid ${plan.ac.replace('1)', '.2)')}`, padding: '11px 20px', borderRadius: 40, textAlign: 'center', textDecoration: 'none', transition: 'all .25s', background: plan.ac.replace('1)', '.06)') }}
                  onMouseEnter={(e: any) => { e.currentTarget.style.background = plan.ac.replace('1)', '.14)'); e.currentTarget.style.color = plan.ac }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.background = plan.ac.replace('1)', '.06)'); e.currentTarget.style.color = plan.ac.replace('1)', '.7)') }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="line" style={{ maxWidth: 1100, margin: '0 auto' }} />

      {/* ══ CTA FINAL ══ */}
      <section style={{ padding: '120px 32px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div ref={s7.ref} className={`reveal ${s7.visible ? 'in' : ''}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 60, alignItems: 'center' }}>
            <div style={{ maxWidth: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 28, height: 1, background: 'rgba(220,120,60,.4)' }} />
                <span style={{ fontSize: 11, color: 'rgba(220,120,60,.5)', letterSpacing: '.2em', textTransform: 'uppercase' }}>construim acum</span>
              </div>
              <h2 className="serif" style={{ fontSize: 'clamp(2.8rem,6.5vw,5.5rem)', lineHeight: .95, letterSpacing: '-.02em', color: 'rgba(255,255,255,.9)', marginBottom: 48 }}>
                Copiii cu ADHD<br />
                nu au nevoie de<br />
                mai multă disciplină.<br />
                <span className="serif-i" style={{ color: 'rgba(220,120,60,.4)' }}>Au nevoie de cineva<br />care îi înțelege.</span>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/wisp" style={{ display: 'flex', alignItems: 'center', gap: 10, background: WARM, color: '#100a0a', fontSize: 14, fontWeight: 500, padding: '14px 28px', borderRadius: 40, textDecoration: 'none', transition: 'all .3s' }}
                  onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(240,140,70,1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.background = WARM; e.currentTarget.style.transform = 'none' }}>
                  Wisp pentru copilul tău <span>→</span>
                </Link>
                {[['Flow pentru tine', '/flow'], ['Wisp Teen', '/wisp-teen']].map(([label, href]) => (
                  <Link key={href} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', border: '0.5px solid rgba(255,255,255,.1)', padding: '14px 24px', borderRadius: 40, textDecoration: 'none', transition: 'all .25s' }}
                    onMouseEnter={(e: any) => { e.currentTarget.style.color = 'rgba(255,255,255,.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.25)' }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.color = 'rgba(255,255,255,.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)' }}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: s7.visible ? 1 : 0, transform: s7.visible ? 'none' : 'translateY(20px)', transition: 'all .9s .4s' }}>
              <div style={{ animation: 'breathe-hero 5s ease-in-out infinite' }}>
                <HeroAvatar mood="happy" speaking={false} size={100} />
              </div>
              <div style={{ fontSize: 10, color: 'rgba(220,120,60,.4)', letterSpacing: '.1em', fontFamily: 'Georgia,serif', fontStyle: 'italic' }}>gata când ești tu</div>
            </div>
          </div>
        </div>
      </section>

      <hr className="line" style={{ maxWidth: 1100, margin: '0 auto' }}/>

      <LeaderboardSection/>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '0.5px solid rgba(220,120,60,.07)', padding: '40px 32px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,.45)', marginBottom: 4 }}>Wisp<span style={{ color: 'rgba(220,120,60,.35)' }}>+</span>Flow</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.14)', fontWeight: 300 }}>construit pentru minți care funcționează altfel. © 2026</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {[['Wisp Junior', '/wisp'], ['Wisp Teen', '/wisp-teen'], ['Flow', '/flow'], ['Contact', 'mailto:hello@wispflow.ai']].map(([label, href]) => (
              <Link key={href} href={href} style={{ fontSize: 12, color: 'rgba(255,255,255,.18)', textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={(e: any) => e.currentTarget.style.color = 'rgba(255,255,255,.5)'}
                onMouseLeave={(e: any) => e.currentTarget.style.color = 'rgba(255,255,255,.18)'}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}