'use client'

import { useEffect, useState } from 'react'
import { Star, Zap, Trophy, Flame, Target, Brain } from 'lucide-react'

export interface Achievement {
  id: string
  type: 'badge' | 'levelup' | 'streak' | 'puzzle' | 'mission' | 'xp'
  title: string
  subtitle: string
  xp?: number
  level?: number
  emoji?: string
}

interface Props {
  achievement: Achievement | null
  onDone: () => void
  theme?: 'dark' | 'indigo' | 'zinc'
}

const CONFIGS = {
  badge:   { color: '#a855f7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.4)', Icon: Trophy  },
  levelup: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', Icon: Star    },
  streak:  { color: '#f97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', Icon: Flame   },
  puzzle:  { color: '#34d399', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.4)', Icon: Brain   },
  mission: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.4)', Icon: Target  },
  xp:      { color: '#a855f7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.4)', Icon: Zap     },
}

export default function AchievementPopup({ achievement, onDone, theme = 'dark' }: Props) {
  const [visible, setVisible] = useState(false)
  const [particles, setParticles] = useState<{ x: number; y: number; color: string; size: number; angle: number; speed: number }[]>([])

  useEffect(() => {
    if (!achievement) return
    setVisible(true)

    const colors = ['#a855f7', '#f59e0b', '#34d399', '#60a5fa', '#f97316', '#ec4899']
    setParticles([...Array(24)].map((_, i) => ({
      x: 50, y: 50,
      color: colors[i % colors.length],
      size: Math.random() * 6 + 4,
      angle: (i / 24) * 360,
      speed: Math.random() * 80 + 40,
    })))

    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 400)
    }, 2800)

    return () => clearTimeout(timer)
  }, [achievement])

  if (!achievement) return null

  const cfg = CONFIGS[achievement.type]
  const Icon = cfg.Icon

  const overlayBg = theme === 'indigo'
    ? 'rgba(15,10,46,0.85)'
    : theme === 'zinc'
    ? 'rgba(9,9,11,0.85)'
    : 'rgba(3,7,18,0.85)'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: overlayBg,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      onClick={() => { setVisible(false); setTimeout(onDone, 300) }}
    >
      {/* Particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size,
              borderRadius: i % 3 === 0 ? '50%' : '2px',
              background: p.color,
              transform: visible
                ? `translate(${Math.cos(p.angle * Math.PI / 180) * p.speed}px, ${Math.sin(p.angle * Math.PI / 180) * p.speed}px) rotate(${p.angle}deg)`
                : 'translate(0,0) rotate(0deg)',
              opacity: visible ? 0 : 1,
              transition: `transform ${0.6 + i * 0.02}s cubic-bezier(0.25,0.46,0.45,0.94), opacity ${0.8 + i * 0.02}s ease`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        style={{
          background: theme === 'indigo' ? '#0f0a2e' : theme === 'zinc' ? '#18181b' : '#0d0d0d',
          border: `1px solid ${cfg.border}`,
          borderRadius: 24,
          padding: '32px 40px',
          textAlign: 'center',
          maxWidth: 340,
          width: '90%',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)',
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: `0 0 60px ${cfg.color}22`,
        }}
      >
        {/* Icon ring */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: cfg.bg, border: `2px solid ${cfg.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          {achievement.emoji
            ? <span style={{ fontSize: 32 }}>{achievement.emoji}</span>
            : <Icon size={32} color={cfg.color} />
          }
        </div>

        {/* Type label */}
        <p style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
          color: cfg.color, textTransform: 'uppercase', marginBottom: 8,
        }}>
          {achievement.type === 'badge' ? 'Badge deblocat' :
           achievement.type === 'levelup' ? 'Level up!' :
           achievement.type === 'streak' ? 'Streak!' :
           achievement.type === 'puzzle' ? 'Puzzle rezolvat!' :
           achievement.type === 'mission' ? 'Misiune completă!' :
           'XP câștigat!'}
        </p>

        {/* Title */}
        <h2 style={{
          fontSize: 24, fontWeight: 800, color: '#ffffff',
          margin: '0 0 8px', lineHeight: 1.2,
        }}>
          {achievement.title}
        </h2>

        {/* Subtitle */}
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', lineHeight: 1.5 }}>
          {achievement.subtitle}
        </p>

        {/* XP pill */}
        {achievement.xp && achievement.xp > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 99, padding: '6px 16px',
            fontSize: 14, fontWeight: 700, color: cfg.color,
          }}>
            <Zap size={14} color={cfg.color} />
            +{achievement.xp} XP
          </div>
        )}

        {/* Level badge */}
        {achievement.level && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 99, padding: '6px 16px',
            fontSize: 14, fontWeight: 700, color: cfg.color, marginTop: 8,
          }}>
            <Star size={14} color={cfg.color} />
            Nivel {achievement.level}
          </div>
        )}

        {/* Tap hint */}
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 20, marginBottom: 0 }}>
          atinge pentru a continua
        </p>
      </div>
    </div>
  )
}