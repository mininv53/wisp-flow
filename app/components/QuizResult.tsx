'use client'

import { useState } from 'react'
import { Star, Zap, Heart, ArrowRight } from 'lucide-react'
import type { QuizProduct } from './ConversationQuiz'
import type { QuizResult } from './ConversationQuiz'

interface Props {
  result: QuizResult
  product: QuizProduct
  userName: string
  xpEarned: number
  onContinue: () => void
}

const THEMES = {
  junior: { accent: '#818cf8', bg: 'from-indigo-950 via-purple-950 to-indigo-900', isGradient: true },
  teen:   { accent: '#34d399', bg: 'bg-zinc-950', isGradient: false },
  flow:   { accent: '#a855f7', bg: 'bg-gray-950', isGradient: false },
}

export default function QuizResult({ result, product, userName, xpEarned, onContinue }: Props) {
  const theme = THEMES[product]

  const containerClass = theme.isGradient
    ? `min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${theme.bg} px-4`
    : `min-h-screen flex flex-col items-center justify-center ${theme.bg} px-4`

  const icons = { junior: '🤖', teen: '⚡', flow: '🧠' }
  const labels = { junior: 'Wisp te-a analizat!', teen: 'analiză completă', flow: 'Reflecție zilnică' }

  return (
    <div className={containerClass} style={{ fontFamily: product === 'teen' ? "'JetBrains Mono', monospace" : 'system-ui' }}>
      <div className="w-full max-w-md space-y-4">

        {/* Icon */}
        <div className="text-center">
          <div className="text-5xl mb-2">{icons[product]}</div>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: theme.accent }}>
            {labels[product]}
          </p>
        </div>

        {/* Psych profile card */}
        <div className="rounded-3xl border p-6 space-y-4"
          style={{ background: `${theme.accent}10`, borderColor: `${theme.accent}30` }}>
          <div className="flex items-center gap-2">
            <Heart size={16} style={{ color: theme.accent }} />
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.accent }}>
              {product === 'junior' ? 'Ce am înțeles despre tine' : product === 'teen' ? 'profilul tău' : 'starea ta de azi'}
            </span>
          </div>
          <p className="text-white text-sm leading-relaxed">{result.psychProfile}</p>
        </div>

        {/* Recommendation */}
        <div className="rounded-3xl border p-5 space-y-2"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2">
            <ArrowRight size={14} style={{ color: theme.accent }} />
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.accent }}>
              {product === 'junior' ? 'Mâine explorăm' : product === 'teen' ? 'recomandare' : 'pentru mâine'}
            </span>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">{result.recommendation}</p>
        </div>

        {/* XP earned */}
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: `${theme.accent}15`, border: `1px solid ${theme.accent}30` }}>
            <Zap size={14} style={{ color: theme.accent }} />
            <span className="text-sm font-bold" style={{ color: theme.accent }}>+{xpEarned} XP</span>
          </div>
          {product === 'junior' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)' }}>
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">+1 stea</span>
            </div>
          )}
        </div>

        {/* Continue */}
        <button onClick={onContinue}
          className="w-full py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
          style={{ background: theme.accent, color: '#000' }}>
          {product === 'junior' ? 'Continuă aventura! 🚀' : product === 'teen' ? 'înapoi la proiect →' : 'Continuă ziua'}
        </button>
      </div>
    </div>
  )
}