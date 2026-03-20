'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/* ─── tiny hook: reveals element when it enters viewport ─── */
function useInView(threshold = 0.15) {
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

/* ─── animated counter ─── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const { ref, visible } = useInView()
  useEffect(() => {
    if (!visible) return
    let start = 0
    const step = Math.ceil(to / 60)
    const id = setInterval(() => {
      start += step
      if (start >= to) { setVal(to); clearInterval(id) }
      else setVal(start)
    }, 24)
    return () => clearInterval(id)
  }, [visible, to])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

/* ─── robot mini SVG for hero ─── */
function MiniRobot({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <line x1="50" y1="8" x2="50" y2="20" stroke="#818cf8" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="50" cy="6" r="4" fill="#fbbf24">
        <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <rect x="15" y="20" width="70" height="60" rx="16" fill="#1e1b4b" stroke="#4338ca" strokeWidth="2"/>
      <rect x="22" y="27" width="56" height="46" rx="10" fill="#0f0a2e"/>
      <ellipse cx="36" cy="48" rx="9" ry="9" fill="#34d399" opacity="0.9"/>
      <ellipse cx="64" cy="48" rx="9" ry="9" fill="#34d399" opacity="0.9"/>
      <circle cx="39" cy="45" r="2.5" fill="white" opacity="0.7"/>
      <circle cx="67" cy="45" r="2.5" fill="white" opacity="0.7"/>
      <path d="M 30 58 Q 50 70 70 58" stroke="#34d399" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <ellipse cx="26" cy="60" rx="5" ry="3" fill="#f472b6" opacity="0.4"/>
      <ellipse cx="74" cy="60" rx="5" ry="3" fill="#f472b6" opacity="0.4"/>
      <circle cx="15" cy="50" r="4" fill="#312e81" stroke="#4338ca" strokeWidth="1.5"/>
      <circle cx="85" cy="50" r="4" fill="#312e81" stroke="#4338ca" strokeWidth="1.5"/>
    </svg>
  )
}

/* ─── flow icon ─── */
function FlowIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="#1a0533" stroke="#7c3aed" strokeWidth="2"/>
      <path d="M 30 50 Q 50 20 70 50 Q 50 80 30 50" fill="#7c3aed" opacity="0.6"/>
      <circle cx="50" cy="50" r="10" fill="#a855f7">
        <animate attributeName="r" values="10;13;10" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite"/>
      </circle>
      <line x1="50" y1="18" x2="50" y2="28" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="50" y1="72" x2="50" y2="82" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="18" y1="50" x2="28" y2="50" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="72" y1="50" x2="82" y2="50" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

/* ════════════════════════════════ MAIN ════════════════════════════════ */
export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState<'wisp' | 'flow'>('wisp')

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const s1 = useInView()
  const s2 = useInView()
  const s3 = useInView()
  const s4 = useInView()
  const s5 = useInView()

  return (
    <div
      className="min-h-screen bg-[#06030f] text-white overflow-x-hidden"
      style={{ fontFamily: "'DM Sans', 'Nunito', system-ui, sans-serif" }}
    >
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        .font-display { font-family: 'Syne', system-ui, sans-serif; }
        .fade-up { opacity: 0; transform: translateY(32px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .fade-up-d1 { transition-delay: 0.1s; }
        .fade-up-d2 { transition-delay: 0.2s; }
        .fade-up-d3 { transition-delay: 0.35s; }
        .fade-up-d4 { transition-delay: 0.5s; }
        .glow-purple { box-shadow: 0 0 40px rgba(139,92,246,0.35); }
        .glow-indigo  { box-shadow: 0 0 40px rgba(99,102,241,0.35); }
        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 24px 48px rgba(0,0,0,0.4); }
        .noise::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.4;
        }
        .mesh-bg {
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99,102,241,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 80%, rgba(139,92,246,0.14) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 60% 30%, rgba(16,185,129,0.07) 0%, transparent 60%),
            #06030f;
        }
        @keyframes float { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-16px) rotate(2deg); } }
        .float { animation: float 6s ease-in-out infinite; }
        .float-delay { animation: float 6s ease-in-out infinite 1.5s; }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .shimmer-line {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          background-size: 400px 1px;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? 'bg-[#06030f]/90 backdrop-blur-md border-b border-white/5' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">W</div>
            <span className="font-display font-800 text-lg tracking-tight">Wisp<span className="text-purple-400">+</span>Flow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#produs" className="hover:text-white transition-colors">Produs</a>
            <a href="#cum-functioneaza" className="hover:text-white transition-colors">Cum funcționează</a>
            <a href="#preturi" className="hover:text-white transition-colors">Prețuri</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/wisp" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">
              Wisp Junior →
            </Link>
            <Link
              href="/flow"
              className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-full transition-all font-medium"
            >
              Încearcă Flow
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="mesh-bg noise relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        {/* floating decorations */}
        <div className="absolute top-32 left-12 float opacity-30 hidden lg:block">
          <MiniRobot size={64} />
        </div>
        <div className="absolute bottom-32 right-16 float-delay opacity-20 hidden lg:block">
          <FlowIcon size={56} />
        </div>
        <div className="absolute top-1/2 left-8 w-px h-32 shimmer-line hidden lg:block" />
        <div className="absolute top-1/2 right-8 w-px h-32 shimmer-line hidden lg:block" />

        {/* badge */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-indigo-300 mb-8 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Beta deschis — 50 locuri rămase
        </div>

        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-800 leading-[0.95] tracking-tight mb-6 max-w-4xl">
          Creierul tău<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            funcționează altfel.
          </span><br />
          <span className="text-gray-200">Noi construim</span><br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">în jurul lui.</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
          Wisp + Flow — primul ecosistem AI pentru minți cu ADHD, de la 6 la 40+ ani.
          Nu te forțăm să te adaptezi la sistem. Construim sistemul în jurul tău.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            href="/wisp"
            className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-4 rounded-2xl text-base font-semibold transition-all glow-indigo"
          >
            <MiniRobot size={24} />
            Wisp pentru copii
            <span className="text-indigo-300 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <Link
            href="/flow"
            className="group flex items-center gap-3 bg-purple-700/50 hover:bg-purple-600/70 border border-purple-500/40 text-white px-7 py-4 rounded-2xl text-base font-semibold transition-all"
          >
            <FlowIcon size={24} />
            Flow pentru adulți
            <span className="text-purple-300 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* stats */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
          {[
            { n: 150, suffix: 'M', label: 'familii afectate de ADHD' },
            { n: 65,  suffix: '%', label: 'retenție țintă la 30 de zile' },
            { n: 84,  suffix: '%', label: 'scor problemă startup' },
          ].map((s, i) => (
            <div key={i}>
              <p className="font-display text-4xl md:text-5xl font-800 text-white">
                <Counter to={s.n} suffix={s.suffix} />
              </p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section id="produs" className="py-24 px-6">
        <div
          ref={s1.ref}
          className={`max-w-5xl mx-auto fade-up ${s1.visible ? 'visible' : ''}`}
        >
          <div className="text-center mb-16">
            <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-4">Problema</p>
            <h2 className="font-display text-4xl md:text-5xl font-800 leading-tight">
              Soluțiile existente<br />
              <span className="text-gray-500">eșuează în medie după</span>{' '}
              <span className="text-red-400">11 minute</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { label: 'Tutori AI (Khan, Squirrel)', pct: 18, color: 'bg-red-500' },
              { label: 'Apps educative (Duolingo)', pct: 24, color: 'bg-orange-500' },
              { label: 'Apps productivitate (Notion)', pct: 12, color: 'bg-yellow-500' },
              { label: 'Wisp + Flow (țintă)', pct: 65, color: 'bg-purple-500' },
            ].map((item, i) => (
              <div key={i} className={`bg-white/3 border border-white/8 rounded-2xl p-5 card-hover fade-up fade-up-d${i + 1} ${s1.visible ? 'visible' : ''}`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-300">{item.label}</span>
                  <span className={`text-sm font-bold ${item.pct === 65 ? 'text-purple-400' : 'text-gray-400'}`}>
                    {item.pct}%
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${item.color} transition-all duration-1000`}
                    style={{ width: s1.visible ? `${item.pct}%` : '0%' }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">retenție utilizatori la 30 de zile</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS TAB ── */}
      <section id="cum-functioneaza" className="py-24 px-6 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent">
        <div ref={s2.ref} className={`max-w-5xl mx-auto fade-up ${s2.visible ? 'visible' : ''}`}>
          <div className="text-center mb-12">
            <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-4">Produsele</p>
            <h2 className="font-display text-4xl md:text-5xl font-800">Două produse. Un ecosistem.</h2>
          </div>

          {/* Tab switcher */}
          <div className="flex justify-center mb-10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-1.5 flex gap-2">
              <button
                onClick={() => setActiveTab('wisp')}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'wisp'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🤖 Wisp — 6 la 25 ani
              </button>
              <button
                onClick={() => setActiveTab('flow')}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'flow'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                ⚡ Flow — 18+ ani
              </button>
            </div>
          </div>

          {activeTab === 'wisp' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <MiniRobot size={52} />
                  <div>
                    <h3 className="font-display text-2xl font-800">Wisp Junior</h3>
                    <p className="text-indigo-400 text-sm">Companion AI pentru copii 6–12 ani</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: '🧠', title: 'Profil psihocognitiv', desc: 'Wisp înțelege cum gândește copilul tău în primele 3 sesiuni.' },
                    { icon: '⏱️', title: 'Sesiuni de 8 minute', desc: 'Exact fereastra de atenție ADHD. Niciodată mai mult fără consimțământ.' },
                    { icon: '🧩', title: 'Puzzle-uri cognitive', desc: 'Matematică, logică, știință — camuflate în aventuri.' },
                    { icon: '⭐', title: 'Sistem de stele', desc: 'Motivație intrinsecă, nu badge-uri fără sens.' },
                  ].map((f, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white/3 border border-white/8 rounded-xl card-hover">
                      <span className="text-2xl">{f.icon}</span>
                      <div>
                        <p className="font-semibold text-sm text-white">{f.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/wisp"
                  className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                >
                  Testează Wisp acum →
                </Link>
              </div>

              <div className="bg-gradient-to-br from-indigo-950 to-purple-950 rounded-3xl p-8 border border-indigo-800/40 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #6366f1 0%, transparent 50%)' }}
                />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10"><MiniRobot size={40} /></div>
                    <div>
                      <p className="font-bold text-sm">WISP</p>
                      <p className="text-indigo-400 text-xs">Robotul tău prieten</p>
                    </div>
                  </div>
                  {[
                    { role: 'bot', text: 'Bună, Alex! 🤖 Ce aventură facem azi — spațiu sau dinozauri?' },
                    { role: 'user', text: 'Dinozauri! 🦕' },
                    { role: 'bot', text: 'Misiune activată! 🦖 Știai că T-Rex-ul alerga cu 30 km/h? Hai să rezolvăm un puzzle despre el!' },
                  ].map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                      <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === 'user'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white/10 text-gray-100 border border-white/10'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 bg-indigo-900/60 rounded-2xl p-4 border border-indigo-700/40">
                    <p className="text-xs text-indigo-300 mb-2 font-semibold">🧩 Puzzle magic</p>
                    <p className="text-sm text-white mb-3">Dacă T-Rex aleargă 30 km/h, câți km face în 2 ore?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['40 km', '60 km', '50 km', '70 km'].map((o, i) => (
                        <button key={i} className={`text-xs py-2 rounded-lg border transition-all ${
                          i === 1
                            ? 'bg-green-600/30 border-green-500 text-green-200'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}>
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'flow' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FlowIcon size={52} />
                  <div>
                    <h3 className="font-display text-2xl font-800">Flow</h3>
                    <p className="text-purple-400 text-sm">Partener AI pentru adulți 18+</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: '🧬', title: 'Profil neurologic live', desc: 'Primele 3 zile Flow te observă și construiește profilul tău real.', pct: 72 },
                    { icon: '☀️', title: 'Calibrare zilnică', desc: 'Un emoji la start. Flow recalibrează tot programul zilei.', pct: 68 },
                    { icon: '⚡', title: 'Task breakdown automat', desc: "'Trebuie să termin licența' → 12 micro-taskuri de 25 min.", pct: 81 },
                    { icon: '📊', title: 'Pattern recognition', desc: 'După 7 zile știe când ești productiv și reorganizează agenda.', pct: 65 },
                  ].map((f, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white/3 border border-white/8 rounded-xl card-hover">
                      <span className="text-2xl">{f.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-semibold text-sm text-white">{f.title}</p>
                          <span className="text-xs text-purple-400 font-bold">{f.pct}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/flow"
                  className="mt-6 inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                >
                  Testează Flow acum →
                </Link>
              </div>

              <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #7c3aed 0%, transparent 50%)' }}
                />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-xs">⚡</div>
                    <p className="font-bold text-sm">Flow</p>
                    <span className="ml-auto text-xs text-green-400 animate-pulse">● Live</span>
                  </div>
                  {[
                    { role: 'bot', text: 'Bună! Cum te simți azi?' },
                    { role: 'user', text: '😴' },
                    { role: 'bot', text: 'Zi grea, înțeleg. Hai cu taskuri mici — primul e atât de simplu că e imposibil să refuzi. Ce trebuie să faci azi?' },
                    { role: 'user', text: 'Trebuie să termin capitolul 3 din licență' },
                    { role: 'bot', text: 'Perfect! Am spart asta în 4 pași de 25 min:\n1. Citește notițele de ieri (25 min)\n2. Scrie introducerea (25 min)\n3. Argumentul principal (25 min)\n4. Concluzie + revizuire (25 min)' },
                  ].map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                      <div className={`max-w-xs rounded-2xl px-3 py-2 text-xs whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-200 border border-gray-700'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6">
        <div ref={s3.ref} className={`max-w-5xl mx-auto fade-up ${s3.visible ? 'visible' : ''}`}>
          <div className="text-center mb-16">
            <p className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-4">Cum funcționează</p>
            <h2 className="font-display text-4xl md:text-5xl font-800">
              Memoria care crește<br />
              <span className="text-gray-500">cu tine în timp</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01', icon: '👁️', title: 'Observă',
                desc: 'Primele 3 sesiuni construiesc un profil complet — ce îți place, cum gândești, când obosești.',
                color: 'border-indigo-800/60 bg-indigo-950/30'
              },
              {
                step: '02', icon: '🧠', title: 'Învață',
                desc: 'Fiecare sesiune adaugă date. După 30 de zile știe mai multe despre tine decât orice test psihologic.',
                color: 'border-purple-800/60 bg-purple-950/30'
              },
              {
                step: '03', icon: '🎯', title: 'Adaptează',
                desc: 'Curriculum, ton, dificultate, timing — totul se recalibrează automat în jurul profilului tău.',
                color: 'border-pink-800/60 bg-pink-950/20'
              },
            ].map((s, i) => (
              <div key={i} className={`rounded-2xl p-6 border ${s.color} card-hover fade-up fade-up-d${i + 1} ${s3.visible ? 'visible' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{s.icon}</span>
                  <span className="text-xs text-gray-600 font-mono">{s.step}</span>
                </div>
                <h3 className="font-display text-xl font-800 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-indigo-950/50 to-purple-950/50 border border-white/8 rounded-3xl p-8 text-center">
            <p className="text-gray-400 text-sm mb-2">Moat-ul care crește în timp</p>
            <p className="font-display text-2xl md:text-3xl font-800 text-white">
              Un competitor poate copia features.<br />
              <span className="text-purple-400">Nu poate copia un an de memorie dintr-o relație reală.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="preturi" className="py-24 px-6 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
        <div ref={s4.ref} className={`max-w-5xl mx-auto fade-up ${s4.visible ? 'visible' : ''}`}>
          <div className="text-center mb-16">
            <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-4">Prețuri</p>
            <h2 className="font-display text-4xl md:text-5xl font-800">Simplu și scalabil</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Wisp Standard', price: '9', period: 'EUR/lună',
                desc: 'Pentru familii active',
                features: ['Sesiuni nelimitate', 'Memorie completă', 'Curriculum adaptat', 'Puzzle-uri cognitive'],
                cta: 'Începe gratuit', href: '/wisp',
                highlight: false, color: 'border-indigo-800/40'
              },
              {
                name: 'Flow Pro', price: '18', period: 'EUR/lună',
                desc: 'Pentru freelanceri & profesioniști',
                features: ['Profil neurologic complet', 'Pattern recognition', 'Coaching AI săptămânal', 'Raport lunar'],
                cta: 'Încearcă Flow', href: '/flow',
                highlight: true, color: 'border-purple-500/60'
              },
              {
                name: 'B2B Educație', price: '200–800', period: 'EUR/an/user',
                desc: 'Școli, universități, cabinete',
                features: ['Licențe instituționale', 'Dashboard admin', 'Rapoarte agregate', 'Suport dedicat'],
                cta: 'Contactează-ne', href: 'mailto:hello@wispflow.ai',
                highlight: false, color: 'border-green-800/40'
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 border ${plan.color} ${plan.highlight ? 'glow-purple scale-105' : ''} card-hover bg-white/3 relative`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Popular
                  </div>
                )}
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-display text-4xl font-800">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <p className="text-gray-500 text-xs mb-5">{plan.desc}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-green-400 text-xs">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-white/8 hover:bg-white/15 text-white border border-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6">
        <div ref={s5.ref} className={`max-w-3xl mx-auto text-center fade-up ${s5.visible ? 'visible' : ''}`}>
          <p className="text-gray-600 text-sm mb-6 uppercase tracking-widest font-semibold">Construim acum</p>
          <h2 className="font-display text-5xl md:text-6xl font-800 leading-tight mb-6">
            Copiii cu ADHD nu au<br />
            nevoie de mai multă disciplină.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Au nevoie de un sistem<br />care îi înțelege.
            </span>
          </h2>
          <p className="text-gray-500 mb-10 text-lg">
            Wisp + Flow este acel sistem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/wisp"
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-base font-semibold transition-all glow-indigo"
            >
              <MiniRobot size={22} /> Wisp pentru copilul tău
            </Link>
            <Link
              href="/flow"
              className="flex items-center justify-center gap-2 bg-purple-700/50 hover:bg-purple-600/60 border border-purple-500/40 text-white px-8 py-4 rounded-2xl text-base font-semibold transition-all"
            >
              <FlowIcon size={22} /> Flow pentru tine
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">W</div>
            <span className="font-display font-800 text-sm">Wisp<span className="text-purple-400">+</span>Flow</span>
          </div>
          <p className="text-gray-700 text-xs">
            © 2026 Wisp+Flow. Construit cu ❤️ pentru minți care funcționează altfel.
          </p>
          <div className="flex items-center gap-6 text-xs text-gray-700">
            <Link href="/wisp" className="hover:text-gray-400 transition-colors">Wisp</Link>
            <Link href="/flow" className="hover:text-gray-400 transition-colors">Flow</Link>
            <a href="mailto:hello@wispflow.ai" className="hover:text-gray-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}