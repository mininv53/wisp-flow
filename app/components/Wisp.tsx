'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Star, Zap, RotateCcw, ExternalLink, Copy, Check } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Puzzle {
  id: number
  question: string
  options: string[]
  correct: number
  explanation: string
  subject: string
  emoji: string
}

interface ChildProfile {
  name: string
  age: number
  stars: number
  sessionsCompleted: number
}

interface StarDot {
  width: number; height: number; top: number; left: number
  opacity: number; duration: number; delay: number
}

interface SessionRecord {
  date: string; mood: string; duration: number
  starsEarned: number; puzzlesDone: number
}

interface PuzzleRecord {
  subject: string; emoji: string; correct: boolean; date: string
}

const PUZZLES: Puzzle[] = [
  { id: 1, subject: 'Matematică', emoji: '🔢', question: 'Un dragon are 4 labe. Dacă 3 dragoni se adună la petrecere, câte labe sunt în total?', options: ['8 labe', '12 labe', '10 labe', '6 labe'], correct: 1, explanation: '3 dragoni × 4 labe = 12 labe! Petrecerea e mare! 🐉' },
  { id: 2, subject: 'Logică', emoji: '🧩', question: 'Mama are 3 copii: Luni, Marți și... cum se numește al treilea?', options: ['Miercuri', 'Joi', 'Cum ai spus tu', 'Vineri'], correct: 2, explanation: 'Ai spus tu "al treilea" — deci tu ești al treilea copil! 😄' },
  { id: 3, subject: 'Natură', emoji: '🌿', question: 'Ce face o plantă cu lumina soarelui?', options: ['Se ascunde de ea', 'Face mâncare din ea', 'O trimite la prieteni', 'O pictează'], correct: 1, explanation: 'Plantele fac mâncare din lumină, apă și aer — fotosinteză! ☀️' },
  { id: 4, subject: 'Matematică', emoji: '🔢', question: 'Dacă ai 10 bomboane și dai jumătate prietenului tău, câte îți rămân?', options: ['3', '6', '5', '4'], correct: 2, explanation: 'Jumătate din 10 este 5. Ești generos! 🍬' },
  { id: 5, subject: 'Logică', emoji: '🧩', question: 'Ce este mereu înaintea ta dar nu poate fi văzut?', options: ['Umbra', 'Viitorul', 'Aerul', 'Norocul'], correct: 1, explanation: 'Viitorul este mereu înaintea ta! 🚀' },
  { id: 6, subject: 'Știință', emoji: '🔬', question: 'De ce cerul este albastru?', options: ['E vopsit de îngeri', 'Lumina se împrăștie în atmosferă', 'Reflectă oceanul', 'E culoarea preferată a Pământului'], correct: 1, explanation: 'Lumina soarelui se împrăștie în atmosferă și albastrul ajunge la ochii noștri! 🌈' },
  { id: 7, subject: 'Matematică', emoji: '🔢', question: 'Un tren are 5 vagoane. Fiecare vagon are 8 scaune. Câte scaune are trenul?', options: ['35', '45', '40', '30'], correct: 2, explanation: '5 vagoane × 8 scaune = 40 scaune. 🚂' },
  { id: 8, subject: 'Geografie', emoji: '🌍', question: 'Care este cel mai mare ocean de pe Pământ?', options: ['Atlanticul', 'Indianul', 'Arcticul', 'Pacificul'], correct: 3, explanation: 'Oceanul Pacific acoperă aproape jumătate din Pământ! 🌊' },
]

function StarBackground() {
  const [stars, setStars] = useState<StarDot[]>([])
  useEffect(() => {
    setStars([...Array(30)].map(() => ({
      width: Math.random() * 3 + 1, height: Math.random() * 3 + 1,
      top: Math.random() * 100, left: Math.random() * 100,
      opacity: Math.random() * 0.6 + 0.2,
      duration: Math.random() * 3 + 2, delay: Math.random() * 3,
    })))
  }, [])
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s, i) => (
        <div key={i} className="absolute rounded-full bg-white" style={{
          width: s.width + 'px', height: s.height + 'px',
          top: s.top + '%', left: s.left + '%', opacity: s.opacity,
          animation: `pulse ${s.duration}s ease-in-out infinite`,
          animationDelay: s.delay + 's',
        }} />
      ))}
    </div>
  )
}

function RobotFace({ mood, talking }: { mood: 'happy' | 'thinking' | 'excited' | 'idle'; talking: boolean }) {
  const eyeColor = mood === 'excited' ? '#fbbf24' : mood === 'thinking' ? '#60a5fa' : '#34d399'
  const mouthPath = mood === 'happy' || mood === 'excited' ? 'M 30 58 Q 50 70 70 58' : mood === 'thinking' ? 'M 35 62 Q 50 58 65 62' : 'M 32 60 Q 50 68 68 60'
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: 'drop-shadow(0 4px 12px rgba(99,102,241,0.4))' }}>
      <line x1="50" y1="8" x2="50" y2="20" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="6" r="4" fill={mood === 'excited' ? '#fbbf24' : '#818cf8'}>
        {talking && <animate attributeName="r" values="4;6;4" dur="0.5s" repeatCount="indefinite" />}
      </circle>
      <rect x="15" y="20" width="70" height="60" rx="16" fill="#1e1b4b" stroke="#4338ca" strokeWidth="2" />
      <rect x="22" y="27" width="56" height="46" rx="10" fill="#0f0a2e" />
      <ellipse cx="36" cy="48" rx="9" ry="9" fill={eyeColor} opacity="0.9">
        {mood === 'thinking' && <animate attributeName="ry" values="9;3;9" dur="2s" repeatCount="indefinite" />}
        {talking && <animate attributeName="opacity" values="0.9;0.6;0.9" dur="0.3s" repeatCount="indefinite" />}
      </ellipse>
      <ellipse cx="64" cy="48" rx="9" ry="9" fill={eyeColor} opacity="0.9">
        {mood === 'thinking' && <animate attributeName="ry" values="9;3;9" dur="2s" repeatCount="indefinite" />}
        {talking && <animate attributeName="opacity" values="0.9;0.6;0.9" dur="0.3s" repeatCount="indefinite" />}
      </ellipse>
      <circle cx="39" cy="45" r="2.5" fill="white" opacity="0.7" />
      <circle cx="67" cy="45" r="2.5" fill="white" opacity="0.7" />
      <path d={mouthPath} stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round">
        {talking && <animate attributeName="d" values={`${mouthPath};M 35 62 Q 50 55 65 62;${mouthPath}`} dur="0.4s" repeatCount="indefinite" />}
      </path>
      {(mood === 'happy' || mood === 'excited') && (
        <><ellipse cx="26" cy="60" rx="5" ry="3" fill="#f472b6" opacity="0.4" /><ellipse cx="74" cy="60" rx="5" ry="3" fill="#f472b6" opacity="0.4" /></>
      )}
      <circle cx="15" cy="50" r="4" fill="#312e81" stroke="#4338ca" strokeWidth="1.5" />
      <circle cx="85" cy="50" r="4" fill="#312e81" stroke="#4338ca" strokeWidth="1.5" />
    </svg>
  )
}

function StarBar({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={15} className={i < (count % 6) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'} />
      ))}
    </div>
  )
}

// ── Parent link button ──
function ParentLink({ profileName }: { profileName: string }) {
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const id = btoa(`${profileName}-wisp`).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)
    localStorage.setItem('wisp-parent-id', id)
    const base = window.location.origin
    setLink(`${base}/parinte/${id}`)
  }, [profileName])

  const copy = async () => {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <button
        onClick={() => setShow(v => !v)}
        className="flex items-center gap-1.5 text-xs text-indigo-400/60 hover:text-indigo-400 transition-colors"
      >
        <ExternalLink size={11} /> Dashboard parental
      </button>
      {show && (
        <div className="mt-2 bg-indigo-950/60 border border-indigo-800/40 rounded-xl p-3">
          <p className="text-indigo-300 text-[10px] mb-2">Trimite acest link părintelui:</p>
          <div className="flex items-center gap-2">
            <p className="flex-1 text-[10px] text-indigo-200/50 font-mono truncate">{link}</p>
            <button onClick={copy} className="shrink-0 flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
              {copied ? <Check size={10} /> : <Copy size={10} />}
              {copied ? 'ok' : 'copiază'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Wisp() {
  const [phase, setPhase] = useState<'onboarding' | 'chat' | 'puzzle' | 'timer' | 'celebrate'>('onboarding')
  const [onboardStep, setOnboardStep] = useState(0)
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState(0)
  const [nameInput, setNameInput] = useState('')
  const [profile, setProfile] = useState<ChildProfile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [robotMood, setRobotMood] = useState<'happy' | 'thinking' | 'excited' | 'idle'>('happy')
  const [robotTalking, setRobotTalking] = useState(false)
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null)
  const [puzzleAnswered, setPuzzleAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(-1)
  const [timerSeconds, setTimerSeconds] = useState(8 * 60)
  const [timerActive, setTimerActive] = useState(false)
  const [sessionPuzzlesDone, setSessionPuzzlesDone] = useState(0)
  const [sessionStart] = useState(Date.now())
  const [sessionMood, setSessionMood] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('wisp-profile')
    if (saved) {
      const p: ChildProfile = JSON.parse(saved)
      setProfile(p); setChildName(p.name); setChildAge(p.age)
      setPhase('chat')
      startSession(p)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!timerActive) return
    if (timerSeconds === 0) { setTimerActive(false); setPhase('celebrate'); awardStars(2); return }
    const id = setInterval(() => setTimerSeconds(s => s - 1), 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timerSeconds])

  const saveProfile = (p: ChildProfile) => { setProfile(p); localStorage.setItem('wisp-profile', JSON.stringify(p)) }

  const awardStars = (n: number) => {
    setProfile(prev => {
      if (!prev) return prev
      const updated = { ...prev, stars: prev.stars + n }
      localStorage.setItem('wisp-profile', JSON.stringify(updated))
      return updated
    })
  }

  // ── Save session record for parent dashboard ──
  const saveSessionRecord = (mood: string, puzzlesDone: number, starsEarned: number) => {
    const existing: SessionRecord[] = JSON.parse(localStorage.getItem('wisp-sessions-full') || '[]')
    const durationMin = Math.round((Date.now() - sessionStart) / 60000)
    const newRecord: SessionRecord = {
      date: new Date().toLocaleDateString('ro-RO'),
      mood,
      duration: Math.max(durationMin, 1),
      starsEarned,
      puzzlesDone,
    }
    const updated = [...existing.slice(-29), newRecord]
    localStorage.setItem('wisp-sessions-full', JSON.stringify(updated))
  }

  const savePuzzleRecord = (puzzle: Puzzle, correct: boolean) => {
    const existing: PuzzleRecord[] = JSON.parse(localStorage.getItem('wisp-puzzles-full') || '[]')
    const newRecord: PuzzleRecord = {
      subject: puzzle.subject,
      emoji: puzzle.emoji,
      correct,
      date: new Date().toLocaleDateString('ro-RO'),
    }
    const updated = [...existing.slice(-99), newRecord]
    localStorage.setItem('wisp-puzzles-full', JSON.stringify(updated))
  }

  const startSession = (p: ChildProfile) => {
    setRobotMood('excited'); setRobotTalking(true)
    const greeting = p.sessionsCompleted === 0
      ? `Bună, ${p.name}! 🤖 Eu sunt WISP — robotul tău de aventuri! Ești gata să explorăm împreună? Spune-mi ce îți place cel mai mult: animale, spațiu, dinozauri sau magie?`
      : `Bună, ${p.name}! 🤖 Wisp e fericit că te vede din nou! Ai ${p.stars} stele strânse — ești super! Ce vrei să explorăm azi?`
    setTimeout(() => setRobotTalking(false), 3000)
    setMessages([{ role: 'assistant', content: greeting }])
  }

  const handleOnboard = () => {
    if (onboardStep === 0) {
      if (!nameInput.trim()) return
      setChildName(nameInput.trim()); setOnboardStep(1); setNameInput('')
    } else {
      const age = parseInt(nameInput)
      if (isNaN(age) || age < 6 || age > 12) return
      setChildAge(age)
      const p: ChildProfile = { name: childName, age, stars: 0, sessionsCompleted: 0 }
      saveProfile(p); setPhase('chat'); startSession(p)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim(); setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true); setRobotMood('thinking')

    const res = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...messages, { role: 'user', content: userMsg }],
        systemContext: `Ești WISP, un robot prieten și companion de învățare pentru ${childName}, un copil de ${childAge} ani.
Personalitate: vesel, curios, entuziast, răbdător, jucăuș. Vorbești simplu și cald, cu emoji des.
Răspunsurile tale sunt scurte (max 3 propoziții). Transformi orice subiect într-o aventură.
La fiecare 2-3 mesaje propune să facem un "puzzle magic" sau o "misiune de 8 minute".
Nu ești profesor — ești cel mai cool prieten robot al copilului. Răspunde în română.`,
      }),
    })

    const data = await res.json()
    setRobotMood('happy'); setRobotTalking(true)
    setTimeout(() => setRobotTalking(false), 2000)
    setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    setLoading(false)
    if (messages.length > 0 && messages.length % 4 === 0 && sessionPuzzlesDone < 3) {
      setTimeout(() => suggestPuzzle(), 1500)
    }
  }

  const handleMood = (emoji: string) => {
    setSessionMood(emoji)
  }

  const suggestPuzzle = () => {
    const p = PUZZLES[Math.floor(Math.random() * PUZZLES.length)]
    setCurrentPuzzle(p); setPhase('puzzle'); setPuzzleAnswered(false); setSelectedAnswer(-1); setRobotMood('excited')
  }

  const handleAnswer = (idx: number) => {
    if (puzzleAnswered || !currentPuzzle) return
    setSelectedAnswer(idx); setPuzzleAnswered(true)
    const correct = idx === currentPuzzle.correct
    savePuzzleRecord(currentPuzzle, correct)
    if (correct) { setRobotMood('excited'); awardStars(1); setSessionPuzzlesDone(s => s + 1) }
    else setRobotMood('happy')
  }

  const formatTimer = () => {
    const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0')
    const s = (timerSeconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }
  const timerPct = ((8 * 60 - timerSeconds) / (8 * 60)) * 100

  // ── ONBOARDING ──
  if (phase === 'onboarding') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative"
        style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}>
        <StarBackground />
        <div className="relative z-10 w-full max-w-sm mx-4">
          <div className="text-center mb-8">
            <div className="w-28 h-28 mx-auto mb-4"><RobotFace mood="excited" talking={true} /></div>
            <h1 className="text-4xl font-black text-white mb-1 tracking-tight">WISP</h1>
            <p className="text-indigo-300 text-sm">Robotul tău de aventuri</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
            {onboardStep === 0 ? (
              <>
                <p className="text-white text-lg font-bold mb-1">Bună! 👋</p>
                <p className="text-indigo-200 text-sm mb-5">Cum te cheamă, aventurierule?</p>
                <input value={nameInput} onChange={e => setNameInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleOnboard()} placeholder="Numele tău..." autoFocus className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-indigo-300 text-base focus:outline-none focus:border-indigo-400 mb-4" />
                <button onClick={handleOnboard} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 rounded-2xl transition-all active:scale-95">Înainte! 🚀</button>
              </>
            ) : (
              <>
                <p className="text-white text-lg font-bold mb-1">Super, {childName}! 🤖</p>
                <p className="text-indigo-200 text-sm mb-5">Câți ani ai?</p>
                <input value={nameInput} onChange={e => setNameInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleOnboard()} placeholder="Vârsta ta (6–12)..." type="number" min="6" max="12" autoFocus className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-indigo-300 text-base focus:outline-none focus:border-indigo-400 mb-4" />
                <button onClick={handleOnboard} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 rounded-2xl transition-all active:scale-95">Să începem aventura! ⭐</button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── CELEBRATE ──
  if (phase === 'celebrate') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 relative"
        style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}>
        <StarBackground />
        <div className="relative z-10 text-center px-4">
          <div className="w-32 h-32 mx-auto mb-6"><RobotFace mood="excited" talking={true} /></div>
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-black text-white mb-2">Misiune completă!</h2>
          <p className="text-indigo-300 mb-2">Ai lucrat 8 minute concentrate!</p>
          <div className="flex items-center justify-center gap-2 text-yellow-400 text-xl font-bold mb-8">
            <Star className="fill-yellow-400" size={24} /> +2 stele câștigate!
          </div>
          <button
            onClick={() => {
              saveSessionRecord(sessionMood, sessionPuzzlesDone, 2)
              setPhase('chat'); setTimerSeconds(8 * 60)
              setMessages(prev => [...prev, { role: 'assistant', content: `Bravo, ${childName}! 🤖⭐ Ai terminat misiunea! Ce vrei să explorăm acum?` }])
            }}
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-8 rounded-2xl text-lg transition-all active:scale-95">
            Continuă aventura! 🚀
          </button>
        </div>
      </div>
    )
  }

  // ── PUZZLE ──
  if (phase === 'puzzle' && currentPuzzle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 flex flex-col"
        style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={() => setPhase('chat')} className="text-indigo-400 hover:text-white text-sm">← Înapoi</button>
          <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
            <Star size={15} className="fill-yellow-400" /> {profile?.stars ?? 0} stele
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-lg mx-auto w-full">
          <div className="w-24 h-24 mb-4">
            <RobotFace mood={puzzleAnswered && selectedAnswer === currentPuzzle.correct ? 'excited' : robotMood} talking={false} />
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 w-full">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{currentPuzzle.emoji}</span>
              <span className="text-indigo-300 text-xs font-bold uppercase tracking-wide">{currentPuzzle.subject}</span>
              <span className="ml-auto text-xs text-indigo-400 bg-indigo-900/50 px-2 py-1 rounded-full">Puzzle magic ✨</span>
            </div>
            <p className="text-white text-lg font-bold mb-5 leading-relaxed">{currentPuzzle.question}</p>
            <div className="space-y-2">
              {currentPuzzle.options.map((opt, idx) => {
                let cls = 'bg-white/5 border-white/10 text-white hover:bg-indigo-800/50 hover:border-indigo-400'
                if (puzzleAnswered) {
                  if (idx === currentPuzzle.correct) cls = 'bg-green-600/30 border-green-400 text-green-200'
                  else if (idx === selectedAnswer) cls = 'bg-red-600/30 border-red-400 text-red-200'
                  else cls = 'bg-white/5 border-white/5 text-gray-500'
                }
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)} disabled={puzzleAnswered}
                    className={`w-full text-left px-4 py-3 rounded-2xl border text-sm font-medium transition-all ${cls}`}>
                    <span className="text-indigo-400 mr-2">{['A', 'B', 'C', 'D'][idx]}.</span>{opt}
                  </button>
                )
              })}
            </div>
            {puzzleAnswered && (
              <div className={`mt-4 p-3 rounded-2xl text-sm font-medium ${selectedAnswer === currentPuzzle.correct ? 'bg-green-600/20 border border-green-500/30 text-green-200' : 'bg-blue-600/20 border border-blue-500/30 text-blue-200'}`}>
                {selectedAnswer === currentPuzzle.correct ? '🌟 Corect! ' : '💡 '}{currentPuzzle.explanation}
              </div>
            )}
          </div>
          {puzzleAnswered && (
            <button onClick={() => setPhase('chat')}
              className="mt-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-8 rounded-2xl transition-all active:scale-95">
              {selectedAnswer === currentPuzzle.correct ? '⭐ Super, continuăm!' : '🤖 Înțeles, continuăm!'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── TIMER ──
  if (phase === 'timer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 flex flex-col items-center justify-center"
        style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}>
        <div className="text-center px-4 max-w-sm">
          <div className="w-24 h-24 mx-auto mb-6"><RobotFace mood={timerActive ? 'thinking' : 'happy'} talking={timerActive} /></div>
          <h2 className="text-2xl font-black text-white mb-1">Misiune de focalizare</h2>
          <p className="text-indigo-300 text-sm mb-8">8 minute de super-concentrare!</p>
          <div className="relative w-48 h-48 mx-auto mb-8">
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 192 192">
              <circle cx="96" cy="96" r="80" fill="none" stroke="#312e81" strokeWidth="12" />
              <circle cx="96" cy="96" r="80" fill="none" stroke={timerActive ? '#818cf8' : '#4338ca'} strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 80}`} strokeDashoffset={`${2 * Math.PI * 80 * (1 - timerPct / 100)}`}
                strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-white font-mono">{formatTimer()}</span>
              <span className="text-indigo-400 text-xs mt-1">minute rămase</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setTimerActive(v => !v)}
              className={`py-3 px-8 rounded-2xl font-bold text-base transition-all active:scale-95 ${timerActive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-indigo-500 hover:bg-indigo-400 text-white'}`}>
              {timerActive ? '⏸ Pauză' : '▶ Start misiune!'}
            </button>
            <button onClick={() => { setPhase('chat'); setTimerActive(false); setTimerSeconds(8 * 60) }}
              className="py-3 px-4 rounded-2xl font-bold text-sm text-indigo-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1">
              <RotateCcw size={14} /> Înapoi
            </button>
          </div>
          {timerActive && <p className="text-indigo-400 text-xs mt-6 animate-pulse">🤖 Wisp e cu tine! Focusat pe misiune...</p>}
        </div>
      </div>
    )
  }

  // ── MAIN CHAT ──
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900"
      style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-indigo-950/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10"><RobotFace mood={robotMood} talking={robotTalking} /></div>
          <div>
            <p className="text-white font-black text-sm tracking-tight">WISP</p>
            <p className="text-indigo-400 text-xs">Robotul tău prieten</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <StarBar count={profile?.stars ?? 0} />
            <span className="text-yellow-400 text-xs font-bold">{profile?.stars ?? 0}</span>
          </div>
          <button onClick={() => { setPhase('timer'); setTimerSeconds(8 * 60) }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all">
            <Zap size={12} /> Misiune
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-9 h-9 shrink-0"><RobotFace mood={robotMood} talking={i === messages.length - 1 && robotTalking} /></div>
            )}
            <div className={`max-w-xs rounded-3xl px-4 py-3 text-sm leading-relaxed font-medium ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm border border-white/10'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-9 h-9 shrink-0"><RobotFace mood="thinking" talking={true} /></div>
            <div className="bg-white/10 border border-white/10 rounded-3xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map(d => <div key={d} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          </div>
        )}

        {/* Mood selector — first time */}
        {!sessionMood && messages.length === 1 && (
          <div className="flex items-end gap-2">
            <div className="w-9 h-9 shrink-0"><RobotFace mood="happy" talking={false} /></div>
            <div className="bg-white/10 border border-white/10 rounded-3xl rounded-bl-sm px-4 py-3">
              <p className="text-xs text-white/60 mb-2">Cum te simți azi?</p>
              <div className="flex gap-3">
                {['😊', '😐', '😴', '😰', '🔥'].map(e => (
                  <button key={e} onClick={() => handleMood(e)} className="text-xl hover:scale-125 transition-transform">{e}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
        {['🧩 Puzzle magic', '⏱ Misiune 8 min', '🌟 Ce am învățat?', '🐉 Povestește-mi ceva'].map(action => (
          <button key={action}
            onClick={() => {
              if (action.includes('Puzzle')) { suggestPuzzle(); return }
              if (action.includes('Misiune')) { setPhase('timer'); return }
              setInput(action.replace(/^\S+\s/, ''))
            }}
            className="shrink-0 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-medium px-3 py-2 rounded-full transition-all">
            {action}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-3 pt-2">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={`Spune ceva, ${childName || 'aventurierule'}...`}
            className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-indigo-400 focus:outline-none focus:border-indigo-400 transition-all" />
          <button onClick={handleSend} disabled={loading || !input.trim()}
            className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 text-white rounded-2xl px-4 py-3 transition-all active:scale-95">
            <Send size={18} />
          </button>
        </div>
        {/* Parent link */}
        {profile && (
          <div className="mt-2 px-1">
            <ParentLink profileName={profile.name} />
          </div>
        )}
      </div>
    </div>
  )
}