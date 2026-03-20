'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, ChevronRight, Circle, CheckCircle2, Clock, Zap, TerminalSquare, FolderOpen, GitBranch } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Task {
  id: number
  text: string
  done: boolean
  day: number
}

interface Project {
  id: number
  title: string
  domain: string
  emoji: string
  description: string
  daysLeft: number
  tasks: Task[]
  createdAt: string
}

interface TeenProfile {
  name: string
  age: number
  domain: string
  projectsDone: number
  currentStreak: number
}

const DOMAINS = [
  { id: 'cod', label: 'Cod', emoji: '⌨️', desc: 'Aplicații, site-uri, scripturi, tooluri' },
  { id: 'design', label: 'Design', emoji: '◻️', desc: 'Branding, UI, ilustrații, vizual identity' },
  { id: 'muzica', label: 'Muzică', emoji: '◈', desc: 'Versuri, beaturi, compoziții, producție' },
  { id: 'scriere', label: 'Scriere', emoji: '∴', desc: 'Povești, eseuri, scenarii, blog' },
  { id: 'antreprenoriat', label: 'Business', emoji: '◇', desc: 'Idei, validare, pitch-uri, strategie' },
  { id: 'stiinta', label: 'Știință', emoji: '⬡', desc: 'Experimente, cercetare, proiecte STEM' },
]

// ── Minimal terminal cursor ──
function Cursor() {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const id = setInterval(() => setOn(v => !v), 530)
    return () => clearInterval(id)
  }, [])
  return <span className={`inline-block w-2 h-4 bg-emerald-400 ml-0.5 align-middle ${on ? 'opacity-100' : 'opacity-0'}`} />
}

// ── Day progress bar ──
function DayBar({ day, total = 3 }: { day: number; total?: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(total)].map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            i < day ? 'bg-emerald-500' : i === day ? 'bg-emerald-900' : 'bg-zinc-800'
          }`}
        />
      ))}
    </div>
  )
}

export default function WispTeen() {
  const [phase, setPhase] = useState<'onboarding' | 'domain' | 'chat' | 'project' | 'build'>('onboarding')
  const [step, setStep] = useState(0)
  const [nameInput, setNameInput] = useState('')
  const [ageInput, setAgeInput] = useState('')
  const [profile, setProfile] = useState<TeenProfile | null>(null)
  const [selectedDomain, setSelectedDomain] = useState('')

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [thinking, setThinking] = useState('')

  const [project, setProject] = useState<Project | null>(null)
  const [activeDay, setActiveDay] = useState(0)
  const [sessionTimer, setSessionTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('wisp-teen-profile')
    const savedProject = localStorage.getItem('wisp-teen-project')
    if (saved) {
      const p = JSON.parse(saved)
      setProfile(p)
      setSelectedDomain(p.domain)
      if (savedProject) {
        setProject(JSON.parse(savedProject))
        setPhase('build')
      } else {
        setPhase('chat')
        initChat(p)
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!timerActive) return
    const id = setInterval(() => setSessionTimer(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [timerActive])

  const saveProfile = (p: TeenProfile) => {
    setProfile(p)
    localStorage.setItem('wisp-teen-profile', JSON.stringify(p))
  }

  const saveProject = (p: Project) => {
    setProject(p)
    localStorage.setItem('wisp-teen-project', JSON.stringify(p))
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const initChat = (p: TeenProfile) => {
    const domainLabel = DOMAINS.find(d => d.id === p.domain)?.label || p.domain
    setMessages([{
      role: 'assistant',
      content: `${p.name}. Bun venit înapoi.\n\nDomeniu activ: ${domainLabel}\nProiecte finalizate: ${p.projectsDone}\n\nCe construim azi?`
    }])
  }

  const handleOnboard = () => {
    if (step === 0) {
      if (!nameInput.trim()) return
      setStep(1)
    } else {
      const age = parseInt(ageInput)
      if (isNaN(age) || age < 13 || age > 18) return
      setStep(2)
      setPhase('domain')
    }
  }

  const handleDomainSelect = (domainId: string) => {
    setSelectedDomain(domainId)
    const domainLabel = DOMAINS.find(d => d.id === domainId)?.label || domainId
    const age = parseInt(ageInput)
    const p: TeenProfile = {
      name: nameInput.trim(),
      age,
      domain: domainId,
      projectsDone: 0,
      currentStreak: 0
    }
    saveProfile(p)
    setPhase('chat')
    setMessages([{
      role: 'assistant',
      content: `${p.name}.\n\nDomeniu selectat: ${domainLabel}\n\nSpune-mi ce vrei să construiești. Un proiect real, finalizat în 3 zile. Nu teorie — output concret, partajabil.\n\nCe ai în minte?`
    }])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    const thinkingPhrases = ['analizez...', 'construiesc planul...', 'structurez taskurile...']
    let ti = 0
    const thinkId = setInterval(() => {
      setThinking(thinkingPhrases[ti % thinkingPhrases.length])
      ti++
    }, 800)

    const domainLabel = DOMAINS.find(d => d.id === selectedDomain)?.label || selectedDomain

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, { role: 'user', content: userMsg }],
        systemContext: `Ești Wisp, un co-creator AI pentru ${profile?.name || 'un adolescent'} de ${profile?.age || 16} ani, domeniu: ${domainLabel}.
Personalitate: direct, respectuos, ton de egal. NU ești profesor. Ești un senior care lucrează cu ei.
Vorbești scurt — maxim 4 propoziții per răspuns. Fără motivational speech.
Când adolescentul îți spune ce vrea să construiască, răspunzi cu un plan concret de 3 zile:
- Zi 1: [output concret]
- Zi 2: [output concret]  
- Zi 3: [output final + share]
Fiecare zi are 2-3 taskuri de 20 de minute. Output-ul trebuie să fie real și partajabil.
Dacă nu e clar ce vrea să construiască, pune O singură întrebare precisă.
Răspunde în română. Fără emoji excesiv.`
      })
    })

    clearInterval(thinkId)
    setThinking('')
    const data = await res.json()

    // detectează dacă răspunsul conține un plan de 3 zile
    const hasThreeDayPlan = data.message.includes('Zi 1') || data.message.includes('zi 1') ||
      data.message.includes('Day 1') || data.message.includes('ziua 1')

    setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    setLoading(false)

    if (hasThreeDayPlan && profile) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Plan generat. Vrei să activăm proiectul și să începem Ziua 1?`
        }])
      }, 800)
    }
  }

  const activateProject = async () => {
    if (!profile) return
    setLoading(true)

    // extrage titlul proiectului din conversație
    const lastMessages = messages.slice(-6).map(m => m.content).join('\n')

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `Din această conversație, extrage: titlul proiectului (max 4 cuvinte), domeniul, și 9 taskuri concrete (3 per zi, câte 20 minute fiecare). Conversație: ${lastMessages}` }],
        systemContext: `Răspunde DOAR cu JSON valid, fără text înainte sau după, fără markdown, fără backticks:
{"title":"titlu proiect","domain":"domeniu","emoji":"un emoji relevant","description":"descriere 1 propoziție","tasks":[{"text":"task 1","day":1},{"text":"task 2","day":1},{"text":"task 3","day":1},{"text":"task 4","day":2},{"text":"task 5","day":2},{"text":"task 6","day":2},{"text":"task 7","day":3},{"text":"task 8","day":3},{"text":"task 9","day":3}]}`
      })
    })

    const data = await res.json()
    setLoading(false)

    try {
      const raw = data.message.trim().replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(raw)
      const newProject: Project = {
        id: Date.now(),
        title: parsed.title || 'Proiect nou',
        domain: parsed.domain || selectedDomain,
        emoji: parsed.emoji || '◻',
        description: parsed.description || '',
        daysLeft: 3,
        createdAt: new Date().toLocaleDateString('ro-RO'),
        tasks: parsed.tasks.map((t: { text: string; day: number }, i: number) => ({
          id: i,
          text: t.text,
          done: false,
          day: t.day
        }))
      }
      saveProject(newProject)
      setActiveDay(1)
      setPhase('build')
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Descrie mai exact ce vrei să construiești și reîncerc generarea planului.'
      }])
    }
  }

  const toggleTask = (taskId: number) => {
    if (!project) return
    const updated = {
      ...project,
      tasks: project.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
    }
    saveProject(updated)
  }

  const completedToday = project?.tasks.filter(t => t.day === activeDay && t.done).length || 0
  const totalToday = project?.tasks.filter(t => t.day === activeDay).length || 0
  const allCompleted = project?.tasks.every(t => t.done) || false

  // ── ONBOARDING ──
  if (phase === 'onboarding') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4"
        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');`}</style>

        <div className="w-full max-w-md">
          <div className="mb-12">
            <p className="text-emerald-400 text-xs mb-2 tracking-widest">WISP_TEEN v2.0</p>
            <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">
              {step === 0 ? 'identificare' : 'vârstă'}
            </h1>
            <div className="flex gap-1 mt-3">
              <div className={`h-0.5 w-8 ${step >= 0 ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
              <div className={`h-0.5 w-8 ${step >= 1 ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
              <div className={`h-0.5 w-8 bg-zinc-700`} />
            </div>
          </div>

          {step === 0 ? (
            <div>
              <p className="text-zinc-500 text-sm mb-6">
                <span className="text-zinc-400">$</span> cum te cheamă?
              </p>
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOnboard()}
                placeholder="numele tău_"
                autoFocus
                className="w-full bg-transparent border-b border-zinc-700 focus:border-emerald-500 text-zinc-100 text-xl py-3 outline-none placeholder-zinc-700 transition-colors"
              />
              <button onClick={handleOnboard}
                className="mt-8 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
                next <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <div>
              <p className="text-zinc-500 text-sm mb-6">
                <span className="text-zinc-400">$</span> câți ani ai, {nameInput}?
              </p>
              <input
                value={ageInput}
                onChange={e => setAgeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOnboard()}
                placeholder="13–18_"
                type="number"
                min="13" max="18"
                autoFocus
                className="w-full bg-transparent border-b border-zinc-700 focus:border-emerald-500 text-zinc-100 text-xl py-3 outline-none placeholder-zinc-700 transition-colors"
              />
              <button onClick={handleOnboard}
                className="mt-8 flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
                next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── DOMAIN SELECT ──
  if (phase === 'domain') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4"
        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');`}</style>

        <div className="w-full max-w-lg">
          <div className="mb-10">
            <p className="text-emerald-400 text-xs mb-2 tracking-widest">WISP_TEEN v2.0</p>
            <h1 className="text-3xl font-bold tracking-tight">domeniu</h1>
            <div className="flex gap-1 mt-3">
              <div className="h-0.5 w-8 bg-emerald-400" />
              <div className="h-0.5 w-8 bg-emerald-400" />
              <div className="h-0.5 w-8 bg-emerald-400" />
            </div>
          </div>
          <p className="text-zinc-500 text-sm mb-8">
            <span className="text-zinc-400">$</span> ce construiești, {nameInput}?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {DOMAINS.map(d => (
              <button
                key={d.id}
                onClick={() => handleDomainSelect(d.id)}
                className="group text-left p-4 border border-zinc-800 hover:border-emerald-600 bg-zinc-900/50 hover:bg-zinc-900 rounded-lg transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-400 font-bold">{d.emoji}</span>
                  <span className="text-zinc-200 text-sm font-medium">{d.label}</span>
                </div>
                <p className="text-zinc-600 text-xs leading-relaxed">{d.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── BUILD MODE ──
  if (phase === 'build' && project) {
    const dayTasks = project.tasks.filter(t => t.day === activeDay)

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col"
        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');`}</style>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 text-sm font-bold">WISP</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400 text-sm">{project.emoji} {project.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTimerActive(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-all ${
                timerActive
                  ? 'border-emerald-700 text-emerald-400 bg-emerald-950/50'
                  : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
              }`}
            >
              <Clock size={11} />
              {formatTime(sessionTimer)}
            </button>
            <button
              onClick={() => { setPhase('chat'); setMessages([]); initChat(profile!) }}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              + nou
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 border-r border-zinc-800/60 bg-zinc-900/20 flex flex-col">
            {/* Project info */}
            <div className="p-4 border-b border-zinc-800/40">
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs mb-3">
                <FolderOpen size={11} />
                <span>proiect</span>
              </div>
              <p className="text-zinc-300 text-xs font-medium mb-1">{project.title}</p>
              <p className="text-zinc-600 text-xs mb-3 leading-relaxed">{project.description}</p>
              <DayBar day={activeDay - 1} />
            </div>

            {/* Day tabs */}
            <div className="p-3 border-b border-zinc-800/40">
              <div className="flex items-center gap-1.5 text-zinc-600 text-xs mb-2">
                <GitBranch size={10} />
                <span>zile</span>
              </div>
              {[1, 2, 3].map(d => {
                const dayDone = project.tasks.filter(t => t.day === d && t.done).length
                const dayTotal = project.tasks.filter(t => t.day === d).length
                return (
                  <button
                    key={d}
                    onClick={() => setActiveDay(d)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs mb-1 transition-all ${
                      activeDay === d
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
                    }`}
                  >
                    <span>ziua {d}</span>
                    <span className={dayDone === dayTotal ? 'text-emerald-500' : 'text-zinc-700'}>
                      {dayDone}/{dayTotal}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Stats */}
            <div className="p-4 mt-auto">
              <div className="text-zinc-700 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span>completate</span>
                  <span className="text-zinc-500">{project.tasks.filter(t => t.done).length}/9</span>
                </div>
                <div className="flex justify-between">
                  <span>început</span>
                  <span className="text-zinc-500">{project.createdAt}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Day header */}
            <div className="px-6 py-4 border-b border-zinc-800/40">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-zinc-200 font-bold text-lg">ziua {activeDay}</h2>
                  <p className="text-zinc-600 text-xs mt-0.5">{completedToday}/{totalToday} taskuri completate</p>
                </div>
                {completedToday === totalToday && totalToday > 0 && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-950/40 border border-emerald-900/40 px-3 py-1.5 rounded">
                    <Zap size={12} />
                    ziua completă
                  </div>
                )}
              </div>
              {/* progress */}
              <div className="mt-3 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-0.5 bg-emerald-500 transition-all duration-500"
                  style={{ width: totalToday > 0 ? `${(completedToday / totalToday) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Tasks */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {allCompleted ? (
                <div className="text-center py-16">
                  <p className="text-emerald-400 text-2xl font-bold mb-2">proiect finalizat.</p>
                  <p className="text-zinc-500 text-sm mb-8">Ai construit ceva real în 3 zile.</p>
                  <button
                    onClick={() => {
                      localStorage.removeItem('wisp-teen-project')
                      const updated = { ...profile!, projectsDone: (profile?.projectsDone || 0) + 1 }
                      saveProfile(updated)
                      setPhase('chat')
                      setMessages([{
                        role: 'assistant',
                        content: `${profile?.name}. Proiect ${project.title} — finalizat.\n\nProiecte totale: ${updated.projectsDone}\n\nCe construim acum?`
                      }])
                    }}
                    className="text-sm border border-zinc-700 hover:border-emerald-600 text-zinc-300 hover:text-emerald-400 px-6 py-3 rounded transition-all"
                  >
                    proiect nou →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayTasks.map((task, i) => (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all group ${
                        task.done
                          ? 'border-zinc-800/30 bg-zinc-900/20 opacity-50'
                          : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-900/70'
                      }`}
                    >
                      {task.done
                        ? <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                        : <Circle size={16} className="text-zinc-700 mt-0.5 shrink-0 group-hover:text-zinc-500" />
                      }
                      <div className="flex-1">
                        <p className={`text-sm ${task.done ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                          {task.text}
                        </p>
                        <p className="text-zinc-700 text-xs mt-1">~20 min</p>
                      </div>
                      <span className="text-zinc-800 text-xs font-mono mt-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── CHAT ──
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col"
      style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');`}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <TerminalSquare size={14} className="text-emerald-400" />
          <span className="text-emerald-400 text-sm font-bold">WISP</span>
          <span className="text-zinc-700 text-xs">/ {profile?.name || '...'}</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-600 text-xs">
          <span>{DOMAINS.find(d => d.id === selectedDomain)?.emoji} {DOMAINS.find(d => d.id === selectedDomain)?.label}</span>
          <span>·</span>
          <span>{profile?.projectsDone || 0} proiecte</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <span className="text-emerald-400 text-xs mr-3 mt-1 shrink-0 font-bold">W</span>
            )}
            <div className={`max-w-lg text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'text-zinc-300 bg-zinc-800/50 px-4 py-3 rounded-lg'
                : 'text-zinc-300'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 text-xs font-bold">W</span>
            <span className="text-zinc-600 text-xs">{thinking}<Cursor /></span>
          </div>
        )}

        {/* Activate project button */}
        {!loading && messages.length > 2 && messages[messages.length - 1]?.content?.includes('activăm') && (
          <div className="flex justify-start pl-6">
            <button
              onClick={activateProject}
              className="flex items-center gap-2 text-xs border border-emerald-700 text-emerald-400 hover:bg-emerald-950/50 px-4 py-2.5 rounded transition-all"
            >
              <Zap size={12} />
              activează proiectul →
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-zinc-800/60">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 text-sm shrink-0">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="ce construiești_"
            className="flex-1 bg-transparent text-zinc-200 text-sm outline-none placeholder-zinc-700 caret-emerald-400"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="text-zinc-600 hover:text-emerald-400 disabled:opacity-20 transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}