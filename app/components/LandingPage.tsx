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

function ParticleBg() {
  const ps = useRef(Array.from({ length: 32 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    type: i % 3, size: 3 + Math.random() * 5,
    dur: 18 + Math.random() * 18, delay: Math.random() * 14,
    tx: (Math.random() - .5) * 90, ty: (Math.random() - .5) * 90,
    warm: i % 2 === 0,
  })))
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {ps.current.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: p.type === 2 ? p.size * 3 : p.size,
          height: p.type === 2 ? 1 : p.size,
          borderRadius: p.type === 1 ? '50%' : 0,
          background: p.warm ? `rgba(220,120,70,.08)` : `rgba(160,100,220,.07)`,
          transform: p.type === 0 ? 'rotate(45deg)' : 'none',
          animationName: 'pdrift', animationDuration: `${p.dur}s`,
          animationDelay: `${p.delay}s`, animationIterationCount: 'infinite',
          animationTimingFunction: 'ease-in-out',
          ['--tx' as any]: `${p.tx}px`, ['--ty' as any]: `${p.ty}px`,
        }} />
      ))}
    </div>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [mx, setMx] = useState(50); const [my, setMy] = useState(40)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    const onMouse = (e: MouseEvent) => { setMx(e.clientX / window.innerWidth * 100); setMy(e.clientY / window.innerHeight * 100) }
    window.addEventListener('scroll', onScroll); window.addEventListener('mousemove', onMouse)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('mousemove', onMouse) }
  }, [])

  const s1=useInView(),s2=useInView(),s3=useInView(),s4=useInView(),s5=useInView(),s6=useInView(),s7=useInView()

  const ACCENT = 'rgba(220,130,80,1)'
  const ACCENT2 = 'rgba(180,100,220,1)'
  const ACCENT_DIM = 'rgba(220,130,80,.18)'
  const ACCENT2_DIM = 'rgba(180,100,220,.15)'

  return (
    <div style={{ background: '#0d0a0f', color: 'rgba(255,255,255,.82)', minHeight: '100vh', overflowX: 'hidden', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        *::selection{background:rgba(220,130,80,.3);color:#fff}
        .serif{font-family:'DM Serif Display',Georgia,serif}
        .serif-i{font-family:'DM Serif Display',Georgia,serif;font-style:italic}
        .reveal{opacity:0;transform:translateY(22px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)}
        .reveal.in{opacity:1;transform:none}
        .d1{transition-delay:.1s}.d2{transition-delay:.22s}.d3{transition-delay:.34s}.d4{transition-delay:.46s}
        @keyframes pdrift{0%{opacity:0;transform:translate(0,0) rotate(45deg)}15%{opacity:1}85%{opacity:.35}100%{opacity:0;transform:translate(var(--tx),var(--ty)) rotate(100deg)}}
        @keyframes orb-drift{0%,100%{transform:translate(0,0)}33%{transform:translate(12px,-15px)}66%{transform:translate(-8px,10px)}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes float-av{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes glow{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes bar-fill{from{width:0}to{width:var(--w)}}
        @keyframes badge-pop{0%{transform:scale(0) rotate(-15deg);opacity:0}70%{transform:scale(1.1) rotate(3deg)}100%{transform:scale(1) rotate(0);opacity:1}}
        .hover-up{transition:transform .35s cubic-bezier(.16,1,.3,1)}
        .hover-up:hover{transform:translateY(-3px)}
        hr.line{border:none;border-top:1px solid rgba(255,255,255,.05)}
      `}</style>

      <ParticleBg/>

      {/* mouse glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, transition: 'all .8s', background: `radial-gradient(700px circle at ${mx}% ${my}%, rgba(220,100,50,.05), transparent 65%)` }}/>

      {/* warm gradient base */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180,80,40,.06), transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(140,60,200,.05), transparent 50%)' }}/>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, transition: 'all .4s', background: scrolled ? 'rgba(13,10,15,.92)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '0.5px solid rgba(220,130,80,.08)' : 'none' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,.8)', textDecoration: 'none', letterSpacing: '-.01em' }}>
            Wisp<span style={{ color: 'rgba(220,130,80,.5)' }}>+</span>Flow
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 12, color: 'rgba(255,255,255,.3)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
            {[['#produse','Produse'],['#progres','Progres'],['#preturi','Prețuri']].map(([href,label])=>(
              <a key={href} href={href} style={{ color: 'rgba(255,255,255,.3)', textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,.7)')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,.3)')}>{label}</a>
            ))}
          </div>
          <Link href="/flow" style={{ fontSize: 12, border: '0.5px solid rgba(220,130,80,.3)', color: 'rgba(220,130,80,.8)', padding: '8px 20px', borderRadius: 40, textDecoration: 'none', transition: 'all .25s', background: 'rgba(220,130,80,.06)' }}
            onMouseEnter={(e:any)=>{e.currentTarget.style.background='rgba(220,130,80,.14)';e.currentTarget.style.borderColor='rgba(220,130,80,.6)'}}
            onMouseLeave={(e:any)=>{e.currentTarget.style.background='rgba(220,130,80,.06)';e.currentTarget.style.borderColor='rgba(220,130,80,.3)'}}>
            Încearcă gratuit
          </Link>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 32px 80px', maxWidth: 1100, margin: '0 auto', zIndex: 2 }}>
        {/* warm orb */}
        <div style={{ position: 'absolute', top: '20%', right: '8%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,100,50,.1), transparent 70%)', animation: 'orb-drift 16s ease-in-out infinite', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: '25%', left: '5%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,70,220,.08), transparent 70%)', animation: 'orb-drift 22s ease-in-out infinite 4s', pointerEvents: 'none' }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 32, height: 1, background: `rgba(220,130,80,.4)` }}/>
            <span style={{ fontSize: 11, color: 'rgba(220,130,80,.6)', letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 300 }}>pentru minți care funcționează altfel</span>
          </div>

          <h1 className="serif" style={{ fontSize: 'clamp(3.2rem,8.5vw,7.5rem)', lineHeight: .92, letterSpacing: '-.02em', marginBottom: 40, color: 'rgba(255,255,255,.92)' }}>
            Nu forța creierul<br/>
            să se adapteze<br/>
            <span className="serif-i" style={{ color: 'rgba(220,130,80,.55)' }}>la sistem.</span>
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 80 }}>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.38)', lineHeight: 1.7, maxWidth: 380, fontWeight: 300 }}>
              Primul ecosistem AI pentru ADHD — de la 6 la 40+ ani. Construim sistemul în jurul tău.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/flow" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(220,130,80,1)', color: '#0d0a0f', fontSize: 14, fontWeight: 500, padding: '14px 28px', borderRadius: 40, textDecoration: 'none', transition: 'all .25s' }}
                onMouseEnter={(e:any)=>{e.currentTarget.style.background='rgba(240,150,90,1)';e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={(e:any)=>{e.currentTarget.style.background='rgba(220,130,80,1)';e.currentTarget.style.transform='none'}}>
                Încearcă Flow <span>→</span>
              </Link>
              <Link href="/wisp" style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', textDecoration: 'none', transition: 'color .2s' }}
                onMouseEnter={(e:any)=>e.currentTarget.style.color='rgba(255,255,255,.7)'}
                onMouseLeave={(e:any)=>e.currentTarget.style.color='rgba(255,255,255,.35)'}>
                sau Wisp pentru copii ↗
              </Link>
            </div>
          </div>

          {/* stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32, paddingTop: 32, borderTop: '0.5px solid rgba(255,255,255,.06)', maxWidth: 500 }}>
            {[
              { n: 150, s: 'M', label: 'familii cu ADHD global' },
              { n: 65, s: '%', label: 'retenție țintă' },
              { n: 3, s: '', label: 'produse · un ecosistem' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="serif" style={{ fontSize: 32, color: 'rgba(255,255,255,.75)', marginBottom: 4 }}>
                  <Counter to={stat.n} suffix={stat.s}/>
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,.22)', fontWeight: 300 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{ borderTop: '0.5px solid rgba(220,130,80,.08)', borderBottom: '0.5px solid rgba(220,130,80,.08)', padding: '14px 0', overflow: 'hidden', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: 64, whiteSpace: 'nowrap', animation: 'ticker 24s linear infinite' }}>
          {[...Array(2)].map((_,j)=>(
            <span key={j} style={{ display: 'flex', gap: 64 }}>
              {['Wisp Junior','·','Wisp Teen','·','Flow','·','ADHD','·','XP & Achievements','·','Deep Work','·','Memorie Persistentă','·','Task Breakdown','·','Streak-uri','·','Profil Neurologic','·'].map((t,i)=>(
                <span key={i} style={{ fontSize: 11, color: 'rgba(220,130,80,.2)', letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 300 }}>{t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ══ PRODUSE ══ */}
      <section id="produse" style={{ padding: '120px 32px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div ref={s1.ref} className={`reveal ${s1.visible?'in':''}`} style={{ marginBottom: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 28, height: 1, background: 'rgba(220,130,80,.4)' }}/>
            <span style={{ fontSize: 11, color: 'rgba(220,130,80,.5)', letterSpacing: '.2em', textTransform: 'uppercase' }}>Ecosistemul</span>
          </div>
          <h2 className="serif" style={{ fontSize: 'clamp(2.2rem,5vw,4.5rem)', lineHeight: 1.05, color: 'rgba(255,255,255,.88)' }}>
            Trei produse.<br/>
            <span className="serif-i" style={{ color: 'rgba(255,255,255,.3)' }}>O singură memorie.</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'rgba(220,130,80,.07)', borderRadius: 20, overflow: 'hidden' }}>
          {[
            { key:'junior', icon:'✨', badge:'Wisp Junior', age:'6 — 12 ani', accentColor:'rgba(180,140,255,1)', dimColor:'rgba(180,140,255,.12)',
              desc:'Companion AI cu personalitate și memorie. Sesiuni de 8 minute, puzzle-uri cognitive camuflate în aventuri.',
              features:['Sesiuni 8 min — fereastra ADHD','Detectie oboseală în timp real','Dashboard parental lunar'],
              href:'/wisp', d:'1' },
            { key:'teen', icon:'⚡', badge:'Wisp Teen', age:'13 — 18 ani', accentColor:'rgba(220,130,80,1)', dimColor:'rgba(220,130,80,.12)',
              desc:'Co-creator AI pentru proiecte reale. Cod, design, muzică, scriere — output concret în 3 zile.',
              features:['Proiecte reale în 3 zile','AI ca partener, nu profesor','Output demonstrabil'],
              href:'/wisp-teen', d:'2' },
            { key:'flow', icon:'◎', badge:'Flow', age:'18+ ani', accentColor:'rgba(200,130,100,1)', dimColor:'rgba(200,130,100,.12)',
              desc:'Partener AI pentru adulți cu ADHD sau burnout. Reorganizează creierul în jurul taskurilor, nu invers.',
              features:['Profil neurologic live','Calibrare zilnică pe stare','Pattern recognition după 7 zile'],
              href:'/flow', d:'3' },
          ].map((p) => (
            <div key={p.key} ref={s2.ref} className={`reveal d${p.d} ${s2.visible?'in':''} hover-up`}
              style={{ background: '#0d0a0f', padding: 36, display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: p.dimColor, border: `0.5px solid ${p.accentColor.replace('1)','0.2)')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 24 }}>
                {p.icon}
              </div>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,.22)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 6 }}>{p.badge}</p>
              <h3 className="serif" style={{ fontSize: 26, color: 'rgba(255,255,255,.82)', marginBottom: 12 }}>{p.age}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.3)', lineHeight: 1.65, fontWeight: 300, marginBottom: 24, flex: 1 }}>{p.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
                {p.features.map((f,i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'rgba(255,255,255,.28)' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: p.accentColor.replace('1)','.5)'), flexShrink: 0 }}/>
                    {f}
                  </div>
                ))}
              </div>
              <Link href={p.href} style={{ fontSize: 12, color: p.accentColor.replace('1)','.6)'), textDecoration: 'none', transition: 'color .2s', display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={(e:any)=>e.currentTarget.style.color=p.accentColor}
                onMouseLeave={(e:any)=>e.currentTarget.style.color=p.accentColor.replace('1)','.6)')}>
                Încearcă {p.badge} <span>→</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <hr className="line" style={{ maxWidth: 1100, margin: '0 auto' }}/>

      {/* ══ XP & ACHIEVEMENTS ══ */}
      <section id="progres" style={{ padding: '120px 32px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div ref={s3.ref} className={`reveal ${s3.visible?'in':''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 28, height: 1, background: 'rgba(220,130,80,.4)' }}/>
            <span style={{ fontSize: 11, color: 'rgba(220,130,80,.5)', letterSpacing: '.2em', textTransform: 'uppercase' }}>Progres real</span>
          </div>
          <h2 className="serif" style={{ fontSize: 'clamp(2.2rem,5vw,4.5rem)', lineHeight: 1.05, color: 'rgba(255,255,255,.88)', marginBottom: 64 }}>
            Nu badge-uri random.<br/>
            <span className="serif-i" style={{ color: 'rgba(255,255,255,.3)' }}>Recompense psihologice reale.</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            {/* LEFT — XP System */}
            <div className={`reveal d1 ${s3.visible?'in':''}`} style={{ background: 'rgba(220,130,80,.04)', border: '0.5px solid rgba(220,130,80,.1)', borderRadius: 20, padding: 36 }}>
              <div style={{ fontSize: 11, color: 'rgba(220,130,80,.5)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 20 }}>Sistemul XP</div>
              <p style={{ fontSize: 24, fontWeight: 300, color: 'rgba(255,255,255,.75)', lineHeight: 1.4, marginBottom: 32 }}>
                XP bazat pe energie,<br/>nu pe timp petrecut.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                {[
                  { label: 'Task completat cu energie scăzută', xp: '+60 XP', note: '3× multiplicator' },
                  { label: 'Task completat normal', xp: '+20 XP', note: 'baza' },
                  { label: 'Sesiune voce completă', xp: '+35 XP', note: 'bonus voice' },
                  { label: 'Streak zi consecutivă', xp: '+15 XP', note: 'per zi' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid rgba(255,255,255,.05)' }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.2)' }}>{item.note}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(220,130,80,.9)', fontFamily: 'monospace' }}>{item.xp}</div>
                  </div>
                ))}
              </div>
              {/* mini XP bar demo */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 6 }}>
                  <span>Focusat · Nv. 4</span><span>500 / 900 XP</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: s3.visible ? '56%' : '0%', background: 'rgba(220,130,80,.7)', borderRadius: 2, transition: 'width 1.2s .5s ease' }}/>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                  {['Începător','Curios','Constant','Focusat →','Dedicat','Performant','Expert','Maestru'].map((l,i)=>(
                    <span key={i} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: i===3?'rgba(220,130,80,.18)':'rgba(255,255,255,.04)', border: `0.5px solid ${i===3?'rgba(220,130,80,.35)':'rgba(255,255,255,.06)'}`, color: i===3?'rgba(220,130,80,.9)':'rgba(255,255,255,.25)' }}>{l}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — Achievements + Streak */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Streak */}
              <div className={`reveal d2 ${s3.visible?'in':''}`} style={{ background: 'rgba(180,100,220,.04)', border: '0.5px solid rgba(180,100,220,.1)', borderRadius: 20, padding: 28 }}>
                <div style={{ fontSize: 11, color: 'rgba(180,100,220,.5)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 16 }}>Streak-uri inteligente</div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,.6)', lineHeight: 1.55, fontWeight: 300 }}>
                      Streak-urile nu se resetează brutal. O zi de grație la 7 zile — pentru că viața nu e liniară.
                    </p>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 36, fontWeight: 300, color: 'rgba(180,100,220,.8)', fontFamily: 'monospace' }}>🔥</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', marginTop: 2 }}>zi de grație</div>
                  </div>
                </div>
                {/* streak dots */}
                <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                  {Array.from({length:7},(_,i)=>(
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i<5?'rgba(180,100,220,.5)':i===5?'rgba(255,180,60,.4)':'rgba(255,255,255,.08)' }}/>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,.18)' }}>
                  <span>5 zile la rând</span><span style={{color:'rgba(255,180,60,.4)'}}>zi grație</span><span>mâine</span>
                </div>
              </div>

              {/* Badges */}
              <div className={`reveal d3 ${s3.visible?'in':''}`} style={{ background: 'rgba(255,255,255,.02)', border: '0.5px solid rgba(255,255,255,.07)', borderRadius: 20, padding: 28 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 20 }}>Achievements deblocate</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                  {[
                    { icon:'🌱', label:'Prima sesiune', unlocked:true },
                    { icon:'🔥', label:'3 zile la rând', unlocked:true },
                    { icon:'⭐', label:'500 XP', unlocked:true },
                    { icon:'🏆', label:'O săptămână', unlocked:true },
                    { icon:'💜', label:'1000 XP', unlocked:false },
                    { icon:'🚀', label:'O lună', unlocked:false },
                    { icon:'🎯', label:'Dedicat', unlocked:false },
                    { icon:'👑', label:'Maestru', unlocked:false },
                  ].map((b,i)=>(
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', borderRadius: 12, background: b.unlocked?'rgba(220,130,80,.08)':'rgba(255,255,255,.02)', border: `0.5px solid ${b.unlocked?'rgba(220,130,80,.2)':'rgba(255,255,255,.05)'}`, animationName: s3.visible&&b.unlocked?'badge-pop':'none', animationDuration:'.5s', animationDelay:`${i*.06}s`, animationFillMode:'both', animationTimingFunction:'cubic-bezier(.16,1,.3,1)' }}>
                      <span style={{ fontSize: 20, filter: b.unlocked?'none':'grayscale(1) opacity(.25)' }}>{b.icon}</span>
                      <span style={{ fontSize: 9, color: b.unlocked?'rgba(220,130,80,.7)':'rgba(255,255,255,.15)', textAlign: 'center', lineHeight: 1.3 }}>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* motivation message */}
              <div className={`reveal d4 ${s3.visible?'in':''}`} style={{ background: 'rgba(220,130,80,.05)', border: '0.5px solid rgba(220,130,80,.12)', borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 22, flexShrink: 0 }}>🧠</div>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(220,130,80,.7)', marginBottom: 3, fontWeight: 500 }}>Mesaj motivațional adaptat</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', fontStyle: 'italic', fontWeight: 300 }}>
                    "Energie scăzută azi — XP dublu pentru fiecare task finalizat."
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="line" style={{ maxWidth: 1100, margin: '0 auto' }}/>

      {/* ══ PROBLEMA ══ */}
      <section style={{ padding: '120px 32px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div ref={s4.ref} className={`reveal ${s4.visible?'in':''}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 28, height: 1, background: 'rgba(220,130,80,.4)' }}/>
                <span style={{ fontSize: 11, color: 'rgba(220,130,80,.5)', letterSpacing: '.2em', textTransform: 'uppercase' }}>Problema</span>
              </div>
              <h2 className="serif" style={{ fontSize: 'clamp(2rem,4.5vw,3.8rem)', lineHeight: 1.1, color: 'rgba(255,255,255,.88)', marginBottom: 24 }}>
                Soluțiile existente<br/>
                <span className="serif-i" style={{ color: 'rgba(255,255,255,.3)' }}>eșuează după<br/>11 minute.</span>
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.32)', lineHeight: 1.75, fontWeight: 300, maxWidth: 320 }}>
                Fiecare app de productivitate, fiecare tutor AI e construit pentru un creier neurotipic. Creierul cu ADHD funcționează diferit — nu mai lent.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
              {[
                { label: 'Tutori AI (Khan, Squirrel)', pct: 18, c: 'rgba(200,80,80,.5)' },
                { label: 'Apps educative (Duolingo)', pct: 24, c: 'rgba(200,130,60,.5)' },
                { label: 'Apps productivitate', pct: 12, c: 'rgba(180,180,60,.4)' },
                { label: 'Terapie cognitivă (referință)', pct: 72, c: 'rgba(255,255,255,.2)' },
                { label: 'Wisp + Flow (țintă)', pct: 65, c: 'rgba(220,130,80,.8)' },
              ].map((item, i) => (
                <div key={i} className={`reveal d${Math.min(i+1,4)} ${s4.visible?'in':''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: item.label.includes('Wisp')?'rgba(220,130,80,.8)':'rgba(255,255,255,.3)' }}>
                    <span>{item.label}</span><span style={{ fontFamily: 'monospace' }}>{item.pct}%</span>
                  </div>
                  <div style={{ height: 2, background: 'rgba(255,255,255,.05)', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: s4.visible?`${item.pct}%`:'0%', background: item.c, borderRadius: 1, transition: `width 1.2s ${.3+i*.1}s ease` }}/>
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.15)', fontWeight: 300, marginTop: 4 }}>retenție utilizatori la 30 de zile</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="line" style={{ maxWidth: 1100, margin: '0 auto' }}/>

      {/* ══ CUM FUNCTIONEAZA ══ */}
      <section style={{ padding: '120px 32px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div ref={s5.ref} className={`reveal ${s5.visible?'in':''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 28, height: 1, background: 'rgba(220,130,80,.4)' }}/>
            <span style={{ fontSize: 11, color: 'rgba(220,130,80,.5)', letterSpacing: '.2em', textTransform: 'uppercase' }}>Mecanismul</span>
          </div>
          <h2 className="serif" style={{ fontSize: 'clamp(2.2rem,5vw,4.5rem)', lineHeight: 1.05, color: 'rgba(255,255,255,.88)', marginBottom: 80 }}>
            Memoria care crește<br/>
            <span className="serif-i" style={{ color: 'rgba(255,255,255,.3)' }}>odată cu tine.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 60 }}>
            {[
              { n:'01', title:'Observă', body:'Primele 3 sesiuni construiesc un profil complet — ce îți place, cum gândești, când obosești.', detail:'Fiecare alegere devine semnal. Curriculumul se naște din ce ești.' },
              { n:'02', title:'Învață', body:'Fiecare sesiune adaugă date. După 30 de zile știe mai multe despre tine decât orice evaluare punctuală.', detail:'Dificultate adaptivă, ton calibrat, momente de pauză — totul invizibil.' },
              { n:'03', title:'Adaptează', body:'Curriculum, ton, timing — totul se recalibrează automat în jurul profilului tău real.', detail:'Nu poți copia un an de memorie. Acesta este moatul care crește în timp.' },
            ].map((s,i)=>(
              <div key={i} className={`reveal d${i+1} ${s5.visible?'in':''}`}>
                <p style={{ fontSize: 11, color: 'rgba(220,130,80,.25)', fontFamily: 'monospace', marginBottom: 20 }}>{s.n}</p>
                <h3 className="serif" style={{ fontSize: 26, color: 'rgba(255,255,255,.78)', marginBottom: 14 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.32)', lineHeight: 1.7, fontWeight: 300, marginBottom: 12 }}>{s.body}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.18)', lineHeight: 1.65, fontStyle: 'italic' }}>{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="line" style={{ maxWidth: 1100, margin: '0 auto' }}/>

      {/* ══ PRETURI ══ */}
      <section id="preturi" style={{ padding: '120px 32px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div ref={s6.ref} className={`reveal ${s6.visible?'in':''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 28, height: 1, background: 'rgba(220,130,80,.4)' }}/>
            <span style={{ fontSize: 11, color: 'rgba(220,130,80,.5)', letterSpacing: '.2em', textTransform: 'uppercase' }}>Prețuri</span>
          </div>
          <h2 className="serif" style={{ fontSize: 'clamp(2.2rem,5vw,4.5rem)', lineHeight: 1.05, color: 'rgba(255,255,255,.88)', marginBottom: 64 }}>
            Simplu.<br/><span className="serif-i" style={{ color: 'rgba(255,255,255,.3)' }}>Fără surprize.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'rgba(220,130,80,.07)', borderRadius: 20, overflow: 'hidden' }}>
            {[
              { name:'Wisp', price:'9', label:'EUR / lună', desc:'Pentru familii active', features:['Sesiuni nelimitate','Memorie completă','XP & achievements','Dashboard parental'], cta:'Începe cu Wisp', href:'/wisp', ac:'rgba(180,140,255,1)', highlight:false },
              { name:'Flow', price:'9–18', label:'EUR / lună', desc:'Pentru adulți cu ADHD sau burnout', features:['Profil neurologic live','Task breakdown automat','XP & pattern recognition','Coaching AI săptămânal'], cta:'Încearcă Flow', href:'/flow', ac:'rgba(220,130,80,1)', highlight:true },
              { name:'B2B', price:'200–800', label:'EUR / an / user', desc:'Școli, universități, cabinete', features:['Licențe instituționale','Dashboard admin','Rapoarte agregate','Suport dedicat'], cta:'Contactează-ne', href:'mailto:hello@wispflow.ai', ac:'rgba(160,200,130,1)', highlight:false },
            ].map((plan,i)=>(
              <div key={i} style={{ background:'#0d0a0f', padding:40, display:'flex', flexDirection:'column', position:'relative' }}>
                {plan.highlight&&<div style={{ position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(220,130,80,.5),transparent)' }}/>}
                <div style={{ marginBottom:28 }}>
                  <p style={{ fontSize:10,color:'rgba(255,255,255,.2)',letterSpacing:'.15em',textTransform:'uppercase',marginBottom:16 }}>{plan.name}</p>
                  <div style={{ display:'flex',alignItems:'baseline',gap:6,marginBottom:4 }}>
                    <span className="serif" style={{ fontSize:40,color:'rgba(255,255,255,.78)' }}>{plan.price}</span>
                    <span style={{ fontSize:12,color:'rgba(255,255,255,.22)',fontWeight:300 }}>{plan.label}</span>
                  </div>
                  <p style={{ fontSize:12,color:'rgba(255,255,255,.22)',fontWeight:300 }}>{plan.desc}</p>
                </div>
                <ul style={{ display:'flex',flexDirection:'column',gap:10,marginBottom:32,flex:1 }}>
                  {plan.features.map((f,j)=>(
                    <li key={j} style={{ display:'flex',alignItems:'center',gap:10,fontSize:12,color:'rgba(255,255,255,.32)',fontWeight:300 }}>
                      <div style={{ width:3,height:3,borderRadius:'50%',background:plan.ac.replace('1)','.5)'),flexShrink:0 }}/>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} style={{ fontSize:12,color:plan.ac.replace('1)','.7)'),border:`0.5px solid ${plan.ac.replace('1)','.2)')}`,padding:'11px 20px',borderRadius:40,textAlign:'center',textDecoration:'none',transition:'all .25s',background:plan.ac.replace('1)','.06)') }}
                  onMouseEnter={(e:any)=>{e.currentTarget.style.background=plan.ac.replace('1)','.14)');e.currentTarget.style.color=plan.ac}}
                  onMouseLeave={(e:any)=>{e.currentTarget.style.background=plan.ac.replace('1)','.06)');e.currentTarget.style.color=plan.ac.replace('1)','.7)')}}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="line" style={{ maxWidth: 1100, margin: '0 auto' }}/>

      {/* ══ CTA FINAL ══ */}
      <section style={{ padding: '120px 32px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div ref={s7.ref} className={`reveal ${s7.visible?'in':''}`}>
          <div style={{ maxWidth: 900 }}>
            <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:20 }}>
              <div style={{ width:28,height:1,background:'rgba(220,130,80,.4)' }}/>
              <span style={{ fontSize:11,color:'rgba(220,130,80,.5)',letterSpacing:'.2em',textTransform:'uppercase' }}>Construim acum</span>
            </div>
            <h2 className="serif" style={{ fontSize:'clamp(2.8rem,7.5vw,6.5rem)',lineHeight:.93,letterSpacing:'-.02em',color:'rgba(255,255,255,.9)',marginBottom:56 }}>
              Copiii cu ADHD<br/>
              nu au nevoie de<br/>
              mai multă disciplină.<br/>
              <span className="serif-i" style={{ color:'rgba(220,130,80,.4)' }}>Au nevoie de un<br/>sistem care îi înțelege.</span>
            </h2>
            <div style={{ display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
              <Link href="/wisp" style={{ display:'flex',alignItems:'center',gap:10,background:'rgba(220,130,80,1)',color:'#0d0a0f',fontSize:14,fontWeight:500,padding:'14px 28px',borderRadius:40,textDecoration:'none',transition:'all .25s' }}
                onMouseEnter={(e:any)=>{e.currentTarget.style.background='rgba(240,150,90,1)';e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={(e:any)=>{e.currentTarget.style.background='rgba(220,130,80,1)';e.currentTarget.style.transform='none'}}>
                Wisp pentru copilul tău <span>→</span>
              </Link>
              {[['Flow pentru tine','/flow'],['Wisp Teen','/wisp-teen']].map(([label,href])=>(
                <Link key={href} href={href} style={{ fontSize:13,color:'rgba(255,255,255,.35)',border:'0.5px solid rgba(255,255,255,.1)',padding:'14px 24px',borderRadius:40,textDecoration:'none',transition:'all .25s' }}
                  onMouseEnter={(e:any)=>{e.currentTarget.style.color='rgba(255,255,255,.75)';e.currentTarget.style.borderColor='rgba(255,255,255,.25)'}}
                  onMouseLeave={(e:any)=>{e.currentTarget.style.color='rgba(255,255,255,.35)';e.currentTarget.style.borderColor='rgba(255,255,255,.1)'}}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:'0.5px solid rgba(220,130,80,.08)',padding:'40px 32px',position:'relative',zIndex:2 }}>
        <div style={{ maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20 }}>
          <div>
            <p style={{ fontSize:14,fontWeight:500,color:'rgba(255,255,255,.5)',marginBottom:4 }}>Wisp<span style={{color:'rgba(220,130,80,.4)'}}>+</span>Flow</p>
            <p style={{ fontSize:11,color:'rgba(255,255,255,.15)',fontWeight:300 }}>Construit pentru minți care funcționează altfel. © 2026</p>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:28 }}>
            {[['Wisp Junior','/wisp'],['Wisp Teen','/wisp-teen'],['Flow','/flow'],['Contact','mailto:hello@wispflow.ai']].map(([label,href])=>(
              <Link key={href} href={href} style={{ fontSize:12,color:'rgba(255,255,255,.2)',textDecoration:'none',transition:'color .2s' }}
                onMouseEnter={(e:any)=>e.currentTarget.style.color='rgba(255,255,255,.5)'}
                onMouseLeave={(e:any)=>e.currentTarget.style.color='rgba(255,255,255,.2)'}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}