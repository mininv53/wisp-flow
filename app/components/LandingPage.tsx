'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const { ref, visible } = useInView()
  useEffect(() => {
    if (!visible) return
    let cur = 0
    const step = Math.ceil(to / 50)
    const id = setInterval(() => {
      cur += step
      if (cur >= to) { setVal(to); clearInterval(id) }
      else setVal(cur)
    }, 28)
    return () => clearInterval(id)
  }, [visible, to])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    const onMouse = (e: MouseEvent) => {
      setMouseX((e.clientX / window.innerWidth) * 100)
      setMouseY((e.clientY / window.innerHeight) * 100)
    }
    window.addEventListener('scroll', onScroll)
    window.addEventListener('mousemove', onMouse)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('mousemove', onMouse) }
  }, [])

  const s1 = useInView()
  const s2 = useInView()
  const s3 = useInView()
  const s4 = useInView()
  const s5 = useInView()
  const s6 = useInView()

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen overflow-x-hidden selection:bg-white selection:text-black"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .serif-italic { font-family: 'DM Serif Display', Georgia, serif; font-style: italic; }
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1); }
        .reveal.in { opacity: 1; transform: none; }
        .reveal-d1 { transition-delay: 0.1s; }
        .reveal-d2 { transition-delay: 0.22s; }
        .reveal-d3 { transition-delay: 0.34s; }
        .reveal-d4 { transition-delay: 0.46s; }
        .line-draw { stroke-dasharray: 1000; stroke-dashoffset: 1000; transition: stroke-dashoffset 1.8s cubic-bezier(0.16,1,0.3,1); }
        .line-draw.in { stroke-dashoffset: 0; }
        @keyframes drift { 0%,100% { transform: translate(0,0); } 33% { transform: translate(6px,-8px); } 66% { transform: translate(-4px,5px); } }
        .drift { animation: drift 12s ease-in-out infinite; }
        .drift-slow { animation: drift 18s ease-in-out infinite 3s; }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-inner { animation: ticker 22s linear infinite; }
        .hover-lift { transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); }
        .hover-lift:hover { transform: translateY(-3px); }
        hr.fancy { border: none; border-top: 1px solid rgba(255,255,255,0.06); }
      `}</style>

      {/* ── Ambient glow follows mouse ── */}
      <div className="fixed inset-0 pointer-events-none z-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(600px circle at ${mouseX}% ${mouseY}%, rgba(120,80,255,0.04), transparent 70%)`
        }} />

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.04]' : ''}`}>
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium tracking-tight">
            Wisp<span className="text-white/30">+</span>Flow
          </Link>
          <div className="hidden md:flex items-center gap-10 text-xs text-white/40 tracking-wide uppercase">
            <a href="#produse" className="hover:text-white transition-colors duration-300">Produse</a>
            <a href="#cum-functioneaza" className="hover:text-white transition-colors duration-300">Cum funcționează</a>
            <a href="#preturi" className="hover:text-white transition-colors duration-300">Prețuri</a>
          </div>
          <Link href="/flow"
            className="text-xs border border-white/15 hover:border-white/40 text-white/70 hover:text-white px-5 py-2.5 rounded-full transition-all duration-300">
            Încearcă gratuit
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center px-8 pt-32 pb-20 max-w-6xl mx-auto">

        {/* floating orbs */}
        <div className="absolute top-40 right-20 w-72 h-72 rounded-full drift opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute bottom-40 left-10 w-48 h-48 rounded-full drift-slow opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #4f46e5, transparent)' }} />

        <div className="relative z-10 max-w-5xl">
          {/* eyebrow */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-6 h-px bg-white/20" />
            <span className="text-white/35 text-xs tracking-[0.2em] uppercase font-light">
              Pentru minți care funcționează altfel
            </span>
          </div>

          {/* headline */}
          <h1 className="serif text-[clamp(3.5rem,9vw,8rem)] leading-[0.92] tracking-tight mb-10 text-white/95">
            Nu forța creierul<br />
            să se adapteze<br />
            <span className="serif-italic text-white/45">la sistem.</span>
          </h1>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 mb-24">
            <p className="text-white/40 text-base leading-relaxed max-w-xs font-light">
              Primul ecosistem AI pentru ADHD — de la 6 la 40+ ani. Construim sistemul în jurul tău.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/flow"
                className="group flex items-center gap-3 bg-white text-black text-sm font-medium px-7 py-3.5 rounded-full hover:bg-white/90 transition-all duration-300 hover-lift">
                Încearcă Flow
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
              <Link href="/wisp"
                className="text-sm text-white/40 hover:text-white transition-colors duration-300">
                sau Wisp pentru copii ↗
              </Link>
            </div>
          </div>

          {/* stats row */}
          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/[0.06] max-w-lg">
            {[
              { n: 150, s: 'M', label: 'familii cu ADHD global' },
              { n: 65, s: '%', label: 'retenție țintă' },
              { n: 3, s: '', label: 'produse. un ecosistem.' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="serif text-3xl text-white/80 mb-1">
                  <Counter to={stat.n} suffix={stat.s} />
                </p>
                <p className="text-white/25 text-xs font-light">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="border-y border-white/[0.05] py-4 overflow-hidden">
        <div className="ticker-inner flex gap-16 whitespace-nowrap text-white/15 text-xs tracking-widest uppercase font-light">
          {[...Array(2)].map((_, j) => (
            <span key={j} className="flex gap-16">
              {['Wisp Junior', '·', 'Wisp Teen', '·', 'Wisp Adult', '·', 'Flow', '·', 'ADHD', '·', 'Deep Work', '·', 'Pattern Recognition', '·', 'Memorie Persistentă', '·', 'Task Breakdown', '·', 'Profil Neurologic', '·'].map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          PRODUSE
      ══════════════════════════════════════ */}
      <section id="produse" className="py-40 px-8 max-w-6xl mx-auto">

        <div ref={s1.ref} className={`reveal ${s1.visible ? 'in' : ''} mb-20`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-px bg-white/20" />
            <span className="text-white/35 text-xs tracking-[0.2em] uppercase font-light">Ecosistemul</span>
          </div>
          <h2 className="serif text-[clamp(2.5rem,6vw,5rem)] leading-tight text-white/90">
            Trei produse.<br />
            <span className="serif-italic text-white/35">O singură memorie.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-white/[0.05] rounded-2xl overflow-hidden">

          {/* Wisp Junior */}
          <div ref={s2.ref}
            className={`reveal ${s2.visible ? 'in' : ''} reveal-d1 bg-[#0a0a0a] p-8 flex flex-col hover-lift group`}>
            <div className="mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-lg mb-6">
                🤖
              </div>
              <p className="text-white/25 text-xs tracking-widest uppercase mb-2">Wisp Junior</p>
              <h3 className="serif text-2xl text-white/85 mb-3">6 — 12 ani</h3>
              <p className="text-white/35 text-sm leading-relaxed font-light">
                Companion AI cu personalitate și memorie. Sesiuni de 8 minute, puzzle-uri cognitive camuflate în aventuri, profil psihocognitiv lunar.
              </p>
            </div>
            <div className="mt-auto space-y-2 mb-6">
              {['Sesiuni 8 min — fereastra ADHD', 'Detectie oboseală în timp real', 'Dashboard parental lunar'].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-white/30">
                  <div className="w-1 h-1 rounded-full bg-indigo-400/50" />
                  {f}
                </div>
              ))}
            </div>
            <Link href="/wisp"
              className="text-xs text-indigo-400/60 group-hover:text-indigo-400 transition-colors duration-300 flex items-center gap-1.5">
              Încearcă Wisp Junior <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>
          </div>

          {/* Wisp Teen */}
          <div ref={s2.ref}
            className={`reveal ${s2.visible ? 'in' : ''} reveal-d2 bg-[#0a0a0a] p-8 flex flex-col hover-lift group border-x border-white/[0.05]`}>
            <div className="mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg mb-6">
                ⌨️
              </div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-white/25 text-xs tracking-widest uppercase">Wisp Teen</p>
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/70 px-2 py-0.5 rounded-full">nou</span>
              </div>
              <h3 className="serif text-2xl text-white/85 mb-3">13 — 18 ani</h3>
              <p className="text-white/35 text-sm leading-relaxed font-light">
                Co-creator AI pentru proiecte reale. Cod, design, muzică, scriere — output concret și partajabil în 3 zile, nu certificate.
              </p>
            </div>
            <div className="mt-auto space-y-2 mb-6">
              {['Proiecte reale în 3 zile', 'AI ca partener, nu ca profesor', 'Output demonstrabil și partajabil'].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-white/30">
                  <div className="w-1 h-1 rounded-full bg-emerald-400/50" />
                  {f}
                </div>
              ))}
            </div>
            <Link href="/wisp-teen"
              className="text-xs text-emerald-400/60 group-hover:text-emerald-400 transition-colors duration-300 flex items-center gap-1.5">
              Încearcă Wisp Teen <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>
          </div>

          {/* Flow */}
          <div ref={s2.ref}
            className={`reveal ${s2.visible ? 'in' : ''} reveal-d3 bg-[#0a0a0a] p-8 flex flex-col hover-lift group`}>
            <div className="mb-8">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-lg mb-6">
                ⚡
              </div>
              <p className="text-white/25 text-xs tracking-widest uppercase mb-2">Flow</p>
              <h3 className="serif text-2xl text-white/85 mb-3">18+ ani</h3>
              <p className="text-white/35 text-sm leading-relaxed font-light">
                Partener AI pentru adulți cu ADHD, burnout sau deficit de motivație. Nu organizează task-uri — reorganizează creierul în jurul lor.
              </p>
            </div>
            <div className="mt-auto space-y-2 mb-6">
              {['Profil neurologic live', 'Calibrare zilnică pe stare', 'Pattern recognition după 7 zile'].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-white/30">
                  <div className="w-1 h-1 rounded-full bg-purple-400/50" />
                  {f}
                </div>
              ))}
            </div>
            <Link href="/flow"
              className="text-xs text-purple-400/60 group-hover:text-purple-400 transition-colors duration-300 flex items-center gap-1.5">
              Încearcă Flow <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>
          </div>

        </div>
      </section>

      <hr className="fancy max-w-6xl mx-auto" />

      {/* ══════════════════════════════════════
          PROBLEMA
      ══════════════════════════════════════ */}
      <section className="py-40 px-8 max-w-6xl mx-auto">
        <div ref={s3.ref} className={`reveal ${s3.visible ? 'in' : ''}`}>
          <div className="grid md:grid-cols-2 gap-20 items-start">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-6 h-px bg-white/20" />
                <span className="text-white/35 text-xs tracking-[0.2em] uppercase font-light">Problema</span>
              </div>
              <h2 className="serif text-[clamp(2rem,5vw,4rem)] leading-tight text-white/90 mb-8">
                Soluțiile existente<br />
                <span className="serif-italic text-white/35">eșuează după<br />11 minute.</span>
              </h2>
              <p className="text-white/35 text-sm leading-relaxed font-light max-w-xs">
                Fiecare app de productivitate, fiecare tutor AI, fiecare joc educativ e construit pentru un creier neurotipic. Creierul cu ADHD funcționează diferit — nu mai lent.
              </p>
            </div>

            <div className="space-y-5 pt-4">
              {[
                { label: 'Tutori AI (Khan, Squirrel)', pct: 18, color: 'bg-red-500/40' },
                { label: 'Apps educative (Duolingo)', pct: 24, color: 'bg-orange-500/40' },
                { label: 'Apps productivitate', pct: 12, color: 'bg-yellow-500/40' },
                { label: 'Terapie cognitivă (referință)', pct: 72, color: 'bg-white/20' },
                { label: 'Wisp + Flow (țintă)', pct: 65, color: 'bg-purple-400/60' },
              ].map((item, i) => (
                <div key={i} className={`reveal reveal-d${Math.min(i + 1, 4)} ${s3.visible ? 'in' : ''}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-white/35 font-light">{item.label}</span>
                    <span className={`text-xs font-medium ${item.label.includes('Wisp') ? 'text-purple-400' : 'text-white/20'}`}>
                      {item.pct}%
                    </span>
                  </div>
                  <div className="h-px bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-px ${item.color} transition-all duration-1000 delay-300`}
                      style={{ width: s3.visible ? `${item.pct}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-white/15 text-xs font-light pt-2">retenție utilizatori la 30 de zile</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="fancy max-w-6xl mx-auto" />

      {/* ══════════════════════════════════════
          CUM FUNCTIONEAZA
      ══════════════════════════════════════ */}
      <section id="cum-functioneaza" className="py-40 px-8 max-w-6xl mx-auto">
        <div ref={s4.ref} className={`reveal ${s4.visible ? 'in' : ''}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-px bg-white/20" />
            <span className="text-white/35 text-xs tracking-[0.2em] uppercase font-light">Mecanismul</span>
          </div>
          <h2 className="serif text-[clamp(2.5rem,6vw,5rem)] leading-tight text-white/90 mb-20">
            Memoria care crește<br />
            <span className="serif-italic text-white/35">odată cu tine.</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-16">
            {[
              {
                n: '01', title: 'Observă',
                body: 'Primele 3 sesiuni construiesc un profil complet — ce îți place, cum gândești, când obosești, ce te blochează.',
                detail: 'Fiecare alegere în conversație devine semnal. Curriculumul se naște din ce ești — nu din ce decide un minister.'
              },
              {
                n: '02', title: 'Învață',
                body: 'Fiecare sesiune adaugă date. După 30 de zile știe mai multe despre tine decât orice evaluare psihologică punctuală.',
                detail: 'Dificultate adaptivă, ton calibrat, momente de pauză — totul invizibil, totul automat.'
              },
              {
                n: '03', title: 'Adaptează',
                body: 'Curriculum, ton, dificultate, timing — totul se recalibrează automat în jurul profilului tău real.',
                detail: 'Nu poți copia un an de memorie dintr-o relație reală. Acesta este moatul care crește în timp.'
              },
            ].map((s, i) => (
              <div key={i} className={`reveal reveal-d${i + 1} ${s4.visible ? 'in' : ''}`}>
                <p className="text-white/10 text-xs font-mono mb-6">{s.n}</p>
                <h3 className="serif text-2xl text-white/80 mb-4">{s.title}</h3>
                <p className="text-white/35 text-sm leading-relaxed font-light mb-4">{s.body}</p>
                <p className="text-white/20 text-xs leading-relaxed font-light italic">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="fancy max-w-6xl mx-auto" />

      {/* ══════════════════════════════════════
          PRETURI
      ══════════════════════════════════════ */}
      <section id="preturi" className="py-40 px-8 max-w-6xl mx-auto">
        <div ref={s5.ref} className={`reveal ${s5.visible ? 'in' : ''}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-px bg-white/20" />
            <span className="text-white/35 text-xs tracking-[0.2em] uppercase font-light">Prețuri</span>
          </div>
          <h2 className="serif text-[clamp(2.5rem,6vw,5rem)] leading-tight text-white/90 mb-20">
            Simplu.<br />
            <span className="serif-italic text-white/35">Fără surprize.</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {[
              {
                name: 'Wisp', price: '9', label: 'EUR / lună',
                desc: 'Pentru familii active',
                features: ['Sesiuni nelimitate', 'Memorie completă', 'Curriculum adaptat', 'Dashboard parental'],
                cta: 'Începe cu Wisp', href: '/wisp', accent: 'text-indigo-400'
              },
              {
                name: 'Flow', price: '9–18', label: 'EUR / lună',
                desc: 'Pentru adulți cu ADHD sau burnout',
                features: ['Profil neurologic live', 'Task breakdown automat', 'Pattern recognition', 'Coaching AI săptămânal'],
                cta: 'Încearcă Flow', href: '/flow', accent: 'text-purple-400',
                highlight: true
              },
              {
                name: 'B2B', price: '200–800', label: 'EUR / an / user',
                desc: 'Școli, universități, cabinete',
                features: ['Licențe instituționale', 'Dashboard admin', 'Rapoarte agregate', 'Suport dedicat'],
                cta: 'Contactează-ne', href: 'mailto:hello@wispflow.ai', accent: 'text-emerald-400'
              },
            ].map((plan, i) => (
              <div key={i}
                className={`bg-[#0a0a0a] p-10 flex flex-col ${plan.highlight ? 'relative' : ''}`}>
                {plan.highlight && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                )}
                <div className="mb-8">
                  <p className="text-white/20 text-xs tracking-widest uppercase mb-4">{plan.name}</p>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="serif text-4xl text-white/80">{plan.price}</span>
                    <span className="text-white/25 text-xs font-light">{plan.label}</span>
                  </div>
                  <p className="text-white/25 text-xs font-light">{plan.desc}</p>
                </div>
                <ul className="space-y-3 mb-10 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-xs text-white/35 font-light">
                      <div className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}
                  className={`text-xs ${plan.accent} border border-white/8 hover:border-white/20 px-5 py-3 rounded-full text-center transition-all duration-300 hover-lift`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="fancy max-w-6xl mx-auto" />

      {/* ══════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════ */}
      <section className="py-40 px-8 max-w-6xl mx-auto">
        <div ref={s6.ref} className={`reveal ${s6.visible ? 'in' : ''}`}>
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-px bg-white/20" />
              <span className="text-white/35 text-xs tracking-[0.2em] uppercase font-light">Construim acum</span>
            </div>
            <h2 className="serif text-[clamp(3rem,8vw,7rem)] leading-[0.92] tracking-tight text-white/90 mb-12">
              Copiii cu ADHD<br />
              nu au nevoie de<br />
              mai multă disciplină.<br />
              <span className="serif-italic text-white/30">Au nevoie de un<br />sistem care îi înțelege.</span>
            </h2>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link href="/wisp"
                className="group flex items-center gap-3 bg-white text-black text-sm font-medium px-8 py-4 rounded-full hover:bg-white/90 transition-all duration-300 hover-lift">
                Wisp pentru copilul tău
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
              <Link href="/flow"
                className="group flex items-center gap-3 border border-white/10 hover:border-white/25 text-white/50 hover:text-white text-sm px-8 py-4 rounded-full transition-all duration-300">
                Flow pentru tine
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
              <Link href="/wisp-teen"
                className="group flex items-center gap-3 border border-white/10 hover:border-white/25 text-white/50 hover:text-white text-sm px-8 py-4 rounded-full transition-all duration-300">
                Wisp Teen
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.04] py-12 px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-white/50 text-sm font-medium mb-1">Wisp+Flow</p>
            <p className="text-white/15 text-xs font-light">
              Construit pentru minți care funcționează altfel. © 2026
            </p>
          </div>
          <div className="flex items-center gap-8 text-xs text-white/20 font-light">
            <Link href="/wisp" className="hover:text-white/50 transition-colors">Wisp Junior</Link>
            <Link href="/wisp-teen" className="hover:text-white/50 transition-colors">Wisp Teen</Link>
            <Link href="/flow" className="hover:text-white/50 transition-colors">Flow</Link>
            <a href="mailto:hello@wispflow.ai" className="hover:text-white/50 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}