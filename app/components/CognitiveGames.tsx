'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'

type GameId = 'schulte'|'memory'|'math'|'simon'|'stroop'|'oddone'|'reaction'|'numbermem'|'wordchain'|'categories'
type Product = 'junior'|'teen'|'flow'

interface LeaderEntry { anon_id: string; score: number; rank: number }

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getAnonId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let id = localStorage.getItem('wisp-anon-id')
  if (!id) { id = 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('wisp-anon-id', id) }
  return id
}

async function saveScore(gameId: GameId, score: number, product: Product) {
  if (!SB_URL || !SB_KEY) return
  await fetch(`${SB_URL}/rest/v1/game_scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` },
    body: JSON.stringify({ anon_id: getAnonId(), game_id: gameId, score, product })
  })
}

async function fetchLeader(gameId: GameId): Promise<LeaderEntry[]> {
  if (!SB_URL || !SB_KEY) return []
  const res = await fetch(`${SB_URL}/rest/v1/game_scores?game_id=eq.${gameId}&order=score.desc&limit=5`, {
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
  })
  const data = await res.json()
  return (data as any[]).map((d, i) => ({ anon_id: d.anon_id?.slice(0, 8) || '???', score: d.score, rank: i + 1 }))
}

const GAMES: { id: GameId; name: string; icon: string; cat: string; color: string; desc: string }[] = [
  { id: 'schulte',   name: 'Schulte',       icon: '🔢', cat: 'Concentrație', color: '#6C63FF', desc: 'Găsește numerele 1-25 în ordine' },
  { id: 'memory',    name: 'Memory',        icon: '🃏', cat: 'Memorie',      color: '#FF6584', desc: 'Găsește perechile de carduri' },
  { id: 'math',      name: 'Math Sprint',   icon: '⚡', cat: 'Viteză',       color: '#43D9A3', desc: 'Calcule rapide — cât mai multe' },
  { id: 'simon',     name: 'Simon',         icon: '🎨', cat: 'Memorie',      color: '#FF9E3D', desc: 'Repetă secvența de culori' },
  { id: 'stroop',    name: 'Stroop',        icon: '🌈', cat: 'Concentrație', color: '#E040FB', desc: 'Culoarea, nu cuvântul!' },
  { id: 'oddone',    name: 'Odd One Out',   icon: '🧩', cat: 'Logică',       color: '#00BCD4', desc: 'Care nu se potrivește?' },
  { id: 'reaction',  name: 'Reaction',      icon: '⚡', cat: 'Viteză',       color: '#FFEB3B', desc: 'Apasă cât mai repede' },
  { id: 'numbermem', name: 'Number Memory', icon: '🔢', cat: 'Memorie',      color: '#4CAF50', desc: 'Memorează și repetă șirul' },
  { id: 'wordchain', name: 'Word Chain',    icon: '📝', cat: 'Erudție',      color: '#FF5722', desc: 'Cuvântul următor — ultima literă' },
  { id: 'categories',name: 'Categorii',     icon: '📚', cat: 'Erudție',      color: '#9C27B0', desc: 'Alege cuvintele din categorie' },
]

// ─── SCHULTE ─────────────────────────────────────────────────────────────────
function SchulteGame({ onScore, onEnd }: { onScore:(s:number)=>void; onEnd: (s: number, correct: number) => void }) {
  const [nums] = useState(() => [...Array(25)].map((_, i) => i + 1).sort(() => Math.random() - .5))
  const [next, setNext] = useState(1)
  const scoreRef = useRef(0)
  const correctRef = useRef(0)
  const [flash, setFlash] = useState<number | null>(null)
  const [wrong, setWrong] = useState<number | null>(null)

  const handleClick = (n: number) => {
    if (n === next) {
      scoreRef.current += 4; correctRef.current += 1
      onScore(scoreRef.current)
      setFlash(n); setNext(p => p + 1)
      setTimeout(() => setFlash(null), 300)
      if (next === 25) onEnd(scoreRef.current, correctRef.current)
    } else { setWrong(n); setTimeout(() => setWrong(null), 300) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, maxWidth: 280, margin: '0 auto' }}>
      {nums.map(n => (
        <button key={n} onClick={() => handleClick(n)} style={{
          width: 52, height: 52, borderRadius: 10, border: '1.5px solid rgba(255,255,255,.15)',
          background: flash === n ? '#6C63FF' : wrong === n ? '#FF4444' : n < next ? 'rgba(108,99,255,.15)' : 'rgba(255,255,255,.06)',
          color: n < next ? 'rgba(255,255,255,.3)' : 'white', fontSize: 18, fontWeight: 700, cursor: 'pointer',
          transition: 'all .15s', transform: flash === n ? 'scale(1.1)' : 'scale(1)'
        }}>{n}</button>
      ))}
    </div>
  )
}

// ─── MEMORY ──────────────────────────────────────────────────────────────────
const CARD_EMOJIS = ['🦊','🐸','🦋','🌙','⭐','🎯','🔮','💎']
function MemoryGame({ onScore, onEnd }: { onScore:(s:number)=>void; onEnd: (s: number, correct: number) => void }) {
  const [cards, setCards] = useState(() =>
    [...CARD_EMOJIS, ...CARD_EMOJIS]
      .map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }))
      .sort(() => Math.random() - .5)
  )
  const [flipped, setFlipped] = useState<number[]>([])
  const [locked, setLocked] = useState(false)
  const scoreRef = useRef(0)
  const correctRef = useRef(0)

  const flip = (id: number) => {
    if (locked || cards[id].flipped || cards[id].matched) return
    const nf = [...flipped, id]
    setCards(s => s.map((c, i) => i === id ? { ...c, flipped: true } : c))
    if (nf.length === 2) {
      setLocked(true)
      const [a, b] = nf
      if (cards[a].emoji === cards[b].emoji) {
        setCards(s => {
          const ns = s.map((c, i) => nf.includes(i) ? { ...c, matched: true, flipped: true } : c)
          scoreRef.current += 10; correctRef.current += 1
          onScore(scoreRef.current)
          if (ns.filter(c => c.matched).length === 16) onEnd(scoreRef.current, correctRef.current)
          return ns
        })
        setFlipped([]); setLocked(false)
      } else {
        setTimeout(() => {
          setCards(s => s.map((c, i) => nf.includes(i) ? { ...c, flipped: false } : c))
          setFlipped([]); setLocked(false)
        }, 900)
      }
    } else { setFlipped(nf) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxWidth: 280, margin: '0 auto' }}>
      {cards.map((c, i) => (
        <div key={c.id} onClick={() => flip(i)} style={{
          width: 60, height: 60, borderRadius: 10, cursor: 'pointer',
          background: c.flipped || c.matched ? 'rgba(255,101,132,.2)' : 'rgba(255,255,255,.08)',
          border: `1.5px solid ${c.matched ? '#FF6584' : c.flipped ? 'rgba(255,101,132,.5)' : 'rgba(255,255,255,.12)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          transition: 'all .2s', opacity: c.matched ? 0.4 : 1
        }}>
          {(c.flipped || c.matched) ? c.emoji : '?'}
        </div>
      ))}
    </div>
  )
}

// ─── MATH ────────────────────────────────────────────────────────────────────
function MathGame({ onScore, onEnd }: { onScore:(s:number)=>void; onEnd: (s: number, correct: number) => void }) {
  const gen = () => {
    const ops = ['+', '-', '×']
    const op = ops[Math.floor(Math.random() * 3)]
    let a = Math.floor(Math.random() * 12) + 1, b = Math.floor(Math.random() * 12) + 1
    if (op === '-' && b > a) [a, b] = [b, a]
    const ans = op === '+' ? a + b : op === '-' ? a - b : a * b
    const wrongs = new Set<number>()
    while (wrongs.size < 3) { const w = ans + (Math.floor(Math.random() * 7) - 3); if (w !== ans) wrongs.add(w) }
    return { q: `${a} ${op} ${b}`, ans, opts: [...wrongs, ans].sort(() => Math.random() - .5) }
  }
  const [q, setQ] = useState(gen)
  const scoreRef = useRef(0)
  const correctRef = useRef(0)
  const [flash, setFlash] = useState<'right' | 'wrong' | null>(null)
  const [displayScore, setDisplayScore] = useState(0)

  const answer = (n: number) => {
    if (flash) return
    if (n === q.ans) {
      scoreRef.current += 5; correctRef.current += 1
      setDisplayScore(scoreRef.current)
      onScore(scoreRef.current)
      setFlash('right')
    } else {
      setFlash('wrong')
    }
    setTimeout(() => { setFlash(null); setQ(gen()) }, 350)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: 42, fontWeight: 800,
        color: flash === 'right' ? '#43D9A3' : flash === 'wrong' ? '#FF4444' : 'white',
        marginBottom: 28, transition: 'color .15s', letterSpacing: '-1px'
      }}>{q.q} = ?</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 240, margin: '0 auto' }}>
        {q.opts.map(o => (
          <button key={o} onClick={() => answer(o)} style={{
            padding: '14px 0', borderRadius: 12, border: '1.5px solid rgba(255,255,255,.15)',
            background: 'rgba(255,255,255,.06)', color: 'white', fontSize: 22, fontWeight: 700, cursor: 'pointer',
            transition: 'all .15s'
          }}>{o}</button>
        ))}
      </div>
    </div>
  )
}

// ─── SIMON ───────────────────────────────────────────────────────────────────
const SIMON_COLORS = ['#FF4444', '#44FF88', '#4488FF', '#FFDD44']
function SimonGame({ onScore, onEnd }: { onScore:(s:number)=>void; onEnd: (s: number, correct: number) => void }) {
  const [seq, setSeq] = useState<number[]>([])
  const [userSeq, setUserSeq] = useState<number[]>([])
  const [active, setActive] = useState<number | null>(null)
  const [phase, setPhase] = useState<'show' | 'input'>('show')
  const scoreRef = useRef(0)
  const correctRef = useRef(0)

  const playSeq = useCallback((s: number[]) => {
    setPhase('show')
    let i = 0
    const show = () => {
      if (i >= s.length) { setPhase('input'); return }
      setActive(s[i]); i++
      setTimeout(() => { setActive(null); setTimeout(show, 300) }, 500)
    }
    setTimeout(show, 600)
  }, [])

  useEffect(() => {
    const s = [Math.floor(Math.random() * 4)]
    setSeq(s); playSeq(s)
  }, [playSeq])

  const tap = (i: number) => {
    if (phase !== 'input') return
    const ns = [...userSeq, i]
    const pos = ns.length - 1
    if (ns[pos] !== seq[pos]) { onEnd(scoreRef.current, correctRef.current); return }
    if (ns.length === seq.length) {
      scoreRef.current += seq.length * 3; correctRef.current += 1
      onScore(scoreRef.current)
      const ns2 = [...seq, Math.floor(Math.random() * 4)]
      setUserSeq([]); setSeq(ns2); playSeq(ns2)
    } else { setUserSeq(ns) }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 12, letterSpacing: '.1em' }}>
        {phase === 'show' ? 'Urmărește secvența...' : `Repetă! (${userSeq.length}/${seq.length})`}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 220, margin: '0 auto' }}>
        {SIMON_COLORS.map((c, i) => (
          <button key={i} onClick={() => tap(i)} style={{
            width: 100, height: 100, borderRadius: 16, border: 'none', cursor: 'pointer',
            background: active === i ? c : `${c}44`,
            transform: active === i ? 'scale(1.08)' : 'scale(1)',
            transition: 'all .15s', boxShadow: active === i ? `0 0 24px ${c}` : 'none'
          }} />
        ))}
      </div>
    </div>
  )
}

// ─── STROOP ──────────────────────────────────────────────────────────────────
const STROOP_COLORS = [
  { name: 'ROȘU', hex: '#FF4444' }, { name: 'VERDE', hex: '#44FF88' },
  { name: 'ALBASTRU', hex: '#4488FF' }, { name: 'GALBEN', hex: '#FFDD44' }
]
function StroopGame({ onScore, onEnd }: { onScore:(s:number)=>void; onEnd: (s: number, correct: number) => void }) {
  const gen = () => {
    const word = STROOP_COLORS[Math.floor(Math.random() * 4)]
    let color = STROOP_COLORS[Math.floor(Math.random() * 4)]
    while (color.name === word.name) color = STROOP_COLORS[Math.floor(Math.random() * 4)]
    return { word: word.name, color: color.hex, answer: color.name }
  }
  const [q, setQ] = useState(gen)
  const scoreRef = useRef(0)
  const correctRef = useRef(0)
  const [flash, setFlash] = useState<'right' | 'wrong' | null>(null)

  const answer = (name: string) => {
    if (flash) return
    if (name === q.answer) {
      scoreRef.current += 6; correctRef.current += 1
      onScore(scoreRef.current)
      setFlash('right')
    } else setFlash('wrong')
    setTimeout(() => { setFlash(null); setQ(gen()) }, 300)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 8, letterSpacing: '.1em' }}>APASĂ CULOAREA TEXTULUI</div>
      <div style={{
        fontSize: 48, fontWeight: 900, color: q.color, marginBottom: 28,
        transition: 'color .15s', letterSpacing: 2,
        filter: flash === 'right' ? 'brightness(1.5)' : flash === 'wrong' ? 'brightness(0.5)' : 'none'
      }}>{q.word}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 240, margin: '0 auto' }}>
        {STROOP_COLORS.map(c => (
          <button key={c.name} onClick={() => answer(c.name)} style={{
            padding: '12px 0', borderRadius: 10, border: `1.5px solid ${c.hex}44`,
            background: `${c.hex}11`, color: c.hex, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            transition: 'all .15s'
          }}>{c.name}</button>
        ))}
      </div>
    </div>
  )
}

// ─── ODD ONE OUT ─────────────────────────────────────────────────────────────
const ODD_SETS = [
  { items: ['Câine', 'Pisică', 'Iepure', 'Morcov'], odd: 3 },
  { items: ['Roșu', 'Albastru', 'Verde', 'Triunghi'], odd: 3 },
  { items: ['2', '4', '6', '7'], odd: 3 },
  { items: ['Paris', 'Londra', 'Madrid', 'Dunăre'], odd: 3 },
  { items: ['Mere', 'Pere', 'Mango', 'Ceapă'], odd: 3 },
  { items: ['Chitară', 'Vioară', 'Pian', 'Tobă'], odd: 3 },
  { items: ['Leu', 'Euro', 'Dolar', 'Platină'], odd: 3 },
  { items: ['Ianuarie', 'Martie', 'Iulie', 'Toamnă'], odd: 3 },
]
function OddOneGame({ onScore, onEnd }: { onScore:(s:number)=>void; onEnd: (s: number, correct: number) => void }) {
  const [idx, setIdx] = useState(0)
  const scoreRef = useRef(0)
  const correctRef = useRef(0)
  const [flash, setFlash] = useState<number | null>(null)
  const [wrong, setWrong] = useState<number | null>(null)
  const q = ODD_SETS[idx % ODD_SETS.length]

  const answer = (i: number) => {
    if (flash !== null || wrong !== null) return
    if (i === q.odd) {
      scoreRef.current += 8; correctRef.current += 1
      onScore(scoreRef.current)
      setFlash(i)
    } else { setWrong(i) }
    setTimeout(() => { setFlash(null); setWrong(null); setIdx(p => p + 1) }, 500)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 16, letterSpacing: '.1em' }}>CARE NU SE POTRIVEȘTE?</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 260, margin: '0 auto' }}>
        {q.items.map((item, i) => (
          <button key={i} onClick={() => answer(i)} style={{
            padding: '16px 12px', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 600,
            border: `1.5px solid ${flash === i ? '#44FF88' : wrong === i ? '#FF4444' : 'rgba(255,255,255,.12)'}`,
            background: flash === i ? 'rgba(68,255,136,.1)' : wrong === i ? 'rgba(255,68,68,.1)' : 'rgba(255,255,255,.05)',
            color: 'white', transition: 'all .15s'
          }}>{item}</button>
        ))}
      </div>
    </div>
  )
}

// ─── REACTION ────────────────────────────────────────────────────────────────
function ReactionGame({ onScore, onEnd }: { onScore:(s:number)=>void; onEnd: (s: number, correct: number) => void }) {
  const [state, setState] = useState<'wait' | 'ready' | 'go' | 'result'>('wait')
  const scoreRef = useRef(0)
  const correctRef = useRef(0)
  const [rounds, setRounds] = useState(0)
  const [start, setStart] = useState(0)
  const [last, setLast] = useState(0)
  const timerRef = useRef<any>(null)

  const startRound = useCallback(() => {
    setState('ready')
    const delay = 1500 + Math.random() * 2500
    timerRef.current = setTimeout(() => { setState('go'); setStart(Date.now()) }, delay)
  }, [])

  const tap = () => {
    if (state === 'ready') { clearTimeout(timerRef.current); setState('wait'); setTimeout(startRound, 800); return }
    if (state === 'go') {
      const t = Date.now() - start
      setLast(t)
      const pts = Math.max(0, Math.floor((600 - t) / 10))
      scoreRef.current += pts; correctRef.current += 1
      onScore(scoreRef.current)
      const nr = rounds + 1; setRounds(nr)
      setState('result')
      if (nr >= 5) { setTimeout(() => onEnd(scoreRef.current, correctRef.current), 800) }
      else setTimeout(startRound, 1000)
    }
  }

  useEffect(() => { startRound() }, [startRound])
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const colors: Record<string, string> = { wait: '#1a1a2e', ready: '#FF9E3D', go: '#44FF88', result: '#6C63FF' }
  const labels: Record<string, string> = { wait: 'Pregătește-te...', ready: 'Fii gata!', go: 'ACUM!', result: `${last}ms` }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>Runda {Math.min(rounds + 1, 5)}/5</div>
      <button onClick={tap} style={{
        width: 180, height: 180, borderRadius: '50%', border: `2px solid ${colors[state]}`, cursor: 'pointer',
        background: colors[state], color: 'white', fontSize: state === 'go' ? 28 : 18,
        fontWeight: 800, transition: 'all .2s', boxShadow: state === 'go' ? `0 0 40px #44FF88` : 'none',
        transform: state === 'go' ? 'scale(1.05)' : 'scale(1)'
      }}>{labels[state]}</button>
      {last > 0 && state === 'result' && <div style={{ marginTop: 12, fontSize: 12, color: last < 300 ? '#44FF88' : 'rgba(255,255,255,.4)' }}>{last < 300 ? '⚡ Super rapid!' : last < 500 ? 'Bine!' : 'Mai rapid data viitoare'}</div>}
    </div>
  )
}

// ─── NUMBER MEMORY ───────────────────────────────────────────────────────────
function NumberMemGame({ onScore, onEnd }: { onScore:(s:number)=>void; onEnd: (s: number, correct: number) => void }) {
  const [level, setLevel] = useState(3)
  const [phase, setPhase] = useState<'show' | 'input'>('show')
  const [num, setNum] = useState('')
  const [input, setInput] = useState('')
  const scoreRef = useRef(0)
  const correctRef = useRef(0)
  const [flash, setFlash] = useState<'right' | 'wrong' | null>(null)

  const genNum = useCallback((len: number) => [...Array(len)].map(() => Math.floor(Math.random() * 10)).join(''), [])

  useEffect(() => {
    const n = genNum(level); setNum(n); setPhase('show'); setInput('')
    setTimeout(() => setPhase('input'), level * 800 + 500)
  }, [level, genNum])

  const submit = () => {
    if (input === num) {
      scoreRef.current += level * 5; correctRef.current += 1
      onScore(scoreRef.current)
      setFlash('right')
      setTimeout(() => { setFlash(null); setLevel(l => l + 1) }, 600)
    } else {
      setFlash('wrong')
      setTimeout(() => onEnd(scoreRef.current, correctRef.current), 700)
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 8 }}>Nivel {level - 2} — {level} cifre</div>
      {phase === 'show' ? (
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>Memorează!</div>
          <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: 8, color: '#4CAF50' }}>{num}</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>Scrie ce ai văzut:</div>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            autoFocus style={{
              background: flash === 'right' ? 'rgba(76,175,80,.2)' : flash === 'wrong' ? 'rgba(255,68,68,.2)' : 'rgba(255,255,255,.08)',
              border: `1.5px solid ${flash === 'right' ? '#4CAF50' : flash === 'wrong' ? '#FF4444' : 'rgba(255,255,255,.2)'}`,
              borderRadius: 12, padding: '12px 20px', color: 'white', fontSize: 32, fontWeight: 700,
              outline: 'none', width: '100%', maxWidth: 240, textAlign: 'center', letterSpacing: 6, transition: 'all .2s'
            }} />
          <button onClick={submit} style={{
            marginTop: 14, padding: '10px 32px', borderRadius: 20, border: 'none',
            background: '#4CAF50', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer'
          }}>OK</button>
        </div>
      )}
    </div>
  )
}

// ─── WORD CHAIN ──────────────────────────────────────────────────────────────
const STARTER_WORDS = ['MARE', 'BLOC', 'CASA', 'ROZA', 'MINA', 'LUME', 'VIDA', 'NOTA']
function WordChainGame({ onScore, onEnd }: { onScore:(s:number)=>void; onEnd: (s: number, correct: number) => void }) {
  const [chain, setChain] = useState<string[]>([STARTER_WORDS[Math.floor(Math.random() * STARTER_WORDS.length)]])
  const [input, setInput] = useState('')
  const scoreRef = useRef(0)
  const correctRef = useRef(0)
  const [error, setError] = useState('')

  const submit = () => {
    const w = input.trim().toUpperCase()
    const last = chain[chain.length - 1]
    if (w.length < 2) { setError('Prea scurt!'); return }
    if (w[0] !== last[last.length - 1]) { setError(`Trebuie să înceapă cu "${last[last.length - 1]}"!`); setTimeout(() => setError(''), 1200); return }
    if (chain.includes(w)) { setError('Deja folosit!'); setTimeout(() => setError(''), 1200); return }
    scoreRef.current += w.length; correctRef.current += 1
    onScore(scoreRef.current)
    setChain(c => [...c, w]); setInput(''); setError('')
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>Ultimul cuvânt → prima literă a următorului</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 12, maxHeight: 72, overflow: 'hidden' }}>
        {chain.slice(-5).map((w, i) => (
          <span key={i} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,87,34,.15)', border: '1px solid rgba(255,87,34,.3)', color: '#FF5722', fontSize: 12, fontWeight: 600 }}>{w}</span>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 8 }}>
        Trebuie să înceapă cu: <strong style={{ color: '#FF5722', fontSize: 20 }}>{chain[chain.length - 1].slice(-1)}</strong>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus placeholder="Scrie un cuvânt…" style={{
            background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.15)',
            borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 16, outline: 'none', width: 160
          }} />
        <button onClick={submit} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#FF5722', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>→</button>
      </div>
      {error && <div style={{ marginTop: 8, fontSize: 12, color: '#FF4444' }}>{error}</div>}
    </div>
  )
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
const CAT_QUESTIONS = [
  { cat: 'Animale', items: ['Leu', 'Masă', 'Tigru', 'Scaun', 'Elefant', 'Lampă'], correct: [0, 2, 4] },
  { cat: 'Fructe', items: ['Măr', 'Pâine', 'Portocală', 'Lapte', 'Banană', 'Ouă'], correct: [0, 2, 4] },
  { cat: 'Țări', items: ['Paris', 'România', 'Berlin', 'Franța', 'Madrid', 'Italia'], correct: [1, 3, 5] },
  { cat: 'Culori', items: ['Roșu', 'Triunghi', 'Verde', 'Cerc', 'Albastru', 'Pătrat'], correct: [0, 2, 4] },
  { cat: 'Sporturi', items: ['Fotbal', 'Chitară', 'Tenis', 'Vioară', 'Baschet', 'Pian'], correct: [0, 2, 4] },
  { cat: 'Planete', items: ['Marte', 'Oceanic', 'Venus', 'Atlantic', 'Jupiter', 'Pacific'], correct: [0, 2, 4] },
]
function CategoriesGame({ onScore, onEnd }: { onScore:(s:number)=>void; onEnd: (s: number, correct: number) => void }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const scoreRef = useRef(0)
  const correctRef = useRef(0)
  const [flash, setFlash] = useState<'right' | 'wrong' | null>(null)
  const q = CAT_QUESTIONS[idx % CAT_QUESTIONS.length]

  const toggle = (i: number) => setSelected(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i])

  const submit = () => {
    if (selected.length === 0) return
    const correct = JSON.stringify([...selected].sort((a,b)=>a-b)) === JSON.stringify([...q.correct].sort((a,b)=>a-b))
    if (correct) {
      scoreRef.current += 10; correctRef.current += 1
      onScore(scoreRef.current)
      setFlash('right')
    } else setFlash('wrong')
    setTimeout(() => { setFlash(null); setSelected([]); setIdx(p => p + 1) }, 600)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>Selectează toate din categoria:</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#9C27B0', marginBottom: 14 }}>{q.cat}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 260, margin: '0 auto 14px' }}>
        {q.items.map((item, i) => (
          <button key={i} onClick={() => toggle(i)} style={{
            padding: '12px 8px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
            border: `1.5px solid ${selected.includes(i) ? '#9C27B0' : 'rgba(255,255,255,.12)'}`,
            background: flash === 'right' && selected.includes(i) ? 'rgba(68,255,136,.15)' : flash === 'wrong' && selected.includes(i) ? 'rgba(255,68,68,.15)' : selected.includes(i) ? 'rgba(156,39,176,.2)' : 'rgba(255,255,255,.05)',
            color: selected.includes(i) ? '#CE93D8' : 'rgba(255,255,255,.8)', transition: 'all .15s'
          }}>{item}</button>
        ))}
      </div>
      <button onClick={submit} disabled={selected.length === 0} style={{
        padding: '10px 28px', borderRadius: 20, border: 'none',
        background: selected.length > 0 ? '#9C27B0' : 'rgba(255,255,255,.1)',
        color: 'white', fontSize: 14, fontWeight: 700, cursor: selected.length > 0 ? 'pointer' : 'default'
      }}>Confirmă</button>
    </div>
  )
}

// ─── GAME SCREEN ─────────────────────────────────────────────────────────────
function GameScreen({ game, product, onBack }: { game: typeof GAMES[0]; product: Product; onBack: () => void }) {
  const [timeLeft, setTimeLeft] = useState(60)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing')
  const [leaders, setLeaders] = useState<LeaderEntry[]>([])
  const [myBest, setMyBest] = useState(0)
  const timerRef = useRef<any>(null)
  const scoreRef = useRef(0)
  const correctRef = useRef(0)
  const endedRef = useRef(false)

  useEffect(() => {
    const best = parseInt(localStorage.getItem(`best-${game.id}`) || '0')
    setMyBest(best)
  }, [game.id])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleEnd(scoreRef.current, correctRef.current); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const handleScore = (s: number) => {
    scoreRef.current = s
    setScore(s)
  }

  const handleCorrect = (c: number) => {
    correctRef.current = c
    setCorrect(c)
  }

  const handleEnd = async (finalScore: number, finalCorrect: number) => {
    if (endedRef.current) return
    endedRef.current = true
    clearInterval(timerRef.current)
    setScore(finalScore); setCorrect(finalCorrect); setPhase('ended')
    const best = parseInt(localStorage.getItem(`best-${game.id}`) || '0')
    const newBest = Math.max(finalScore, best)
    if (finalScore > best) localStorage.setItem(`best-${game.id}`, String(finalScore))
    setMyBest(newBest)
    await saveScore(game.id, finalScore, product)
    const lb = await fetchLeader(game.id)
    setLeaders(lb)
  }

  const handleGameEnd = (s: number, c: number) => handleEnd(s, c)
  const handleGameScore = (s: number, c?: number) => {
    handleScore(s)
    if (c !== undefined) handleCorrect(c)
  }

  const timePct = (timeLeft / 60) * 100
  const timeColor = timeLeft > 20 ? game.color : timeLeft > 10 ? '#FF9E3D' : '#FF4444'
  const myAnonShort = getAnonId().slice(0, 8)
  const isNewBest = score > parseInt(localStorage.getItem(`best-${game.id}`) || '0') && phase === 'ended'

  const gameProps = {
    onScore: (s: number) => handleScore(s),
    onEnd: (s: number, c: number) => handleGameEnd(s, c),
  }

  const GAME_MAP: Record<GameId, React.ReactElement> = {
    schulte:    <SchulteGame    {...gameProps} />,
    memory:     <MemoryGame     {...gameProps} />,
    math:       <MathGame       {...gameProps} />,
    simon:      <SimonGame      {...gameProps} />,
    stroop:     <StroopGame     {...gameProps} />,
    oddone:     <OddOneGame     {...gameProps} />,
    reaction:   <ReactionGame   {...gameProps} />,
    numbermem:  <NumberMemGame  {...gameProps} />,
    wordchain:  <WordChainGame  {...gameProps} />,
    categories: <CategoriesGame {...gameProps} />,
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '14px 18px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', fontSize: 20, cursor: 'pointer', padding: 0 }}>←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{game.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{game.name}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: game.color }}>{score}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)' }}>pts</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 10, flexShrink: 0 }}>
        <div style={{ textAlign: 'center', padding: '4px 12px', background: 'rgba(255,255,255,.04)', borderRadius: 8, border: '0.5px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#44FF88' }}>{correct}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)' }}>corecte</div>
        </div>
        <div style={{ textAlign: 'center', padding: '4px 12px', background: 'rgba(255,255,255,.04)', borderRadius: 8, border: '0.5px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: game.color }}>{myBest || '—'}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)' }}>record tău</div>
        </div>
        <div style={{ textAlign: 'center', padding: '4px 12px', background: 'rgba(255,255,255,.04)', borderRadius: 8, border: '0.5px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: timeColor }}>{timeLeft}s</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)' }}>timp</div>
        </div>
      </div>

      {/* Timer bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2, marginBottom: 14, flexShrink: 0, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${timePct}%`, background: timeColor, borderRadius: 2, transition: 'width 1s linear, background .5s' }} />
      </div>

      {/* Game area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {phase === 'playing' ? GAME_MAP[game.id] : (
          <div style={{ textAlign: 'center', animation: 'fadeUp .4s ease-out', width: '100%' }}>
            <div style={{ fontSize: 36, marginBottom: 4 }}>{score > (myBest - score) ? '🏆' : '🎯'}</div>
            <div style={{ fontSize: 38, fontWeight: 900, color: game.color, marginBottom: 2 }}>{score}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>
              {correct} răspunsuri corecte
            </div>

            {/* Record personal */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20, marginBottom: 16,
              background: score >= myBest ? `${game.color}22` : 'rgba(255,255,255,.04)',
              border: `0.5px solid ${score >= myBest ? game.color + '44' : 'rgba(255,255,255,.08)'}`
            }}>
              <span style={{ fontSize: 12 }}>{score >= myBest ? '⭐ Nou record!' : `Record: ${myBest}`}</span>
              {score >= myBest && <span style={{ fontSize: 11, color: game.color, fontWeight: 700 }}>{myBest}</span>}
            </div>

            {/* Leaderboard */}
            {leaders.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', marginBottom: 8, letterSpacing: '.1em' }}>TOP GLOBAL</div>
                {leaders.map((l, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '5px 12px', marginBottom: 4,
                    background: l.anon_id === myAnonShort ? `${game.color}22` : 'rgba(255,255,255,.03)',
                    borderRadius: 8, border: `0.5px solid ${l.anon_id === myAnonShort ? game.color + '55' : 'rgba(255,255,255,.06)'}`
                  }}>
                    <span style={{ fontSize: 12, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,.3)' }}>
                      {['🥇', '🥈', '🥉', '4.', '5.'][i]}
                    </span>
                    <span style={{ fontSize: 11, color: l.anon_id === myAnonShort ? game.color : 'rgba(255,255,255,.5)', fontFamily: 'monospace' }}>
                      {l.anon_id === myAnonShort ? 'tu' : l.anon_id}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: game.color }}>{l.score}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => window.location.reload()} style={{
                padding: '10px 20px', borderRadius: 20, border: `1px solid ${game.color}44`,
                background: 'transparent', color: game.color, fontSize: 13, fontWeight: 700, cursor: 'pointer'
              }}>↺ Din nou</button>
              <button onClick={onBack} style={{
                padding: '10px 20px', borderRadius: 20, border: 'none',
                background: game.color, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer'
              }}>← Înapoi</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function CognitiveGames({ product, onClose }: { product: Product; onClose: () => void }) {
  const [selected, setSelected] = useState<typeof GAMES[0] | null>(null)
  const [bests, setBests] = useState<Record<string, number>>({})

  useEffect(() => {
    const b: Record<string, number> = {}
    GAMES.forEach(g => { b[g.id] = parseInt(localStorage.getItem(`best-${g.id}`) || '0') })
    setBests(b)
  }, [selected])

  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#080810', zIndex: 150,
      display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif',
      animation: 'fadeUp .35s ease-out'
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {selected ? (
        <GameScreen game={selected} product={product} onBack={() => setSelected(null)} />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '0.5px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>🧠 Antrenament Cognitiv</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>10 jocuri · 60 secunde fiecare</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', scrollbarWidth: 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {GAMES.map(g => {
                const best = bests[g.id] || 0
                return (
                  <button key={g.id} onClick={() => setSelected(g)} style={{
                    background: 'rgba(255,255,255,.04)', border: `1px solid ${g.color}33`,
                    borderRadius: 14, padding: '14px 12px', cursor: 'pointer', textAlign: 'left',
                    transition: 'all .2s', position: 'relative', overflow: 'hidden'
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: g.color, opacity: .6 }} />
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{g.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>{g.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 4 }}>{g.cat}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.22)', lineHeight: 1.4 }}>{g.desc}</div>
                    {best > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,.25)' }}>record</span>
                        <span style={{ fontSize: 12, color: g.color, fontWeight: 800 }}>{best}</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}