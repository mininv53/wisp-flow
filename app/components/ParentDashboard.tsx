'use client'

import { useState, useEffect } from 'react'
import { Star, Clock, Brain, Trophy, TrendingUp, Copy, Check, ExternalLink } from 'lucide-react'

interface WispProfile {
  name: string
  age: number
  stars: number
  sessionsCompleted: number
}

interface PuzzleRecord {
  subject: string
  emoji: string
  correct: boolean
  date: string
}

interface SessionRecord {
  date: string
  mood: string
  duration: number // minutes
  starsEarned: number
  puzzlesDone: number
}

interface DashboardData {
  profile: WispProfile
  sessions: SessionRecord[]
  puzzles: PuzzleRecord[]
  generatedAt: string
}

// ── Tiny bar chart ──
function WeekBar({ sessions }: { sessions: SessionRecord[] }) {
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  const today = new Date()

  const weekData = days.map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    const dateStr = d.toLocaleDateString('ro-RO')
    const daySessions = sessions.filter(s => s.date === dateStr)
    return {
      label: days[i],
      minutes: daySessions.reduce((sum, s) => sum + s.duration, 0),
      active: daySessions.length > 0
    }
  })

  const maxMin = Math.max(...weekData.map(d => d.minutes), 1)

  return (
    <div className="flex items-end gap-2 h-20">
      {weekData.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full flex items-end justify-center" style={{ height: '64px' }}>
            <div
              className={`w-full rounded-sm transition-all duration-700 ${d.active ? 'bg-indigo-500' : 'bg-white/5'}`}
              style={{ height: d.minutes > 0 ? `${Math.max((d.minutes / maxMin) * 100, 8)}%` : '8%' }}
            />
          </div>
          <span className="text-white/20 text-[10px]">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Donut chart for puzzles ──
function PuzzleDonut({ correct, total }: { correct: number; total: number }) {
  const pct = total > 0 ? correct / total : 0
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = pct * circ

  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke="#6366f1" strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        className="transition-all duration-1000"
      />
      <text x="36" y="40" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">
        {total > 0 ? Math.round(pct * 100) : 0}%
      </text>
    </svg>
  )
}

// ════════════════════
// DASHBOARD VIEW
// ════════════════════
function ParentDashboard({ data }: { data: DashboardData }) {
  const { profile, sessions, puzzles } = data

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0)
  const totalPuzzles = puzzles.length
  const correctPuzzles = puzzles.filter(p => p.correct).length
  const totalSessions = sessions.length

  // subject breakdown
  const subjects: Record<string, { total: number; correct: number }> = {}
  puzzles.forEach(p => {
    if (!subjects[p.subject]) subjects[p.subject] = { total: 0, correct: 0 }
    subjects[p.subject].total++
    if (p.correct) subjects[p.subject].correct++
  })
  const topSubjects = Object.entries(subjects)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 4)

  // mood breakdown
  const moods: Record<string, number> = {}
  sessions.forEach(s => { if (s.mood) moods[s.mood] = (moods[s.mood] || 0) + 1 })
  const topMood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-6 py-10 max-w-4xl mx-auto"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
      .serif { font-family: 'DM Serif Display', serif; }`}</style>

      {/* Header */}
      <div className="mb-10">
        <p className="text-white/30 text-xs tracking-widest uppercase mb-2">Dashboard Parental · Wisp</p>
        <h1 className="serif text-4xl text-white/90 mb-1">
          {profile.name}
          <span className="text-white/25 text-2xl">, {profile.age} ani</span>
        </h1>
        <p className="text-white/25 text-sm">Generat {data.generatedAt}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { icon: <Star size={14} className="text-yellow-400" />, value: profile.stars, label: 'Stele totale' },
          { icon: <Clock size={14} className="text-indigo-400" />, value: `${totalMinutes}m`, label: 'Timp total' },
          { icon: <Brain size={14} className="text-purple-400" />, value: totalPuzzles, label: 'Puzzle-uri' },
          { icon: <Trophy size={14} className="text-emerald-400" />, value: totalSessions, label: 'Sesiuni' },
        ].map((k, i) => (
          <div key={i} className="bg-white/3 border border-white/6 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">{k.icon}
              <span className="text-white/30 text-xs">{k.label}</span>
            </div>
            <p className="text-2xl font-semibold text-white/80">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Week chart + Puzzle donut */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white/3 border border-white/6 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={13} className="text-indigo-400" />
            <p className="text-white/40 text-xs uppercase tracking-wide">Progres săptămânal</p>
          </div>
          {sessions.length > 0
            ? <WeekBar sessions={sessions} />
            : <p className="text-white/20 text-xs text-center py-6">Nu există sesiuni înregistrate încă.</p>
          }
        </div>

        <div className="bg-white/3 border border-white/6 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Brain size={13} className="text-purple-400" />
            <p className="text-white/40 text-xs uppercase tracking-wide">Acuratețe puzzle-uri</p>
          </div>
          <div className="flex items-center gap-6">
            <PuzzleDonut correct={correctPuzzles} total={totalPuzzles} />
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-white/60 font-medium">{correctPuzzles} corecte</p>
                <p className="text-white/25 text-xs">din {totalPuzzles} total</p>
              </div>
              {topMood && (
                <div>
                  <p className="text-white/40 text-xs">Stare predominantă</p>
                  <p className="text-xl">{topMood[0]}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="bg-white/3 border border-white/6 rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <Star size={13} className="text-yellow-400" />
          <p className="text-white/40 text-xs uppercase tracking-wide">Subiecte favorite</p>
        </div>
        {topSubjects.length > 0 ? (
          <div className="space-y-3">
            {topSubjects.map(([subject, data], i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-white/60">{subject}</span>
                  <span className="text-xs text-white/25">{data.correct}/{data.total} corecte</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-1 bg-indigo-500/60 rounded-full transition-all duration-700"
                    style={{ width: `${(data.total / Math.max(...topSubjects.map(s => s[1].total))) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/20 text-xs">Niciun puzzle rezolvat încă.</p>
        )}
      </div>

      {/* Recent sessions */}
      <div className="bg-white/3 border border-white/6 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={13} className="text-indigo-400" />
          <p className="text-white/40 text-xs uppercase tracking-wide">Ultimele sesiuni</p>
        </div>
        {sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.slice(-5).reverse().map((s, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-white/4 last:border-0">
                <span className="text-lg w-8">{s.mood || '–'}</span>
                <div className="flex-1">
                  <p className="text-xs text-white/50">{s.date}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/30">
                  <span>{s.duration} min</span>
                  <span className="text-yellow-400">+{s.starsEarned}⭐</span>
                  <span>{s.puzzlesDone} puzzle-uri</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/20 text-xs">Nicio sesiune înregistrată încă.</p>
        )}
      </div>

      <p className="text-center text-white/10 text-xs mt-8">
        Date actualizate în timp real din profilul lui {profile.name} · Wisp+Flow
      </p>
    </div>
  )
}

// ════════════════════
// LINK GENERATOR (in Wisp app)
// ════════════════════
export function ParentLinkGenerator() {
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const profile = localStorage.getItem('wisp-profile')
    if (!profile) return
    // generate a stable ID from profile name+age
    const p = JSON.parse(profile)
    const id = btoa(`${p.name}-${p.age}-wisp`).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)
    // save ID so dashboard can read it
    localStorage.setItem('wisp-parent-id', id)
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    setLink(`${base}/parinte/${id}`)
  }, [])

  const copy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!link) return null

  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-4 mt-4">
      <p className="text-white/40 text-xs mb-3 flex items-center gap-1.5">
        <ExternalLink size={11} /> Link dashboard parental
      </p>
      <div className="flex items-center gap-2">
        <p className="flex-1 text-xs text-white/50 font-mono truncate bg-black/30 px-3 py-2 rounded-lg">
          {link}
        </p>
        <button onClick={copy}
          className="shrink-0 flex items-center gap-1.5 text-xs border border-white/10 hover:border-white/25 text-white/40 hover:text-white px-3 py-2 rounded-lg transition-all">
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? 'Copiat!' : 'Copiază'}
        </button>
      </div>
      <p className="text-white/20 text-[10px] mt-2">
        Trimite acest link părintelui — actualizat automat după fiecare sesiune.
      </p>
    </div>
  )
}

// ════════════════════
// MAIN EXPORT — route page
// ════════════════════
export default function ParentDashboardPage({ childId }: { childId?: string }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Try to load data — in production this would be a DB fetch
    // For now we read from localStorage (same browser) or show empty state
    const profile = localStorage.getItem('wisp-profile')
    const sessions = localStorage.getItem('wisp-sessions-full')
    const puzzles = localStorage.getItem('wisp-puzzles-full')

    if (!profile) {
      setError('Profilul copilului nu a fost găsit. Asigurați-vă că copilul a folosit Wisp cel puțin o dată pe acest dispozitiv.')
      return
    }

    const p = JSON.parse(profile)
    const s: SessionRecord[] = sessions ? JSON.parse(sessions) : []
    const pz: PuzzleRecord[] = puzzles ? JSON.parse(puzzles) : []

    setData({
      profile: p,
      sessions: s,
      puzzles: pz,
      generatedAt: new Date().toLocaleString('ro-RO')
    })
  }, [childId])

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div className="text-center max-w-sm">
          <p className="text-white/20 text-5xl mb-6">👨‍👩‍👧</p>
          <h2 className="text-white/70 text-xl font-medium mb-3">Dashboard Parental</h2>
          <p className="text-white/30 text-sm leading-relaxed mb-6">{error}</p>
          <a href="/wisp"
            className="text-sm border border-white/10 hover:border-white/25 text-white/50 hover:text-white px-6 py-3 rounded-full transition-all inline-block">
            Deschide Wisp →
          </a>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    )
  }

  return <ParentDashboard data={data} />
}