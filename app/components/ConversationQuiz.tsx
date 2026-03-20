'use client'

import { useState, useEffect } from 'react'
import { Send, X, RefreshCw } from 'lucide-react'

export type QuizProduct = 'junior' | 'teen' | 'flow'

export interface QuizQuestion {
  type: 'choice' | 'story' | 'visual' | 'open' | 'challenge' | 'reflection'
  question: string
  emoji?: string
  options?: { text: string; emoji?: string; value: string }[]
  storyContext?: string
  hint?: string
  psychInsight?: string
}

export interface QuizResult {
  answers: string[]
  psychProfile: string
  recommendation: string
}

interface Props {
  product: QuizProduct
  conversationSummary: string
  userName: string
  userAge?: number
  onComplete: (result: QuizResult) => void
  onDismiss: () => void
}

const PRODUCT_THEMES = {
  junior: {
    bg: 'from-indigo-950 via-purple-950 to-indigo-900',
    card: 'bg-white/10 border-white/20',
    accent: '#818cf8',
    accentBg: 'rgba(129,140,248,0.15)',
    label: 'Timp de explorat! 🤖',
    dismissText: 'Mai târziu',
    font: "'Nunito', system-ui, sans-serif",
  },
  teen: {
    bg: 'bg-zinc-950',
    card: 'bg-zinc-900/60 border-zinc-700/60',
    accent: '#34d399',
    accentBg: 'rgba(52,211,153,0.1)',
    label: 'check-in rapid',
    dismissText: 'skip',
    font: "'JetBrains Mono', monospace",
  },
  flow: {
    bg: 'bg-gray-950',
    card: 'bg-gray-800/80 border-gray-700/60',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.15)',
    label: 'Reflecție zilnică',
    dismissText: 'Sari peste',
    font: 'system-ui, sans-serif',
  },
}

export default function ConversationQuiz({ product, conversationSummary, userName, userAge, onComplete, onDismiss }: Props) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [openAnswer, setOpenAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [storyPath, setStoryPath] = useState<string[]>([])

  const theme = PRODUCT_THEMES[product]

  useEffect(() => { generateQuiz() }, [])

  const generateQuiz = async () => {
    setLoading(true)

    const prompts = {
      junior: `Ești WISP, un robot pentru copii. Analizează conversația și creează 3 întrebări interactive pentru ${userName} (${userAge} ani).
Mix de tipuri: o întrebare vizuală cu emoji, o alegere în poveste, o întrebare deschisă simplă.
Scopul: înțelege ce l-a impresionat, ce îl face fericit, ce îl îngrijorează.
Conversație: ${conversationSummary}`,

      teen: `Ești Wisp Teen. Analizează conversația cu ${userName} (${userAge || 16} ani) și creează 3 întrebări de check-in.
Mix: o întrebare despre proiectul lor, una psihologică (ce îl motivează sau frământă), una de reflecție creativă.
Fii direct, ca un senior — nu patronizant.
Conversație: ${conversationSummary}`,

      flow: `Ești Flow. Analizează conversația cu ${userName} și creează 3 întrebări de reflecție zilnică.
Mix: ce a realizat azi, cum se simte emoțional, ce vrea să facă mâine.
Scurt, cald, psihologic precis.
Conversație: ${conversationSummary}`,
    }

    const formatInstructions = `
Răspunde DOAR cu JSON valid:
{"questions":[
  {"type":"visual","question":"întrebare","emoji":"emoji reprezentativ","options":[{"text":"opțiune","emoji":"emoji","value":"valoare"},{"text":"opțiune2","emoji":"emoji2","value":"valoare2"},{"text":"opțiune3","emoji":"emoji3","value":"valoare3"}]},
  {"type":"story","question":"întrebare poveste","storyContext":"context scurt","options":[{"text":"alege asta","emoji":"emoji","value":"valoare"},{"text":"sau asta","emoji":"emoji","value":"valoare2"}]},
  {"type":"open","question":"întrebare deschisă","hint":"indiciu","psychInsight":"ce dezvăluie răspunsul despre personalitate"}
]}
Toate textele în română.`

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Generează quiz' }],
        systemContext: prompts[product] + formatInstructions
      })
    })

    const data = await res.json()
    try {
      const clean = data.message.trim().replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setQuestions(parsed.questions || [])
    } catch {
      // fallback questions
      const fallbacks: Record<QuizProduct, QuizQuestion[]> = {
        junior: [
          { type: 'visual', question: `${userName}, ce ți-a plăcut cel mai mult azi?`, emoji: '🌟',
            options: [{ text: 'Poveștile', emoji: '📖', value: 'stories' }, { text: 'Puzzle-urile', emoji: '🧩', value: 'puzzles' }, { text: 'Robotul', emoji: '🤖', value: 'robot' }] },
          { type: 'story', question: 'Ești în aventură și găsești o cutie misterioasă. Ce faci?',
            storyContext: '🏔️ Ești pe un munte înalt...',
            options: [{ text: 'O deschizi imediat', emoji: '🔓', value: 'brave' }, { text: 'Cauți indicii mai întâi', emoji: '🔍', value: 'curious' }] },
          { type: 'open', question: 'Ce lucru nou ai aflat azi?', hint: 'Orice, chiar și mic!', psychInsight: 'curiosity_level' }
        ],
        teen: [
          { type: 'visual', question: 'Cum te simți cu proiectul tău acum?', emoji: '⚡',
            options: [{ text: 'Motivat', emoji: '🔥', value: 'motivated' }, { text: 'Blocat', emoji: '🧱', value: 'stuck' }, { text: 'Ok', emoji: '😐', value: 'neutral' }] },
          { type: 'open', question: 'Ce te-a surprins cel mai mult azi?', hint: 'Orice idee, oricât de mică', psychInsight: 'openness' },
          { type: 'open', question: 'Dacă ai putea schimba un lucru la proiect, ce ar fi?', hint: 'Fii sincer', psychInsight: 'self_awareness' }
        ],
        flow: [
          { type: 'visual', question: 'Cum ți-a fost ziua în realitate?', emoji: '🌊',
            options: [{ text: 'Productivă', emoji: '✅', value: 'productive' }, { text: 'Grea', emoji: '😮‍💨', value: 'hard' }, { text: 'Mediocră', emoji: '😐', value: 'meh' }] },
          { type: 'open', question: 'Ce te-a blocat cel mai mult azi?', hint: 'Fii sincer cu tine', psychInsight: 'obstacles' },
          { type: 'open', question: 'Un lucru pe care vrei să-l faci diferit mâine?', hint: 'Oricât de mic', psychInsight: 'growth_mindset' }
        ]
      }
      setQuestions(fallbacks[product])
    }
    setLoading(false)
  }

  const answerQuestion = async (value: string) => {
    const newAnswers = [...answers, value]
    setAnswers(newAnswers)

    if (current < questions.length - 1) {
      setCurrent(c => c + 1)
      setOpenAnswer('')
    } else {
      // All answered — generate psych profile
      setAnalyzing(true)
      const analysisPrompts = {
        junior: `Analizează răspunsurile copilului ${userName} (${userAge} ani) la quiz și creează un profil psihologic simplu și pozitiv.
Răspunsuri: ${newAnswers.join(' | ')}
Întrebări: ${questions.map(q => q.question).join(' | ')}`,
        teen: `Analizează răspunsurile lui ${userName} (${userAge || 16} ani) și identifică: motivația principală, blocajele, potențialul.
Răspunsuri: ${newAnswers.join(' | ')}`,
        flow: `Analizează starea zilnică a lui ${userName} și oferă o recomandare psihologică precisă pentru mâine.
Răspunsuri: ${newAnswers.join(' | ')}`
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Analizează' }],
          systemContext: `${analysisPrompts[product]}
Răspunde cu JSON: {"psychProfile":"profil în 1-2 propoziții calde și precise","recommendation":"recomandare concretă pentru sesiunea/ziua următoare în 1 propoziție"}`
        })
      })

      const data = await res.json()
      setAnalyzing(false)
      let profile = { psychProfile: '', recommendation: '' }
      try {
        const clean = data.message.trim().replace(/```json|```/g, '').trim()
        profile = JSON.parse(clean)
      } catch {
        profile = {
          psychProfile: product === 'junior'
            ? `${userName} este curios și entuziast! Îi place să exploreze lucruri noi.`
            : product === 'teen'
            ? `${userName} are motivație autentică și gândire independentă.`
            : `Zi cu provocări reale. Ai performat bine în condiții dificile.`,
          recommendation: product === 'junior'
            ? 'Mâine explorăm ceva nou împreună!'
            : product === 'teen'
            ? 'Concentrează-te pe un singur task mâine.'
            : 'Începe mâine cu cel mai mic task posibil.'
        }
      }

      onComplete({ answers: newAnswers, psychProfile: profile.psychProfile, recommendation: profile.recommendation })
    }
  }

  const q = questions[current]
  const isGradient = product === 'junior'

  const containerClass = isGradient
    ? `min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${theme.bg} px-4`
    : `min-h-screen flex flex-col items-center justify-center ${theme.bg} px-4`

  if (loading || analyzing) {
    return (
      <div className={containerClass} style={{ fontFamily: theme.font }}>
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: theme.accent, borderTopColor: 'transparent' }} />
          <p className="text-sm animate-pulse" style={{ color: theme.accent }}>
            {analyzing
              ? product === 'junior' ? '🤖 WISP te analizează...' : product === 'teen' ? 'procesez...' : 'Flow reflectează...'
              : product === 'junior' ? '🤖 WISP pregătește întrebări speciale pentru tine...' : product === 'teen' ? 'se generează check-in-ul...' : 'se pregătește reflecția...'}
          </p>
        </div>
      </div>
    )
  }

  if (!q) return null

  return (
    <div className={containerClass} style={{ fontFamily: theme.font }}>
      {/* Header */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest" style={{ color: theme.accent }}>
          {theme.label.toUpperCase()}
        </span>
        <div className="flex items-center gap-3">
          {/* Progress dots */}
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all"
                style={{ background: i <= current ? theme.accent : 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>
          <button onClick={onDismiss} className="opacity-40 hover:opacity-70 transition-opacity">
            <X size={16} color="white" />
          </button>
        </div>
      </div>

      {/* Card */}
      <div className={`w-full max-w-md rounded-3xl border p-6 ${theme.card}`}>

        {/* Visual question */}
        {q.type === 'visual' && (
          <div className="space-y-4">
            {q.emoji && <div className="text-5xl text-center">{q.emoji}</div>}
            <h2 className="text-white text-lg font-bold text-center leading-relaxed">{q.question}</h2>
            <div className="space-y-2">
              {q.options?.map((opt, i) => (
                <button key={i} onClick={() => answerQuestion(opt.value)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: theme.accentBg, borderColor: theme.accent + '40', color: 'white' }}>
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm font-medium">{opt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Story question */}
        {q.type === 'story' && (
          <div className="space-y-4">
            {q.storyContext && (
              <div className="text-center p-3 rounded-2xl" style={{ background: theme.accentBg }}>
                <p className="text-white/70 text-sm italic leading-relaxed">{q.storyContext}</p>
              </div>
            )}
            <h2 className="text-white text-lg font-bold leading-relaxed">{q.question}</h2>
            <div className="space-y-2">
              {q.options?.map((opt, i) => (
                <button key={i} onClick={() => answerQuestion(opt.value)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: theme.accentBg, borderColor: theme.accent + '40', color: 'white' }}>
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm font-medium flex-1 text-left">{opt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Open question */}
        {q.type === 'open' && (
          <div className="space-y-4">
            <h2 className="text-white text-lg font-bold leading-relaxed">{q.question}</h2>
            {q.hint && <p className="text-xs opacity-50" style={{ color: 'white' }}>💡 {q.hint}</p>}
            <textarea
              value={openAnswer}
              onChange={e => setOpenAnswer(e.target.value)}
              placeholder={product === 'junior' ? 'Scrie ce gândești...' : product === 'teen' ? 'răspunsul tău_' : 'Scrie sincer...'}
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none resize-none"
              style={{ background: theme.accentBg, border: `1px solid ${theme.accent}40` }}
              rows={3}
              autoFocus
            />
            <button
              onClick={() => openAnswer.trim() && answerQuestion(openAnswer.trim())}
              disabled={!openAnswer.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-30"
              style={{ background: theme.accent, color: '#000' }}>
              <Send size={14} />
              {product === 'junior' ? 'Gata!' : product === 'teen' ? 'trimite →' : 'Continuă'}
            </button>
          </div>
        )}
      </div>

      {/* Dismiss */}
      <button onClick={onDismiss} className="mt-4 text-xs opacity-30 hover:opacity-60 transition-opacity" style={{ color: 'white' }}>
        {theme.dismissText}
      </button>
    </div>
  )
}