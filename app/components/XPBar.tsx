'use client'
import { getLevel, getNextLevel, BADGES, type MotivationState } from '../lib/motivation'

interface Props {
  state: MotivationState
  newBadges?: string[]
}

export default function XPBar({ state, newBadges = [] }: Props) {
  const current = getLevel(state.xp)
  const next = getNextLevel(state.xp)
  const progress = next
    ? ((state.xp - current.minXP) / (next.minXP - current.minXP)) * 100
    : 100

  return (
    <div className="bg-gray-900 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-white text-sm font-medium">{current.name}</span>
          <span className="text-gray-500 text-xs ml-2">Nv. {current.level}</span>
        </div>
        <div className="text-right">
          <span className="text-purple-400 text-sm font-medium">{state.xp} XP</span>
          {next && <span className="text-gray-600 text-xs ml-1">/ {next.minXP}</span>}
        </div>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div
          className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>🔥 {state.streak} zile streak</span>
        <span>{state.totalSessions} sesiuni</span>
        {state.graceDayUsed && <span className="text-amber-500">zi de grație folosită</span>}
      </div>

      {newBadges.length > 0 && (
        <div className="border border-purple-800 bg-purple-950 rounded-lg p-3 space-y-1">
          <p className="text-purple-300 text-xs font-medium">Badge nou deblocat</p>
          {newBadges.map(id => {
            const badge = BADGES.find(b => b.id === id)
            return badge ? (
              <p key={id} className="text-white text-sm">{badge.label}</p>
            ) : null
          })}
        </div>
      )}

      {state.badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {state.badges.map(id => {
            const badge = BADGES.find(b => b.id === id)
            return badge ? (
              <span key={id} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                {badge.label}
              </span>
            ) : null
          })}
        </div>
      )}
    </div>
  )
}