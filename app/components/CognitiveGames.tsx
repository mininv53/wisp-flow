'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
type GameId = 'schulte'|'memory'|'math'|'simon'|'stroop'|'oddone'|'reaction'|'numbermem'|'wordchain'|'categories'
type Product = 'junior'|'teen'|'flow'

interface GameScore { gameId: GameId; score: number; anon_id: string; product: Product }
interface LeaderEntry { anon_id: string; score: number; rank: number }

// ─── Supabase helpers ─────────────────────────────────────────────────────────
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

// ─── Game catalog ─────────────────────────────────────────────────────────────
const GAMES: { id: GameId; name: string; icon: string; cat: string; color: string; desc: string }[] = [
  { id: 'schulte', name: 'Schulte', icon: '🔢', cat: 'Concentrație', color: '#6C63FF', desc: 'Găsește numerele 1-25 în ordine' },
  { id: 'memory',  name: 'Memory',  icon: '🃏', cat: 'Memorie',      color: '#FF6584', desc: 'Găsește perechile de carduri' },
  { id: 'math',    name: 'Math Sprint', icon: '⚡', cat: 'Viteză',   color: '#43D9A3', desc: 'Calcule rapide — cât mai multe' },
  { id: 'simon',   name: 'Simon',   icon: '🎨', cat: 'Memorie',      color: '#FF9E3D', desc: 'Repetă secvența de culori' },
  { id: 'stroop',  name: 'Stroop',  icon: '🌈', cat: 'Concentrație', color: '#E040FB', desc: 'Culoarea, nu cuvântul!' },
  { id: 'oddone',  name: 'Odd One Out', icon: '🧩', cat: 'Logică',   color: '#00BCD4', desc: 'Care nu se potrivește?' },
  { id: 'reaction',name: 'Reaction', icon: '⚡', cat: 'Viteză',      color: '#FFEB3B', desc: 'Apasă cât mai repede' },
  { id: 'numbermem',name: 'Number Memory', icon: '🔢', cat: 'Memorie', color: '#4CAF50', desc: 'Memorează și repetă șirul' },
  { id: 'wordchain',name: 'Word Chain', icon: '📝', cat: 'Erudție',   color: '#FF5722', desc: 'Cuvântul următor — ultima literă' },
  { id: 'categories',name: 'Categorii', icon: '📚', cat: 'Erudție',   color: '#9C27B0', desc: 'Alege cuvintele din categorie' },
]

// ─── Individual Games ─────────────────────────────────────────────────────────

// SCHULTE TABLE
function SchulteGame({ onEnd }: { onEnd: (s: number) => void }) {
  const [nums] = useState(() => [...Array(25)].map((_, i) => i + 1).sort(() => Math.random() - .5))
  const [next, setNext] = useState(1)
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<number | null>(null)
  const [wrong, setWrong] = useState<number | null>(null)
  const handleClick = (n: number) => {
    if (n === next) {
      setFlash(n); setScore(s => s + 4); setNext(p => p + 1)
      setTimeout(() => setFlash(null), 300)
      if (next === 25) onEnd(score + 4)
    } else { setWrong(n); setTimeout(() => setWrong(null), 300) }
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, maxWidth: 280, margin: '0 auto' }}>
      {nums.map(n => (
        <button key={n} onClick={() => handleClick(n)} style={{
          width: 52, height: 52, borderRadius: 10, border: '1.5px solid rgba(255,255,255,.15)',
          background: flash === n ? '#6C63FF' : wrong === n ? '#FF4444' : 'rgba(255,255,255,.06)',
          color: 'white', fontSize: 18, fontWeight: 700, cursor: 'pointer',
          transition: 'all .15s', transform: flash === n ? 'scale(1.1)' : 'scale(1)'
        }}>{n}</button>
      ))}
    </div>
  )
}

// MEMORY CARDS
const CARD_EMOJIS = ['🦊','🐸','🦋','🌙','⭐','🎯','🔮','💎']
function MemoryGame({ onEnd }: { onEnd: (s: number) => void }) {
  const [cards] = useState(() => {
    const pairs = [...CARD_EMOJIS, ...CARD_EMOJIS].map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }))
    return pairs.sort(() => Math.random() - .5)
  })
  const [state, setState] = useState(cards)
  const [flipped, setFlipped] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [locked, setLocked] = useState(false)

  const flip = (id: number) => {
    if (locked || state[id].flipped || state[id].matched) return
    const nf = [...flipped, id]
    setState(s => s.map((c, i) => i === id ? { ...c, flipped: true } : c))
    if (nf.length === 2) {
      setLocked(true)
      const [a, b] = nf
      if (state[a].emoji === state[b].emoji) {
        const ns = state.map((c, i) => nf.includes(i) ? { ...c, matched: true, flipped: true } : c)
        setState(ns); setScore(s => s + 10); setFlipped([])
        setLocked(false)
        if (ns.filter(c => c.matched).length === 16) onEnd(score + 10)
      } else {
        setTimeout(() => {
          setState(s => s.map((c, i) => nf.includes(i) ? { ...c, flipped: false } : c))
          setFlipped([]); setLocked(false)
        }, 900)
      }
    } else { setFlipped(nf) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxWidth: 280, margin: '0 auto' }}>
      {state.map((c, i) => (
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

// MATH SPRINT
function MathGame({ onEnd }: { onEnd: (s: number) => void }) {
  const gen = () => {
    const ops = ['+', '-', '×']
    const op = ops[Math.floor(Math.random() * 3)]
    let a = Math.floor(Math.random() * 12) + 1, b = Math.floor(Math.random() * 12) + 1
    if (op === '-' && b > a) [a, b] = [b, a]
    const ans = op === '+' ? a + b : op === '-' ? a - b : a * b
    const wrongs = new Set<number>()
    while (wrongs.size < 3) { const w = ans + (Math.floor(Math.random() * 7) - 3); if (w !== ans) wrongs.add(w) }
    const opts = [...wrongs, ans].sort(() => Math.random() - .5)
    return { q: `${a} ${op} ${b}`, ans, opts }
  }
  const [q, setQ] = useState(gen)
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<'right' | 'wrong' | null>(null)

  const answer = (n: number) => {
    if (n === q.ans) { setFlash('right'); setScore(s => s + 5) }
    else { setFlash('wrong') }
    setTimeout(() => { setFlash(null); setQ(gen()) }, 300)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: 42, fontWeight: 800, color: flash === 'right' ? '#43D9A3' : flash === 'wrong' ? '#FF4444' : 'white',
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

// SIMON SAYS
const SIMON_COLORS = ['#FF4444', '#44FF88', '#4488FF', '#FFDD44']
function SimonGame({ onEnd }: { onEnd: (s: number) => void }) {
  const [seq, setSeq] = useState<number[]>([])
  const [userSeq, setUserSeq] = useState<number[]>([])
  const [active, setActive] = useState<number | null>(null)
  const [phase, setPhase] = useState<'show' | 'input' | 'win'>('show')
  const [score, setScore] = useState(0)

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
    if (ns[pos] !== seq[pos]) { onEnd(score); return }
    if (ns.length === seq.length) {
      const ns2 = [...seq, Math.floor(Math.random() * 4)]
      setScore(s => s + seq.length * 3); setUserSeq([])
      setSeq(ns2); playSeq(ns2)
    } else { setUserSeq(ns) }
  }

  return (
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
  )
}

// STROOP TEST
const STROOP_COLORS = [
  { name: 'ROȘU', hex: '#FF4444' }, { name: 'VERDE', hex: '#44FF88' },
  { name: 'ALBASTRU', hex: '#4488FF' }, { name: 'GALBEN', hex: '#FFDD44' }
]
function StroopGame({ onEnd }: { onEnd: (s: number) => void }) {
  const gen = () => {
    const word = STROOP_COLORS[Math.floor(Math.random() * 4)]
    let color = STROOP_COLORS[Math.floor(Math.random() * 4)]
    while (color.name === word.name) color = STROOP_COLORS[Math.floor(Math.random() * 4)]
    return { word: word.name, color: color.hex, answer: color.name }
  }
  const [q, setQ] = useState(gen)
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<'right' | 'wrong' | null>(null)

  const answer = (name: string) => {
    if (name === q.answer) { setFlash('right'); setScore(s => s + 6) }
    else setFlash('wrong')
    setTimeout(() => { setFlash(null); setQ(gen()) }, 300)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 8, letterSpacing: '.1em' }}>APASĂ CULOAREA TEXTULUI</div>
      <div style={{
        fontSize: 48, fontWeight: 900, color: q.color, marginBottom: 28,
        transition: 'color .15s', letterSpacing: 2
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

// ODD ONE OUT
const ODD_SETS = [
  { items: ['Câine', 'Pisică', 'Iepure', 'Morcov'], odd: 3, reason: 'legumă' },
  { items: ['Roșu', 'Albastru', 'Verde', 'Triunghi'], odd: 3, reason: 'formă' },
  { items: ['2', '4', '6', '7'], odd: 3, reason: 'număr impar' },
  { items: ['Paris', 'Londra', 'Madrid', 'Dunăre'], odd: 3, reason: 'râu' },
  { items: ['Mere', 'Pere', 'Mango', 'Ceapă'], odd: 3, reason: 'legumă' },
  { items: ['Chitară', 'Vioară', 'Pian', 'Tobă'], odd: 3, reason: 'percuție' },
  { items: ['Leu', 'Euro', 'Dolar', 'Platină'], odd: 3, reason: 'metal' },
  { items: ['Ianuarie', 'Martie', 'Iulie', 'Toamnă'], odd: 3, reason: 'anotimp' },
]
function OddOneGame({ onEnd }: { onEnd: (s: number) => void }) {
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<number | null>(null)
  const [wrong, setWrong] = useState<number | null>(null)
  const q = ODD_SETS[idx % ODD_SETS.length]

  const answer = (i: number) => {
    if (i === q.odd) { setFlash(i); setScore(s => s + 8) }
    else { setWrong(i) }
    setTimeout(() => { setFlash(null); setWrong(null); setIdx(p => p + 1) }, 500)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 16, letterSpacing: '.1em' }}>CARE NU SE POTRIVEȘTE?</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 260, margin: '0 auto' }}>
        {q.items.map((item, i) => (
          <button key={i} onClick={() => answer(i)} style={{
            padding: '16px 12px', borderRadius: 12, border: `1.5px solid ${flash === i ? '#44FF88' : wrong === i ? '#FF4444' : 'rgba(255,255,255,.12)'}`,
            background: flash === i ? 'rgba(68,255,136,.1)' : wrong === i ? 'rgba(255,68,68,.1)' : 'rgba(255,255,255,.05)',
            color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all .15s'
          }}>{item}</button>
        ))}
      </div>
    </div>
  )
}

// REACTION TIME
function ReactionGame({ onEnd }: { onEnd: (s: number) => void }) {
  const [state, setState] = useState<'wait' | 'ready' | 'go' | 'result'>('wait')
  const [score, setScore] = useState(0)
  const [rounds, setRounds] = useState(0)
  const [start, setStart] = useState(0)
  const [last, setLast] = useState(0)
  const timerRef = useRef<any>(null)

  const startRound = () => {
    setState('ready')
    const delay = 1500 + Math.random() * 2500
    timerRef.current = setTimeout(() => { setState('go'); setStart(Date.now()) }, delay)
  }

  const tap = () => {
    if (state === 'ready') { clearTimeout(timerRef.current); setState('wait'); return }
    if (state === 'go') {
      const t = Date.now() - start
      setLast(t)
      const pts = Math.max(0, Math.floor((600 - t) / 10))
      setScore(s => s + pts)
      const nr = rounds + 1; setRounds(nr)
      setState('result')
      if (nr >= 5) { setTimeout(() => onEnd(score + pts), 800) }
      else setTimeout(startRound, 1000)
    }
  }

  useEffect(() => { startRound() }, [])

  const colors: Record<string, string> = { wait: '#333', ready: '#FF9E3D', go: '#44FF88', result: '#6C63FF' }
  const labels: Record<string, string> = { wait: 'Pregătește-te...', ready: 'Fii gata!', go: 'ACUM!', result: `${last}ms` }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>Runda {rounds + 1}/5</div>
      <button onClick={tap} style={{
        width: 180, height: 180, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: colors[state], color: 'white', fontSize: state === 'go' ? 28 : 18,
        fontWeight: 800, transition: 'all .2s', boxShadow: state === 'go' ? `0 0 40px #44FF88` : 'none',
        transform: state === 'go' ? 'scale(1.05)' : 'scale(1)'
      }}>{labels[state]}</button>
    </div>
  )
}

// NUMBER MEMORY
function NumberMemGame({ onEnd }: { onEnd: (s: number) => void }) {
  const [level, setLevel] = useState(3)
  const [phase, setPhase] = useState<'show' | 'input'>('show')
  const [num, setNum] = useState('')
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<'right' | 'wrong' | null>(null)

  const genNum = useCallback((len: number) => [...Array(len)].map(() => Math.floor(Math.random() * 10)).join(''), [])

  useEffect(() => {
    const n = genNum(level); setNum(n); setPhase('show')
    setTimeout(() => setPhase('input'), level * 800 + 500)
  }, [level, genNum])

  const submit = () => {
    if (input === num) {
      setFlash('right'); setScore(s => s + level * 5); setInput('')
      setTimeout(() => { setFlash(null); setLevel(l => l + 1) }, 600)
    } else {
      setFlash('wrong')
      setTimeout(() => onEnd(score), 700)
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {phase === 'show' ? (
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>Memorează!</div>
          <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: 8, color: '#4CAF50' }}>{num}</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>Scrie ce ai văzut:</div>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            autoFocus
            style={{
              background: flash === 'right' ? 'rgba(76,175,80,.2)' : flash === 'wrong' ? 'rgba(255,68,68,.2)' : 'rgba(255,255,255,.08)',
              border: `1.5px solid ${flash === 'right' ? '#4CAF50' : flash === 'wrong' ? '#FF4444' : 'rgba(255,255,255,.2)'}`,
              borderRadius: 12, padding: '12px 20px', color: 'white', fontSize: 32, fontWeight: 700,
              outline: 'none', width: '100%', maxWidth: 240, textAlign: 'center', letterSpacing: 6,
              transition: 'all .2s'
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

// WORD CHAIN
const STARTER_WORDS = ['MARE', 'BLOC', 'CASA', 'ROZA', 'MINA', 'LUME', 'VIDA', 'NOTA']
function WordChainGame({ onEnd }: { onEnd: (s: number) => void }) {
  const [chain, setChain] = useState<string[]>([STARTER_WORDS[Math.floor(Math.random() * STARTER_WORDS.length)]])
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')

  const submit = () => {
    const w = input.trim().toUpperCase()
    const last = chain[chain.length - 1]
    if (w.length < 2) { setError('Prea scurt!'); return }
    if (w[0] !== last[last.length - 1]) { setError(`Trebuie să înceapă cu "${last[last.length - 1]}"!`); setTimeout(() => setError(''), 1200); return }
    if (chain.includes(w)) { setError('Deja folosit!'); setTimeout(() => setError(''), 1200); return }
    setChain(c => [...c, w]); setScore(s => s + w.length); setInput(''); setError('')
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>Ultimul cuvânt → prima literă a următorului</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16, maxHeight: 80, overflow: 'hidden' }}>
        {chain.slice(-6).map((w, i) => (
          <span key={i} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,87,34,.15)', border: '1px solid rgba(255,87,34,.3)', color: '#FF5722', fontSize: 13, fontWeight: 600 }}>{w}</span>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 6 }}>Trebuie să înceapă cu: <strong style={{ color: '#FF5722', fontSize: 18 }}>{chain[chain.length - 1].slice(-1)}</strong></div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus placeholder="Scrie un cuvânt…"
          style={{ background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.15)', borderRadius: 10, padding: '10px 14px', color: 'white', fontSize: 16, outline: 'none', width: 160 }} />
        <button onClick={submit} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#FF5722', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>→</button>
      </div>
      {error && <div style={{ marginTop: 8, fontSize: 12, color: '#FF4444' }}>{error}</div>}
    </div>
  )
}

// CATEGORIES
const CAT_QUESTIONS = [
  { cat: 'Animale', items: ['Leu', 'Masă', 'Tigru', 'Scaun', 'Elefant', 'Lampă'], correct: [0, 2, 4] },
  { cat: 'Fructe', items: ['Măr', 'Pâine', 'Portocală', 'Lapte', 'Banană', 'Ouă'], correct: [0, 2, 4] },
  { cat: 'Țări', items: ['Paris', 'România', 'Berlin', 'Franța', 'Madrid', 'Italia'], correct: [1, 3, 5] },
  { cat: 'Culori', items: ['Roșu', 'Triunghi', 'Verde', 'Cerc', 'Albastru', 'Pătrat'], correct: [0, 2, 4] },
  { cat: 'Sporturi', items: ['Fotbal', 'Chitară', 'Tenis', 'Vioară', 'Baschet', 'Pian'], correct: [0, 2, 4] },
]
function CategoriesGame({ onEnd }: { onEnd: (s: number) => void }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<'right' | 'wrong' | null>(null)
  const q = CAT_QUESTIONS[idx % CAT_QUESTIONS.length]

  const toggle = (i: number) => {
    setSelected(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i])
  }

  const submit = () => {
    const correct = JSON.stringify(selected.sort()) === JSON.stringify([...q.correct].sort())
    if (correct) { setFlash('right'); setScore(s => s + 10) }
    else setFlash('wrong')
    setTimeout(() => { setFlash(null); setSelected([]); setIdx(p => p + 1) }, 600)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>Selectează toate din categoria:</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#9C27B0', marginBottom: 16 }}>{q.cat}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 260, margin: '0 auto 14px' }}>
        {q.items.map((item, i) => (
          <button key={i} onClick={() => toggle(i)} style={{
            padding: '12px 8px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
            border: `1.5px solid ${selected.includes(i) ? '#9C27B0' : 'rgba(255,255,255,.12)'}`,
            background: selected.includes(i) ? 'rgba(156,39,176,.2)' : 'rgba(255,255,255,.05)',
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

// ─── Game Wrapper ─────────────────────────────────────────────────────────────
function GameScreen({ game, product, onBack }: { game: typeof GAMES[0]; product: Product; onBack: () => void }) {
  const [timeLeft, setTimeLeft] = useState(60)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing')
  const [leaders, setLeaders] = useState<LeaderEntry[]>([])
  const [myBest, setMyBest] = useState(0)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (timeLeft === 0 && phase === 'playing') handleEnd(score)
  }, [timeLeft])

  const handleEnd = async (finalScore: number) => {
    clearInterval(timerRef.current)
    setScore(finalScore); setPhase('ended')
    await saveScore(game.id, finalScore, product)
    const lb = await fetchLeader(game.id)
    setLeaders(lb)
    const best = parseInt(localStorage.getItem(`best-${game.id}`) || '0')
    if (finalScore > best) localStorage.setItem(`best-${game.id}`, String(finalScore))
    setMyBest(Math.max(finalScore, best))
  }

  const GAME_MAP: Record<GameId, React.ReactElement> = {
    schulte: <SchulteGame onEnd={handleEnd} />,
    memory: <MemoryGame onEnd={handleEnd} />,
    math: <MathGame onEnd={handleEnd} />,
    simon: <SimonGame onEnd={handleEnd} />,
    stroop: <StroopGame onEnd={handleEnd} />,
    oddone: <OddOneGame onEnd={handleEnd} />,
    reaction: <ReactionGame onEnd={handleEnd} />,
    numbermem: <NumberMemGame onEnd={handleEnd} />,
    wordchain: <WordChainGame onEnd={handleEnd} />,
    categories: <CategoriesGame onEnd={handleEnd} />,
  }

  const timePct = (timeLeft / 60) * 100
  const timeColor = timeLeft > 20 ? game.color : timeLeft > 10 ? '#FF9E3D' : '#FF4444'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', fontSize: 20, cursor: 'pointer', padding: 0 }}>←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{game.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{game.name}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: game.color }}>{score} pts</div>
      </div>

      {/* Timer bar */}
      <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, marginBottom: 16, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${timePct}%`, background: timeColor, borderRadius: 2, transition: 'width 1s linear, background .5s' }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 16, flexShrink: 0 }}>
        {timeLeft}s
      </div>

      {/* Game area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {phase === 'playing' ? GAME_MAP[game.id] : (
          <div style={{ textAlign: 'center', animation: 'fadeUp .4s ease-out' }}>
            <div style={{ fontSize: 48, marginBottom: 4 }}>🏆</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: game.color, marginBottom: 4 }}>{score}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 20 }}>Recordul tău: {myBest}</div>
            {leaders.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 8, letterSpacing: '.1em' }}>TOP 5</div>
                {leaders.map((l, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 12px', marginBottom: 4, background: l.anon_id === getAnonId().slice(0, 8) ? `${game.color}22` : 'rgba(255,255,255,.04)', borderRadius: 8, border: `0.5px solid ${l.anon_id === getAnonId().slice(0, 8) ? game.color + '44' : 'rgba(255,255,255,.06)'}` }}>
                    <span style={{ fontSize: 12, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,.4)' }}>{['🥇', '🥈', '🥉', '4.', '5.'][i]}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontFamily: 'monospace' }}>{l.anon_id}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: game.color }}>{l.score}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={onBack} style={{ padding: '10px 28px', borderRadius: 20, border: 'none', background: game.color, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>← Înapoi</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main CognitiveGames Component ────────────────────────────────────────────
export default function CognitiveGames({ product, onClose }: { product: Product; onClose: () => void }) {
  const [selected, setSelected] = useState<typeof GAMES[0] | null>(null)

  const themeColors: Record<Product, string> = {
    junior: '#7F77DD',
    teen: '#A0AAFF',
    flow: '#B4B2A9',
  }
  const tc = themeColors[product]

  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#080810', zIndex: 150,
      display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif',
      animation: 'fadeUp .35s ease-out'
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }
      `}</style>

      {selected ? (
        <GameScreen game={selected} product={product} onBack={() => setSelected(null)} />
      ) : (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '0.5px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>🧠 Antrenament Cognitiv</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>10 jocuri · 60 secunde fiecare</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>

          {/* Games grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', scrollbarWidth: 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {GAMES.map(g => {
                const best = typeof window !== 'undefined' ? parseInt(localStorage.getItem(`best-${g.id}`) || '0') : 0
                return (
                  <button key={g.id} onClick={() => setSelected(g)} style={{
                    background: 'rgba(255,255,255,.04)', border: `1px solid ${g.color}33`,
                    borderRadius: 14, padding: '14px 12px', cursor: 'pointer', textAlign: 'left',
                    transition: 'all .2s', position: 'relative', overflow: 'hidden'
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: g.color, opacity: .6 }} />
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{g.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>{g.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 6 }}>{g.cat}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', lineHeight: 1.4 }}>{g.desc}</div>
                    {best > 0 && (
                      <div style={{ marginTop: 8, fontSize: 10, color: g.color, fontWeight: 700 }}>Best: {best}</div>
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